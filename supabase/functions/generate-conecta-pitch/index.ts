import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { company, position, area_of_expertise, bio, skills_tags, pitch_what_i_do, pitch_ideal_client } = await req.json();

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    
    // Build context from profile data
    const context = [
      company && `Empresa: ${company}`,
      position && `Cargo: ${position}`,
      area_of_expertise && `Área: ${area_of_expertise}`,
      bio && `Bio: ${bio}`,
      skills_tags?.length && `Habilidades: ${skills_tags.join(', ')}`,
      pitch_what_i_do && `O que faz atualmente: ${pitch_what_i_do}`,
      pitch_ideal_client && `Cliente ideal atual: ${pitch_ideal_client}`,
    ].filter(Boolean).join('\n');

    const prompt = `Você é uma consultora de networking e pitch para empreendedoras brasileiras. 
Com base nos dados profissionais abaixo, gere um elevator pitch estruturado em 3 partes.
Responda APENAS em JSON válido, sem markdown, com as chaves: pitch_what_i_do, pitch_ideal_client, pitch_how_to_refer.

Dados:
${context}

Regras:
- pitch_what_i_do: Descreva os serviços/produtos de forma clara e atrativa (2-4 frases)
- pitch_ideal_client: Defina o perfil do cliente ideal de forma específica (2-3 frases)
- pitch_how_to_refer: Instrução prática de como indicar essa profissional (1-2 frases)
- Tom profissional mas acolhedor
- Linguagem no feminino
- Foque no valor que a profissional entrega`;

    if (PERPLEXITY_API_KEY) {
      const response = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sonar",
          messages: [
            { role: "system", content: "Você responde apenas em JSON válido." },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Perplexity error: ${err}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const pitch = JSON.parse(jsonMatch[0]);
        return new Response(JSON.stringify(pitch), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Fallback: generate simple pitch from data
    const fallback = {
      pitch_what_i_do: area_of_expertise 
        ? `Atuo na área de ${area_of_expertise}${company ? ` através da ${company}` : ''}, oferecendo soluções especializadas para quem busca resultados concretos.`
        : `${company ? `Na ${company}, ` : ''}ofereço serviços profissionais focados em resultados e qualidade.`,
      pitch_ideal_client: pitch_ideal_client || 'Empresas e profissionais que buscam parceiras comprometidas com excelência e resultados.',
      pitch_how_to_refer: `Me apresente para pessoas que precisam de ${area_of_expertise || 'serviços profissionais'}. O melhor caminho é ${pitch_what_i_do ? 'entrar em contato diretamente' : 'me enviar uma mensagem'}.`,
    };

    return new Response(JSON.stringify(fallback), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[GENERATE-CONECTA-PITCH] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
