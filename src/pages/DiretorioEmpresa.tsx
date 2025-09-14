import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  MapPin, 
  Globe, 
  Instagram, 
  Phone, 
  Mail, 
  Clock, 
  Star, 
  Eye,
  ArrowLeft,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import Map from '@/components/ui/map';
import ReviewForm from '@/components/ui/review-form';

interface BusinessDetails {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  logo_url: string;
  cover_image_url: string;
  gallery_images: string[];
  opening_hours: any;
  website: string;
  instagram: string;
  views_count: number;
  clicks_count: number;
  contacts_count: number;
  featured: boolean;
  created_at: string;
}

interface BusinessContacts {
  phone: string;
  email: string;
  whatsapp: string;
  website: string;
  instagram: string;
  address: string;
  postal_code: string;
}

interface BusinessReview {
  id: string;
  reviewer_name: string;
  rating: number;
  title: string;
  comment: string;
  verified: boolean;
  helpful_count: number;
  created_at: string;
}

const DiretorioEmpresa = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<BusinessDetails | null>(null);
  const [contacts, setContacts] = useState<BusinessContacts | null>(null);
  const [reviews, setReviews] = useState<BusinessReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllImages, setShowAllImages] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchBusinessBySlug(slug);
    }
  }, [slug]);

  const fetchBusinessBySlug = async (businessSlug: string) => {
    try {
      // Buscar empresa por slug
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('slug', businessSlug)
        .eq('subscription_active', true)
        .single();

      if (businessError || !businessData) {
        navigate('/diretorio');
        return;
      }

      setBusiness(businessData);
      
      // Incrementar visualizações
      await incrementViewCount(businessData.id);

      // Buscar contatos (podem ser restritos por plano)
      const { data: contactsData, error: contactsError } = await supabase
        .rpc('get_business_contacts', { p_business_id: businessData.id });

      if (!contactsError && contactsData && contactsData.length > 0) {
        setContacts(contactsData[0]);
      }

      // Buscar avaliações
      const { data: reviewsData, error: reviewsError } = await supabase
        .rpc('get_public_business_reviews', { 
          business_uuid: businessData.id,
          limit_count: 10,
          offset_count: 0
        });

      if (!reviewsError && reviewsData) {
        setReviews(reviewsData);
      }

    } catch (error) {
      console.error('Erro ao buscar detalhes da empresa:', error);
      navigate('/diretorio');
    } finally {
      setLoading(false);
    }
  };

  const incrementViewCount = async (businessId: string) => {
    try {
      await supabase
        .from('businesses')
        .update({ views_count: business?.views_count ? business.views_count + 1 : 1 })
        .eq('id', businessId);
    } catch (error) {
      console.error('Erro ao incrementar contagem de visualizações:', error);
    }
  };

  const handleContactClick = async (type: 'phone' | 'email' | 'website' | 'whatsapp') => {
    if (!business || !contacts) return;

    try {
      // Incrementar contagem de contatos
      await supabase
        .from('businesses')
        .update({ contacts_count: business.contacts_count + 1 })
        .eq('id', business.id);

      // Abrir o contato apropriado
      switch (type) {
        case 'phone':
          if (contacts.phone) window.open(`tel:${contacts.phone}`);
          break;
        case 'email':
          if (contacts.email) window.open(`mailto:${contacts.email}`);
          break;
        case 'website':
          if (contacts.website) {
            await supabase
              .from('businesses')
              .update({ clicks_count: business.clicks_count + 1 })
              .eq('id', business.id);
            window.open(contacts.website, '_blank');
          }
          break;
        case 'whatsapp':
          if (contacts.whatsapp) {
            const whatsappNumber = contacts.whatsapp.replace(/\D/g, '');
            window.open(`https://wa.me/${whatsappNumber}`, '_blank');
          }
          break;
      }
    } catch (error) {
      console.error('Erro ao registrar contato:', error);
    }
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  const handleReviewSubmitted = () => {
    setShowReviewForm(false);
    // Recarregar avaliações
    if (slug) {
      fetchBusinessBySlug(slug);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!business) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Empresa não encontrada</h1>
            <Button onClick={() => navigate('/diretorio')}>
              Voltar ao Diretório
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Helmet>
        <title>{business.name} | Diretório de Associadas</title>
        <meta 
          name="description" 
          content={business.description?.substring(0, 160) || `${business.name} - ${business.category}`}
        />
        <meta name="keywords" content={`${business.name}, ${business.category}, ${business.city}, ${business.state}`} />
        
        {/* Open Graph */}
        <meta property="og:title" content={`${business.name} | Mulheres em Convergência`} />
        <meta property="og:description" content={business.description?.substring(0, 160)} />
        {business.cover_image_url && (
          <meta property="og:image" content={business.cover_image_url} />
        )}
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header com botão voltar */}
        <section className="py-4 bg-muted/30 border-b">
          <div className="container mx-auto px-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/diretorio')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Diretório
            </Button>
          </div>
        </section>

        {/* Cover Image */}
        {business.cover_image_url && (
          <section className="relative h-64 md:h-80 overflow-hidden">
            <img 
              src={business.cover_image_url} 
              alt={business.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20" />
            {business.featured && (
              <Badge className="absolute top-4 left-4 bg-brand-primary text-white">
                Empresa Destaque
              </Badge>
            )}
          </section>
        )}

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Business Header */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    {business.logo_url && (
                      <img 
                        src={business.logo_url} 
                        alt={`Logo ${business.name}`}
                        className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg flex-shrink-0"
                      />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h1 className="text-3xl font-bold mb-2">{business.name}</h1>
                      
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {business.city}, {business.state}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground text-sm">
                            {business.views_count} visualizações
                          </span>
                        </div>
                        
                        {reviews.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">
                              {averageRating.toFixed(1)} ({reviews.length} avaliações)
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge className="bg-brand-primary text-white">
                          {business.category}
                        </Badge>
                        {business.subcategory && (
                          <Badge variant="outline">
                            {business.subcategory}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              {business.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>Sobre a Empresa</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {business.description}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Gallery */}
              {business.gallery_images && business.gallery_images.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Galeria</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {business.gallery_images
                        .slice(0, showAllImages ? undefined : 6)
                        .map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`${business.name} - Imagem ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg hover:opacity-80 transition-opacity cursor-pointer"
                          onClick={() => window.open(image, '_blank')}
                        />
                      ))}
                    </div>
                    
                    {business.gallery_images.length > 6 && !showAllImages && (
                      <Button
                        variant="outline"
                        onClick={() => setShowAllImages(true)}
                        className="mt-4"
                      >
                        Ver todas as fotos ({business.gallery_images.length})
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Reviews */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>
                    Avaliações ({reviews.length})
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReviewForm(!showReviewForm)}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {showReviewForm ? 'Cancelar' : 'Avaliar'}
                  </Button>
                </CardHeader>
                
                {showReviewForm && (
                  <CardContent className="border-t pt-6">
                    <ReviewForm 
                      businessId={business.id}
                      onReviewSubmitted={handleReviewSubmitted}
                    />
                  </CardContent>
                )}
                
                {reviews.length > 0 && (
                  <CardContent className={showReviewForm ? "border-t pt-6" : ""}>
                    <div className="space-y-4">
                      {reviews.map(review => (
                        <div key={review.id} className="border-b pb-4 last:border-b-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`w-4 h-4 ${
                                    i < review.rating 
                                      ? 'fill-yellow-400 text-yellow-400' 
                                      : 'text-gray-300'
                                  }`} 
                                />
                              ))}
                            </div>
                            <span className="font-medium">{review.reviewer_name}</span>
                            {review.verified && (
                              <Badge variant="outline" className="text-xs">
                                Verificado
                              </Badge>
                            )}
                          </div>
                          
                          {review.title && (
                            <h4 className="font-medium mb-1">{review.title}</h4>
                          )}
                          
                          {review.comment && (
                            <p className="text-muted-foreground text-sm">
                              {review.comment}
                            </p>
                          )}
                          
                          <div className="text-xs text-muted-foreground mt-2">
                            {new Date(review.created_at).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Informações de Contato</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {contacts?.phone && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleContactClick('phone')}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      {contacts.phone}
                    </Button>
                  )}
                  
                  {contacts?.whatsapp && (
                    <Button
                      variant="outline"
                      className="w-full justify-start text-green-600 border-green-600 hover:bg-green-50"
                      onClick={() => handleContactClick('whatsapp')}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      WhatsApp
                    </Button>
                  )}
                  
                  {contacts?.email && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleContactClick('email')}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      {contacts.email}
                    </Button>
                  )}
                  
                  {contacts?.website && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleContactClick('website')}
                    >
                      <Globe className="w-4 h-4 mr-2" />
                      Site
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </Button>
                  )}
                  
                  {contacts?.instagram && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => window.open(`https://instagram.com/${contacts.instagram.replace('@', '')}`, '_blank')}
                    >
                      <Instagram className="w-4 h-4 mr-2" />
                      Instagram
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Address */}
              {contacts?.address && (
                <Card>
                  <CardHeader>
                    <CardTitle>Endereço</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="text-sm">{contacts.address}</p>
                        <p className="text-sm text-muted-foreground">
                          {business.city}, {business.state}
                        </p>
                        {contacts.postal_code && (
                          <p className="text-sm text-muted-foreground">
                            CEP: {contacts.postal_code}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Map */}
              {business.latitude && business.longitude && (
                <Card>
                  <CardHeader>
                    <CardTitle>Localização</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <Map
                        businesses={[{
                          id: business.id,
                          name: business.name,
                          latitude: business.latitude,
                          longitude: business.longitude,
                          category: business.category,
                          city: business.city,
                          state: business.state
                        }]}
                        center={[business.longitude, business.latitude]}
                        zoom={15}
                        height="100%"
                        showSearch={false}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Opening Hours */}
              {business.opening_hours && (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      <Clock className="w-4 h-4 inline mr-2" />
                      Horário de Funcionamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Aqui você pode implementar a exibição dos horários */}
                    <p className="text-sm text-muted-foreground">
                      Informações de horário disponíveis em breve.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Visualizações:</span>
                    <span className="text-sm font-medium">{business.views_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Cliques no site:</span>
                    <span className="text-sm font-medium">{business.clicks_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Contatos:</span>
                    <span className="text-sm font-medium">{business.contacts_count}</span>
                  </div>
                  {reviews.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm">Avaliações:</span>
                      <span className="text-sm font-medium">{reviews.length}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DiretorioEmpresa;