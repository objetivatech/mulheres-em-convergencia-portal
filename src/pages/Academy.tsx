import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAcademyCourses } from '@/hooks/useAcademy';
import { useAcademyAccess, useEnrollAsFreeStudent } from '@/hooks/useAcademyEnrollment';
import { createAcademySubscription } from '@/hooks/useAcademySubscription';
import { CourseCard } from '@/components/academy/CourseCard';
import { PRODUCTION_DOMAIN } from '@/lib/constants';
import CustomerInfoDialog, { CustomerFormData, UserProfileData } from '@/components/subscriptions/CustomerInfoDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  BookOpen, GraduationCap, Play, FileText, Users, Star,
  CheckCircle, ArrowRight, Sparkles, CreditCard, UserPlus,
} from 'lucide-react';

const Academy = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: access } = useAcademyAccess();
  const { data: landingCourses } = useAcademyCourses({ status: 'published', showOnLanding: true });
  const enrollFree = useEnrollAsFreeStudent();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, email, cpf, phone, city, state')
        .eq('id', user.id)
        .maybeSingle();
      setUserProfile(data);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  };

  // "Começar Grátis" — gives student role for free content
  const handleFreeAccess = () => {
    if (!user) {
      navigate('/entrar?redirect=/academy/catalogo');
    } else if (access === 'none') {
      enrollFree.mutate();
    } else {
      navigate('/academy/catalogo');
    }
  };

  // "Assinar Agora" — opens checkout flow
  const handleSubscribe = () => {
    if (!user) {
      navigate('/entrar?redirect=/academy#planos');
    } else {
      setDialogOpen(true);
    }
  };

  const handleSubscriptionSubmit = async (values: CustomerFormData) => {
    setDialogLoading(true);
    try {
      const result = await createAcademySubscription({
        name: values.name,
        email: user?.email || values.email || '',
        cpfCnpj: values.cpfCnpj,
        phone: values.phone,
        postalCode: values.postalCode,
        address: values.address,
        addressNumber: values.addressNumber,
        complement: values.complement,
        province: values.province,
        city: values.city,
        state: values.state,
      });

      setDialogOpen(false);

      if (result.paymentUrl) {
        window.open(result.paymentUrl, '_blank');
        toast({
          title: 'Assinatura criada!',
          description: 'Complete o pagamento na página que foi aberta.',
        });
      } else {
        toast({
          title: 'Assinatura criada!',
          description: 'Aguarde a confirmação do pagamento para liberar o acesso.',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao criar assinatura',
        description: error.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setDialogLoading(false);
    }
  };

  const benefits = [
    { icon: BookOpen, title: 'Cursos Completos', desc: 'Conteúdos estruturados com aulas em vídeo e materiais de apoio' },
    { icon: GraduationCap, title: 'Workshops Práticos', desc: 'Aulas práticas para aplicar no seu negócio imediatamente' },
    { icon: Play, title: 'Vídeoaulas Exclusivas', desc: 'Conteúdo gravado por especialistas em diversas áreas' },
    { icon: FileText, title: 'Materiais em PDF', desc: 'E-books, guias, planilhas e templates para download' },
    { icon: Users, title: 'Comunidade', desc: 'Acesso à comunidade de empreendedoras para networking' },
    { icon: Sparkles, title: 'Novos Conteúdos', desc: 'Conteúdo adicionado constantemente para seu crescimento contínuo' },
  ];

  const faqItems = [
    { q: 'Preciso pagar para acessar?', a: 'Temos conteúdos gratuitos e premium. Você pode começar gratuitamente e evoluir para a assinatura quando quiser.' },
    { q: 'Como funciona a assinatura?', a: 'A assinatura é mensal (R$29,90) e dá acesso a todos os conteúdos. Você pode cancelar a qualquer momento.' },
    { q: 'Quais formas de pagamento?', a: 'Aceitamos PIX, boleto bancário e cartão de crédito em até 12x.' },
    { q: 'Já sou associada, preciso assinar?', a: 'Não! Associadas, embaixadoras e administradoras têm acesso total automaticamente.' },
  ];

  return (
    <>
      <Helmet>
        <title>MeC Academy - Aprenda, Empreenda, Cresça | Mulheres em Convergência</title>
        <meta name="description" content="Plataforma de cursos e capacitação para empreendedoras. Videoaulas, workshops, materiais de apoio e muito mais." />
        <link rel="canonical" href={`${PRODUCTION_DOMAIN}/academy`} />
      </Helmet>

      <Layout>
        {/* Hero */}
        <section className="relative bg-gradient-to-br from-primary/10 via-secondary/5 to-background py-20 md:py-28">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <Badge className="mb-4" variant="secondary">
              <GraduationCap className="h-3 w-3 mr-1" /> Nova Plataforma de Aprendizado
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              MeC Academy
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Cursos, workshops e materiais exclusivos para impulsionar sua jornada empreendedora.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleFreeAccess} className="text-lg px-8">
                {access === 'none' || !user ? (
                  <>
                    <UserPlus className="h-5 w-5 mr-2" />
                    Comece Gratuitamente
                  </>
                ) : (
                  <>
                    <BookOpen className="h-5 w-5 mr-2" />
                    Acessar Catálogo
                  </>
                )}
              </Button>
              <Button size="lg" variant="outline" onClick={() => {
                document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' });
              }} className="text-lg px-8">
                <CreditCard className="h-5 w-5 mr-2" />
                Ver Plano Premium
              </Button>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              Tudo que você precisa para crescer
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {benefits.map((b) => {
                const Icon = b.icon;
                return (
                  <Card key={b.title} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6 flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{b.title}</h3>
                        <p className="text-sm text-muted-foreground">{b.desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Featured Free Courses */}
        {landingCourses && landingCourses.length > 0 && (
          <section className="py-16 bg-muted/30">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-4">Comece agora — é grátis</h2>
              <p className="text-center text-muted-foreground mb-10 max-w-xl mx-auto">
                Confira alguns dos nossos conteúdos gratuitos e comece sua jornada de aprendizado.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {landingCourses.slice(0, 6).map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
              <div className="text-center mt-8">
                <Button variant="outline" size="lg" onClick={() => navigate('/academy/catalogo')}>
                  Ver Todos os Conteúdos <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Pricing */}
        <section id="planos" className="py-16 md:py-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl font-bold text-center mb-4">Plano MeC Academy</h2>
            <p className="text-center text-muted-foreground mb-10">
              Acesso total a todos os conteúdos da plataforma.
            </p>

            <Card className="border-2 border-primary shadow-lg overflow-hidden">
              <CardContent className="p-8 md:p-10">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div>
                    <Badge className="mb-3">Mais Popular</Badge>
                    <h3 className="text-2xl font-bold mb-2">Assinatura Mensal</h3>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-4xl font-bold text-primary">R$29,90</span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                    <ul className="space-y-2">
                      {[
                        'Acesso a todos os cursos e workshops',
                        'Novos conteúdos adicionados semanalmente',
                        'Materiais para download (PDFs, templates)',
                        'Videoaulas exclusivas',
                        'Cancele quando quiser',
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex flex-col gap-3 md:min-w-[200px]">
                    <Button size="lg" className="w-full" onClick={handleSubscribe}>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Assinar Agora
                    </Button>
                    <Button size="lg" variant="ghost" className="w-full" onClick={handleFreeAccess}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Começar Grátis
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      PIX, boleto ou cartão em até 12x
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl font-bold text-center mb-10">Perguntas Frequentes</h2>
            <div className="space-y-4">
              {faqItems.map((item) => (
                <Card key={item.q}>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-2">{item.q}</h3>
                    <p className="text-sm text-muted-foreground">{item.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4 text-center max-w-2xl">
            <Star className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">Pronta para dar o próximo passo?</h2>
            <p className="text-muted-foreground mb-8">
              Junte-se a centenas de empreendedoras que estão transformando seus negócios com o MeC Academy.
            </p>
            <Button size="lg" onClick={handleSubscribe} className="text-lg px-8">
              Assinar Agora <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </section>
      </Layout>

      <CustomerInfoDialog
        open={dialogOpen}
        loading={dialogLoading}
        userProfile={userProfile || undefined}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubscriptionSubmit}
      />
    </>
  );
};

export default Academy;
