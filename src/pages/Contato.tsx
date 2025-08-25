import { useState } from 'react';
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
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { PRODUCTION_DOMAIN, HCAPTCHA_SITE_KEY } from '@/lib/constants';

const Contato = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>('');

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!captchaToken) {
      toast.error('Por favor, complete o captcha antes de enviar.');
      return;
    }

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
        body: contactData
      });

      if (error) {
        console.error('Error sending contact message:', error);
        toast.error('Erro ao enviar mensagem. Tente novamente.');
        return;
      }

      toast.success('Mensagem enviada com sucesso! Entraremos em contato em breve.');
      
      // Reset form
      e.currentTarget.reset();
      setCaptchaToken('');
      
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
                  <form onSubmit={handleSubmit} className="space-y-4">
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
                    
                    <div className="flex justify-center">
                      <HCaptcha
                        sitekey={HCAPTCHA_SITE_KEY}
                        onVerify={handleCaptchaVerify}
                        onExpire={() => setCaptchaToken('')}
                        onError={() => setCaptchaToken('')}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isSubmitting || !captchaToken}
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
                        <p className="text-muted-foreground">contato@mulheresemconvergencia.com.br</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-r from-secondary/5 to-tertiary/5 border border-secondary/10">
                      <Phone className="h-5 w-5 text-secondary mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-foreground">Telefone</h3>
                        <p className="text-muted-foreground">+55 (11) 99999-9999</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-r from-tertiary/5 to-primary/5 border border-tertiary/10">
                      <MapPin className="h-5 w-5 text-tertiary mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-foreground">Localização</h3>
                        <p className="text-muted-foreground">
                          São Paulo, SP<br />
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
                        <span className="text-muted-foreground">Sábado:</span>
                        <span className="font-medium">9h às 14h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Domingo:</span>
                        <span className="font-medium">Fechado</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </Layout>
    </>
  );
};

export default Contato;