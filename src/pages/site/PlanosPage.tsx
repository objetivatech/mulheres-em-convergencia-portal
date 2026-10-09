import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { Check, Minus, UserPlus, CreditCard, Sparkles } from 'lucide-react';
import SiteLayout from '@/components/site/SiteLayout';
import TextoSite from '@/components/site/TextoSite';
import CobrancaDialog from '@/components/site/CobrancaDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { supabase } from '@/integrations/supabase/client';
import { usePlanos, dinheiro, type Plano } from '@/hooks/usePlanosEventos';
import { AREAS } from '@/hooks/usePainelPlanosEventos';

const PERIODOS = [
  { valor: 'mensal', rotulo: 'Mensal', sufixo: '/mês', meses: 1 },
  { valor: 'semestral', rotulo: 'Semestral', sufixo: '/semestre', meses: 6 },
  { valor: 'anual', rotulo: 'Anual', sufixo: '/ano', meses: 12 },
];
const SUFIXO: Record<string, string> = { mensal: '/mês', trimestral: '/trimestre', semestral: '/semestre', anual: '/ano', unico: '' };

const familia = (p: Plano) => (p.grupo?.trim() || p.nome).trim();

function useFaqPlanos() {
  return useQuery({
    queryKey: ['faq-planos'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('faq_planos').select('id, pergunta, resposta').eq('ativo', true).order('ordem');
      return (data ?? []) as { id: string; pergunta: string; resposta: string }[];
    },
  });
}

