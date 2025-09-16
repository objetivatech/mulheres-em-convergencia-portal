import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUploader } from '@/components/blog/ImageUploader';
import { BusinessReviewsTab } from '@/components/business/BusinessReviewsTab';
import BusinessMessages from '@/components/business/BusinessMessages';
import BusinessReviewModeration from '@/components/business/BusinessReviewModeration';
import { ServiceAreasManager } from '@/components/business/ServiceAreasManager';
import { useBusinessAnalytics } from '@/hooks/useBusinessAnalytics';
import { useToast } from '@/hooks/use-toast';
import { Building2, TrendingUp, Eye, Phone, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Database } from '@/integrations/supabase/types';

type BusinessCategory = Database['public']['Enums']['business_category'];

const businessSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  category: z.enum([
    'alimentacao',
    'artesanato', 
    'beleza',
    'consultoria',
    'educacao',
    'moda',
    'saude',
    'servicos',
    'tecnologia',
    'casa_decoracao',
    'eventos',
    'marketing'
  ] as const),
  subcategory: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  whatsapp: z.string().optional(),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  instagram: z.string().optional(),
  address: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres'),
  city: z.string().min(2, 'Cidade deve ter pelo menos 2 caracteres'),
  state: z.string().min(2, 'Estado deve ter pelo menos 2 caracteres'),
  postal_code: z.string().optional(),
});

type BusinessFormData = z.infer<typeof businessSchema>;

const categories = [
  'alimentacao',
  'artesanato', 
  'beleza',
  'consultoria',
  'educacao',
  'moda',
  'saude',
  'servicos',
  'tecnologia',
  'casa_decoracao',
  'eventos',
  'marketing'
];

const categoryLabels = {
  alimentacao: 'Alimentação',
  artesanato: 'Artesanato',
  beleza: 'Beleza e Estética',
  consultoria: 'Consultoria',
  educacao: 'Educação',
  moda: 'Moda',
  saude: 'Saúde e Bem-estar',
  servicos: 'Serviços',
  tecnologia: 'Tecnologia',
  casa_decoracao: 'Casa e Decoração',
  eventos: 'Eventos',
  marketing: 'Marketing'
};

