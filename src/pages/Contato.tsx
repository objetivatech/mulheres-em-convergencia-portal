import { useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, MapPin, Phone, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PRODUCTION_DOMAIN } from '@/lib/constants';

const Contato = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hp, setHp] = useState('');
  const [formTs] = useState(() => Date.now());
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsSubmitting(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      const contactData = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        subject: formData.get('subject') as string,
        message: formData.get('message') as string,
      };

      const { data, error } = await supabase.functions.invoke('send-contact-message', {
        body: { ...contactData, hp, ts: formTs }
      });

      if (error) {
        console.error('Error sending contact message:', error);
        toast.error('Erro ao enviar mensagem. Tente novamente.');
        return;
      }

      if (data?.email_sent) {
        toast.success(`Mensagem enviada com sucesso! Entraremos em contato em breve. (ID: ${data.id})`);
      } else {
        toast.success(`Mensagem salva com sucesso! Email será processado em breve. (ID: ${data.id})`);
      }
      
      // Reset form safely
      if (formRef.current) {
        formRef.current.reset();
      }
      setHp('');
      
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Contato - Mulheres em Convergência</title>
        <meta name="description" content="Entre em contato conosco. Estamos aqui para ouvir você e responder suas dúvidas sobre o movimento Mulheres em Convergência." />
        <meta property="og:title" content="Contato - Mulheres em Convergência" />
        <meta property="og:description" content="Entre em contato conosco. Estamos aqui para ouvir você e responder suas dúvidas sobre o movimento Mulheres em Convergência." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`${PRODUCTION_DOMAIN}/contato`} />
      </Helmet>

      <Layout>
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <header className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent">
                Entre em Contato
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Estamos aqui para ouvir você. Envie sua mensagem, dúvida ou sugestão. 
                Valorizamos cada contato e responderemos o mais breve possível.
              </p>
            </header>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Contact Form */}
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    Envie sua Mensagem
                  </CardTitle>
                  <CardDescription>
                    Preencha o formulário abaixo e entraremos em contato em breve.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome completo</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="name"
                            name="name"
                            required
                            className="pl-10"
                            placeholder="Seu nome completo"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className="pl-10"
                            placeholder="seu@email.com"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Assunto</Label>
                      <Input
                        id="subject"
                        name="subject"
                        required
                        placeholder="Assunto da sua mensagem"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Mensagem</Label>
                      <Textarea
                        id="message"
                        name="message"
                        required
                        rows={6}
                        className="resize-none"
                        placeholder="Escreva sua mensagem aqui..."
                      />
                    </div>
                    
                    {/* Honeypot field (bots tendem a preencher) */}
                    <input
                      type="text"
                      name="website"
                      value={hp}
                      onChange={(e) => setHp(e.target.value)}
                      className="hidden"
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                    />

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Informações de Contato
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/10">
                      <Mail className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-foreground">Email</h3>
                        <p className="text-muted-foreground">juntas@mulheresemconvergencia.com.br</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-r from-secondary/5 to-tertiary/5 border border-secondary/10">
                      <Phone className="h-5 w-5 text-secondary mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-foreground">Telefone/Whatsapp</h3>
                        <p className="text-muted-foreground">(51) 99236-6002</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-r from-tertiary/5 to-primary/5 border border-tertiary/10">
                      <MapPin className="h-5 w-5 text-tertiary mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-foreground">Localização</h3>
                        <p className="text-muted-foreground">
                          Alvorada, RS<br />
                          Brasil
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Horários de Atendimento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Segunda - Sexta:</span>
                        <span className="font-medium">9h às 18h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sábado e Domingo:</span>
                        <span className="font-medium">Fechado</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Google Maps - Full Width */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Nossa Localização</CardTitle>
                <CardDescription>
                  Encontre-nos em Alvorada, Rio Grande do Sul
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="rounded-lg overflow-hidden">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d27584.66431858135!2d-51.125!3d-29.9894!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x951979f77ad91f07%3A0x2b238ad9b4be1c95!2sAlvorada%2C%20RS!5e0!3m2!1spt!2sbr!4v1694727600000!5m2!1spt!2sbr"
                    width="100%"
                    height="400"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Localização - Alvorada, RS"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </Layout>
    </>
  );
};

export default Contato;