export default function PlanosPage() {
  const { data: planos, isLoading } = usePlanos();
  const { data: faq = [] } = useFaqPlanos();
  const [escolhido, setEscolhido] = useState<Plano | null>(null);

  const periodosDisponiveis = useMemo(
    () => PERIODOS.filter((per) => planos?.some((p) => p.periodicidade === per.valor)),
    [planos]
  );
  const [periodo, setPeriodo] = useState<string | null>(null);
  const periodoAtivo = periodo ?? periodosDisponiveis[0]?.valor ?? 'mensal';

  // Uma coluna por família; preço conforme o período escolhido.
  const colunas = useMemo(() => {
    const mapa = new Map<string, Plano[]>();
    for (const p of planos ?? []) {
      const f = familia(p);
      mapa.set(f, [...(mapa.get(f) ?? []), p]);
    }
    return [...mapa.entries()].map(([nome, versoes]) => {
      const atual = versoes.find((v) => v.periodicidade === periodoAtivo)
        ?? (periodosDisponiveis.length ? null : versoes[0]);
      const mensal = versoes.find((v) => v.periodicidade === 'mensal');
      return { nome, versoes, atual, mensal };
    });
  }, [planos, periodoAtivo, periodosDisponiveis.length]);

  const linhasAreas = AREAS.filter((a) => planos?.some((p) => (p.tipos ?? [p.tipo]).includes(a.valor)));
  const temDesconto = planos?.some((p) => (p.desconto_evento_percentual ?? 0) > 0);
  const meses = PERIODOS.find((p) => p.valor === periodoAtivo)?.meses ?? 1;

  return (
    <SiteLayout>
      <Helmet>
        <title>Planos de assinatura | Mulheres em Convergência</title>
        <meta name="description" content="Compare os planos, veja o que cada um libera e escolha mensal, semestral ou anual." />
      </Helmet>

      <section className="border-b border-border bg-surface-quente">
        <div className="container mx-auto max-w-2xl space-y-4 px-4 py-14 text-center">
          <TextoSite as="h1" chave="planos.titulo" padrao="Planos" className="text-3xl font-semibold tracking-tight lg:text-4xl" />
          <TextoSite as="p" chave="planos.subtitulo" padrao="Faça parte da rede: seu negócio no diretório, presença nos encontros e acesso à comunidade." className="text-muted-foreground" />
        </div>
      </section>

      {/* Como funciona */}
      <section className="container mx-auto px-4 py-12">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {[
            { icone: UserPlus, chave: 'passo1', t: '1. Crie sua conta', d: 'Leva um minuto. Só precisamos do seu nome, e-mail e CPF.' },
            { icone: CreditCard, chave: 'passo2', t: '2. Escolha e pague', d: 'Pix, boleto ou cartão. Escolha mensal, semestral ou anual.' },
            { icone: Sparkles, chave: 'passo3', t: '3. Tudo liberado', d: 'Com o pagamento confirmado, as áreas do plano abrem sozinhas na sua Minha Área.' },
          ].map(({ icone: Icone, chave, t, d }) => (
            <div key={chave} className="rounded-xl border border-border bg-card p-6 text-center">
              <Icone className="mx-auto mb-3 h-8 w-8 text-primary" />
              <TextoSite as="h3" chave={`planos.${chave}.titulo`} padrao={t} className="font-semibold" />
              <TextoSite as="p" chave={`planos.${chave}.texto`} padrao={d} className="mt-1 text-sm text-muted-foreground" />
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-14">
        {isLoading ? (
          <Skeleton className="mx-auto h-96 max-w-5xl rounded-xl" />
        ) : !planos?.length ? (
          <p className="text-center text-muted-foreground">Os planos estão sendo atualizados. Volte em breve.</p>
        ) : (
          <div className="mx-auto max-w-5xl space-y-8">
            {periodosDisponiveis.length > 1 && (
              <div className="flex justify-center">
                <div className="inline-flex rounded-full border border-border bg-muted p-1" role="tablist">
                  {periodosDisponiveis.map((per) => (
                    <button
                      key={per.valor}
                      role="tab"
                      aria-selected={periodoAtivo === per.valor}
                      onClick={() => setPeriodo(per.valor)}
                      className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                        periodoAtivo === per.valor ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {per.rotulo}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tabela condensada */}
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="w-1/4 p-4 text-left font-medium text-muted-foreground">Compare</th>
                    {colunas.map((c) => {
                      const p = c.atual;
                      const economia = p && c.mensal && meses > 1
                        ? Math.round((1 - p.valor_centavos / (c.mensal.valor_centavos * meses)) * 100) : 0;
                      return (
                        <th key={c.nome} className={`p-4 align-top ${p?.destaque ? 'bg-primary/5' : ''}`}>
                          <div className="space-y-2 text-center">
                            {p?.destaque && <Badge>Mais escolhido</Badge>}
                            <p className="text-lg font-semibold">{c.nome}</p>
                            {p ? (
                              <>
                                <p className="text-2xl font-semibold">
                                  {dinheiro(p.valor_centavos)}
                                  <span className="text-sm font-normal text-muted-foreground">{SUFIXO[p.periodicidade] ?? ''}</span>
                                </p>
                                {economia > 0 && <p className="text-xs text-primary">Economize {economia}%</p>}
                                <Button size="sm" className="w-full" onClick={() => setEscolhido(p)}>Quero este</Button>
                              </>
                            ) : (
                              <p className="text-xs text-muted-foreground">Não disponível neste período</p>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {linhasAreas.map((a) => (
                    <tr key={a.valor} className="border-b border-border">
                      <td className="p-4">{a.rotulo}</td>
                      {colunas.map((c) => {
                        const ref = c.atual ?? c.versoes[0];
                        const tem = (ref.tipos ?? [ref.tipo]).includes(a.valor);
                        return (
                          <td key={c.nome} className="p-4 text-center">
                            {tem ? <Check className="mx-auto h-5 w-5 text-primary" /> : <Minus className="mx-auto h-5 w-5 text-muted-foreground/50" />}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {temDesconto && (
                    <tr className="border-b border-border">
                      <td className="p-4">Desconto em encontros pagos</td>
                      {colunas.map((c) => {
                        const d = (c.atual ?? c.versoes[0]).desconto_evento_percentual ?? 0;
                        return (
                          <td key={c.nome} className="p-4 text-center font-medium">
                            {d > 0 ? `${d}%` : <Minus className="mx-auto h-5 w-5 text-muted-foreground/50" />}
                          </td>
                        );
                      })}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Vantagens de cada plano */}
            <div className="grid items-start gap-6 md:grid-cols-3">
              {colunas.map((c) => {
                const p = c.atual ?? c.versoes[0];
                return (
                  <div key={c.nome} className={`space-y-4 rounded-xl border bg-card p-6 ${p.destaque ? 'border-primary' : 'border-border'}`}>
                    <h2 className="text-xl font-semibold">O que muda com o {c.nome}</h2>
                    {p.descricao && (
                      <div className="prose prose-sm max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: p.descricao }} />
                    )}
                    {p.beneficios.length > 0 && (
                      <ul className="space-y-2 text-sm">
                        {p.beneficios.map((b, i) => (
                          <li key={i} className="flex gap-2">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {faq.length > 0 && (
        <section className="border-t border-border bg-muted/30">
          <div className="container mx-auto max-w-3xl px-4 py-14">
            <TextoSite as="h2" chave="planos.faq.titulo" padrao="Perguntas frequentes" className="mb-6 text-center text-2xl font-semibold" />
            <Accordion type="single" collapsible className="rounded-xl border border-border bg-card px-4">
              {faq.map((f) => (
                <AccordionItem key={f.id} value={f.id}>
                  <AccordionTrigger className="text-left">{f.pergunta}</AccordionTrigger>
                  <AccordionContent className="whitespace-pre-line text-muted-foreground">{f.resposta}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      )}

      {escolhido && (
        <CobrancaDialog
          aberto
          aoFechar={() => setEscolhido(null)}
          tipo="plano"
          slug={escolhido.slug}
          titulo={`Plano ${escolhido.nome}`}
          valorTexto={dinheiro(escolhido.valor_centavos)}
        />
      )}
    </SiteLayout>
  );
}