export const DashboardEmpresa = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [business, setBusiness] = useState<any>(null);
  const [userSubscription, setUserSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [coverUrl, setCoverUrl] = useState<string>('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewStats, setReviewStats] = useState<any>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Use business analytics hook for real metrics
  const { percentageChanges, loading: analyticsLoading } = useBusinessAnalytics(business?.id);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<BusinessFormData>({
    resolver: zodResolver(businessSchema)
  });

  useEffect(() => {
    if (user) {
      fetchBusiness();
      fetchUserSubscription();
    }
  }, [user]);

  useEffect(() => {
    if (business?.id) {
      fetchReviews();
    }
  }, [business?.id]);

  const fetchBusiness = async () => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setBusiness(data);
        setLogoUrl(data.logo_url || '');
        setCoverUrl(data.cover_image_url || '');
        setGalleryImages(data.gallery_images || []);
        
        // Preencher formulário
        Object.keys(data).forEach(key => {
          if (key in businessSchema.shape) {
            setValue(key as keyof BusinessFormData, data[key] || '');
          }
        });
      }
    } catch (error: any) {
      console.error('Erro ao carregar empresa:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados da empresa',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans (
            name,
            display_name,
            features,
            limits
          )
        `)
        .eq('user_id', user.id)
        .in('status', ['active', 'cancelled'])
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setUserSubscription(data);
    } catch (error) {
      console.error('Erro ao carregar assinatura:', error);
    }
  };

  const fetchReviews = async () => {
    if (!business?.id) return;
    
    setLoadingReviews(true);
    try {
      // Buscar avaliações
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('business_reviews')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (reviewsError) throw reviewsError;
      setReviews(reviewsData || []);

      // Calcular estatísticas
      if (reviewsData && reviewsData.length > 0) {
        const avgRating = reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length;
        const totalReviews = reviewsData.length;
        
        const distribution = {
          5: reviewsData.filter(r => r.rating === 5).length,
          4: reviewsData.filter(r => r.rating === 4).length,
          3: reviewsData.filter(r => r.rating === 3).length,
          2: reviewsData.filter(r => r.rating === 2).length,
          1: reviewsData.filter(r => r.rating === 1).length,
        };

        setReviewStats({
          averageRating: Number(avgRating.toFixed(1)),
          totalReviews,
          distribution
        });
      } else {
        setReviewStats({ averageRating: 0, totalReviews: 0, distribution: {} });
      }
    } catch (error: any) {
      console.error('Erro ao carregar avaliações:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar avaliações',
        variant: 'destructive'
      });
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!userSubscription?.id || !window.confirm('Tem certeza que deseja cancelar sua assinatura?')) {
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('subscription-management', {
        body: {
          action: 'cancel',
          subscriptionId: userSubscription.id
        }
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Assinatura cancelada com sucesso'
      });

      // Recarregar dados
      fetchUserSubscription();
      fetchBusiness();
    } catch (error: any) {
      console.error('Erro ao cancelar assinatura:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao cancelar assinatura. Tente novamente.',
        variant: 'destructive'
      });
    }
  };

  const onSubmit = async (data: BusinessFormData) => {
    setSaving(true);
    try {
      // Garantir que os campos obrigatórios estão presentes
      if (!data.category || !data.name) {
        toast({
          title: 'Erro',
          description: 'Por favor, preencha todos os campos obrigatórios',
          variant: 'destructive'
        });
        return;
      }

      const businessData: Database['public']['Tables']['businesses']['Insert'] = {
        name: data.name,
        slug: data.name
          .toLowerCase()
          .replace(/[àáâãäå]/g, 'a')
          .replace(/[èéêë]/g, 'e')
          .replace(/[ìíîï]/g, 'i')
          .replace(/[òóôõö]/g, 'o')
          .replace(/[ùúûü]/g, 'u')
          .replace(/[ç]/g, 'c')
          .replace(/[ñ]/g, 'n')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, ''), // Auto-generate slug
        description: data.description,
        category: data.category,
        subcategory: data.subcategory || null,
        phone: data.phone || null,
        email: data.email || null,
        whatsapp: data.whatsapp || null,
        website: data.website || null,
        instagram: data.instagram || null,
        address: data.address,
        city: data.city,
        state: data.state,
        postal_code: data.postal_code || null,
        logo_url: logoUrl || null,
        cover_image_url: coverUrl || null,
        gallery_images: galleryImages.length > 0 ? galleryImages : null,
        owner_id: user?.id,
        subscription_active: !!userSubscription && userSubscription.status === 'active', // Only active if has subscription
        requires_subscription: true
      };

      if (business) {
        // Atualizar
        const { error } = await supabase
          .from('businesses')
          .update(businessData)
          .eq('id', business.id);

        if (error) throw error;

        // Log business update activity
        await supabase.rpc('log_user_activity', {
          p_user_id: user.id,
          p_activity_type: 'business_updated',
          p_description: `Informações da empresa ${data.name} foram atualizadas`,
          p_metadata: {
            business_id: business.id,
            business_name: data.name,
            updated_fields: Object.keys(data)
          }
        });
        
      } else {
        // Criar novo
        const { data: newBusiness, error } = await supabase
          .from('businesses')
          .insert([businessData])
          .select()
          .single();

        if (error) throw error;
        setBusiness(newBusiness);

        // Log business creation activity
        await supabase.rpc('log_user_activity', {
          p_user_id: user.id,
          p_activity_type: 'business_created',
          p_description: `Empresa ${data.name} foi criada`,
          p_metadata: {
            business_id: newBusiness.id,
            business_name: data.name,
            category: data.category,
            city: data.city,
            state: data.state
          }
        });
      }

      toast({
        title: 'Sucesso',
        description: business ? 'Empresa atualizada com sucesso!' : userSubscription?.status === 'active'
          ? 'Empresa criada e publicada com sucesso!'
          : 'Empresa criada! Assine um plano para publicar no diretório.'
      });

      if (!business) {
        fetchBusiness(); // Recarregar após criar
      }
    } catch (error: any) {
      console.error('Erro ao salvar empresa:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar dados da empresa',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleGalleryUpload = (url: string | null) => {
    if (url && !galleryImages.includes(url)) {
      setGalleryImages([...galleryImages, url]);
    }
  };

  const removeGalleryImage = (url: string) => {
    setGalleryImages(galleryImages.filter(img => img !== url));
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Carregando...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard da Empresa</h1>
          <p className="text-muted-foreground">
            Gerencie o perfil da sua empresa no diretório
          </p>
        </div>

        {/* Subscription Status */}
        {userSubscription ? (
          <Card className={`mb-6 ${userSubscription.status === 'cancelled' ? 'border-orange-200 bg-orange-50' : ''}`}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Plano Atual: {userSubscription.subscription_plans?.display_name}</span>
              </CardTitle>
              <CardDescription className={userSubscription.status === 'cancelled' ? 'text-orange-700' : ''}>
                {userSubscription.status === 'active' && 'Status: Ativo'}
                {userSubscription.status === 'cancelled' && (
                  <>
                    Status: Cancelado • Válido até {new Date(userSubscription.expires_at).toLocaleDateString('pt-BR')}
                    <br />
                    <span className="text-sm text-orange-600">
                      Seu perfil permanecerá ativo por 31 dias após o cancelamento
                    </span>
                  </>
                )}
                {userSubscription.expires_at && userSubscription.status === 'active' && ` • Expira em ${new Date(userSubscription.expires_at).toLocaleDateString('pt-BR')}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Ciclo: {userSubscription.billing_cycle === 'yearly' ? 'Anual' : 'Mensal'}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" asChild>
                    <a href="/planos">
                      {userSubscription.status === 'cancelled' ? 'Reativar Plano' : 'Alterar Plano'}
                    </a>
                  </Button>
                  {userSubscription.status === 'active' && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={handleCancelSubscription}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800">⚠️ Assinatura Necessária</CardTitle>
              <CardDescription className="text-red-700">
                Para publicar seu negócio no diretório, é necessário ter uma assinatura ativa. 
                Seu perfil foi salvo mas não estará visível até que você assine um plano.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="mr-2">
                <a href="/planos">Assinar Agora</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/planos">Ver Planos</a>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Métricas */}
        {business && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{business.views_count || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {analyticsLoading ? 'Carregando...' : 
                    percentageChanges ? 
                      `${percentageChanges.views >= 0 ? '+' : ''}${percentageChanges.views}% em relação ao período anterior` :
                      'Sem dados do período anterior'
                  }
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cliques no Site</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{business.clicks_count || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {analyticsLoading ? 'Carregando...' : 
                    percentageChanges ? 
                      `${percentageChanges.clicks >= 0 ? '+' : ''}${percentageChanges.clicks}% em relação ao período anterior` :
                      'Sem dados do período anterior'
                  }
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contatos</CardTitle>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{business.contacts_count || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {analyticsLoading ? 'Carregando...' : 
                    percentageChanges ? 
                      `${percentageChanges.contacts >= 0 ? '+' : ''}${percentageChanges.contacts}% em relação ao período anterior` :
                      'Sem dados do período anterior'
                  }
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {userSubscription?.status === 'active' ? 'Ativo' : 'Pendente'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {userSubscription?.status === 'active' ? 'Assinatura em dia' : 'Aguardando pagamento'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

          <Tabs defaultValue="dados" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="dados">Dados da Empresa</TabsTrigger>
              <TabsTrigger value="imagens">Imagens</TabsTrigger>
              <TabsTrigger value="areas">Áreas de Atendimento</TabsTrigger>
              <TabsTrigger value="contatos">Contatos</TabsTrigger>
              <TabsTrigger value="mensagens">Mensagens</TabsTrigger>
              <TabsTrigger value="avaliacoes">Avaliações</TabsTrigger>
            </TabsList>

          <TabsContent value="dados" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
                <CardDescription>
                  Dados principais da sua empresa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome da Empresa *</Label>
                      <Input
                        id="name"
                        {...register('name')}
                        placeholder="Ex: Loja da Maria"
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="category">Categoria *</Label>
                      <Select
                        value={watch('category')}
                        onValueChange={(value) => setValue('category', value as BusinessCategory)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {categoryLabels[cat as keyof typeof categoryLabels]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.category && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.category.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Descrição *</Label>
                    <Textarea
                      id="description"
                      {...register('description')}
                      placeholder="Descreva sua empresa, produtos e serviços..."
                      rows={4}
                    />
                    {errors.description && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.description.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="address">Endereço *</Label>
                      <Input
                        id="address"
                        {...register('address')}
                        placeholder="Rua, número, bairro"
                      />
                      {errors.address && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.address.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="city">Cidade *</Label>
                      <Input
                        id="city"
                        {...register('city')}
                        placeholder="Ex: Porto Alegre"
                      />
                      {errors.city && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.city.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="state">Estado *</Label>
                      <Input
                        id="state"
                        {...register('state')}
                        placeholder="Ex: RS"
                      />
                      {errors.state && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.state.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <Button type="submit" disabled={saving}>
                    {saving ? 'Salvando...' : business ? 'Atualizar Empresa' : 'Criar Empresa'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="imagens" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Logo da Empresa</CardTitle>
                  <CardDescription>
                    Imagem quadrada, recomendado 300x300px
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ImageUploader
                    value={logoUrl}
                    onChange={setLogoUrl}
                    bucket="business-logos"
                    label="Carregar Logo"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Imagem de Capa</CardTitle>
                  <CardDescription>
                    Imagem panorâmica, recomendado 1200x400px
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ImageUploader
                    value={coverUrl}
                    onChange={setCoverUrl}
                    bucket="business-covers"
                    label="Carregar Capa"
                  />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Galeria de Imagens</CardTitle>
                <CardDescription>
                  Adicione fotos dos seus produtos, serviços ou estabelecimento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <ImageUploader
                    value=""
                    onChange={handleGalleryUpload}
                    bucket="business-gallery"
                    label="Adicionar à Galeria"
                  />
                  
                  {galleryImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {galleryImages.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Galeria ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeGalleryImage(url)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contatos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações de Contato</CardTitle>
                <CardDescription>
                  Como os clientes podem entrar em contato
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        {...register('phone')}
                        placeholder="(11) 99999-9999"
                      />
                    </div>

                    <div>
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <Input
                        id="whatsapp"
                        {...register('whatsapp')}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        {...register('email')}
                        placeholder="contato@empresa.com"
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="website">Site</Label>
                      <Input
                        id="website"
                        {...register('website')}
                        placeholder="https://www.empresa.com"
                      />
                      {errors.website && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.website.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      {...register('instagram')}
                      placeholder="@empresa"
                    />
                  </div>

                  <Button type="submit" disabled={saving}>
                    {saving ? 'Salvando...' : 'Salvar Contatos'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="avaliacoes" className="space-y-6">
            {business ? (
              <>
                <BusinessReviewsTab 
                  reviews={reviews}
                  reviewStats={reviewStats}
                  loadingReviews={loadingReviews}
                />
                <BusinessReviewModeration businessId={business.id} />
              </>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">
                    Crie seu perfil de empresa primeiro para ver as avaliações.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="mensagens" className="space-y-6">
            {business ? (
              <BusinessMessages businessId={business.id} />
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">
                    Cadastre sua empresa primeiro para receber mensagens.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="avaliacoes" className="space-y-6">
            <BusinessReviewsTab 
              reviews={reviews}
              reviewStats={reviewStats}
              loadingReviews={loadingReviews}
            />
          </TabsContent>

          <TabsContent value="areas" className="space-y-6">
            {business && (
              <ServiceAreasManager businessId={business.id} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default DashboardEmpresa;