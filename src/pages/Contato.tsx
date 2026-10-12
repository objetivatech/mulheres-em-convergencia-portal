/** Página de contato — todo texto vem do Editor de páginas (grupo "Contato"). */
import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, MapPin, Phone, User, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PRODUCTION_DOMAIN } from '@/lib/constants';
import { TextoSite } from '@/components/site/TextoSite';
import { useTexto } from '@/hooks/useTextosSite';

const Contato = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hp, setHp] = useState('');
  const [formTs] = useState(() => Date.now());
  const formRef = useRef<HTMLFormElement>(null);
  const titulo = useTexto('contato.titulo');
  const subtitulo = useTexto('contato.subtitulo');
  const botao = useTexto('contato.form.botao');
  const endereco = useTexto('contato.mapa.endereco');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const f = new FormData(e.currentTarget);
      const { error } = await supabase.functions.invoke('send-contact-message', {
        body: {
          name: f.get('name'), email: f.get('email'), subject: f.get('subject'), message: f.get('message'),
          honeypot: hp, timestamp: formTs,
        },
      });
      if (error) throw error;
      toast.success('Mensagem enviada! Responderemos em breve.');
      formRef.current?.reset();
      setHp('');
    } catch {
      toast.error('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const Info = ({ icone: I, rotulo, chave }: { icone: any; rotulo: string; chave: string }) => (
    <div className="flex items-start gap-3 rounded-[18px] border border-border bg-[hsl(var(--marca-areia))] p-4">
      <I className="mt-0.5 h-5 w-5 text-primary" />
      <div><h3 className="font-semibold">{rotulo}</h3><TextoSite chave={chave} as="p" className="text-muted-foreground" /></div>
    </div>
  );

  return (
    <Layout>
      <Helmet>
        <title>{titulo} | Mulheres em Convergência</title>
        <meta name="description" content={subtitulo} />
        <link rel="canonical" href={`${PRODUCTION_DOMAIN}/contato`} />
      </Helmet>
      <main className="container mx-auto overflow-x-hidden px-4 py-10">
        <div className="mx-auto max-w-4xl">
          <header className="mb-12 text-center">
            <TextoSite chave="contato.titulo" as="h1" className="texto-grad-marca mb-6 text-4xl font-extrabold md:text-5xl" />
            <TextoSite chave="contato.subtitulo" as="p" multilinha className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground" />
          </header>

          <div className="grid gap-8 md:grid-cols-2">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary" /><TextoSite chave="contato.form.titulo" /></CardTitle>
                <TextoSite chave="contato.form.texto" as="p" className="text-sm text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome completo</Label>
                      <div className="relative"><User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input id="name" name="name" required className="pl-10" /></div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <div className="relative"><Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input id="email" name="email" type="email" required className="pl-10" /></div>
                    </div>
                  </div>
                  <div className="space-y-2"><Label htmlFor="subject">Assunto</Label><Input id="subject" name="subject" required /></div>
                  <div className="space-y-2"><Label htmlFor="message">Mensagem</Label><Textarea id="message" name="message" required rows={6} className="resize-none" /></div>
                  <input type="text" name="website" value={hp} onChange={(e) => setHp(e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
                  <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Enviando…' : botao}</Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Informações de contato</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Info icone={Mail} rotulo="E-mail" chave="contato.email" />
                  <Info icone={Phone} rotulo="Telefone / WhatsApp" chave="contato.telefone" />
                  <Info icone={MapPin} rotulo="Localização" chave="contato.local" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> Horários de atendimento</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {[1, 2].map((n) => (
                    <div key={n} className="flex justify-between gap-3">
                      <TextoSite chave={`contato.horario${n}.dias`} className="text-muted-foreground" />
                      <TextoSite chave={`contato.horario${n}.horas`} className="font-medium" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          {endereco.trim() && (
            <Card className="mt-8 overflow-hidden">
              <CardHeader><CardTitle><TextoSite chave="contato.mapa.titulo" /></CardTitle></CardHeader>
              <CardContent className="p-0">
                <iframe
                  src={`https://www.google.com/maps?q=${encodeURIComponent(endereco)}&output=embed`}
                  height="400" className="w-full" style={{ border: 0 }} loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade" title={`Mapa — ${endereco}`}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </Layout>
  );
};

export default Contato;
