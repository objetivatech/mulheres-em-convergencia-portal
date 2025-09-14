import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, MapPin, Grid, List, Filter, Map as MapIcon, Navigation } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate } from 'react-router-dom';
import Map from '@/components/ui/map';
import FeaturedBadge from '@/components/premium/FeaturedBadge';

interface Business {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  city: string;
  state: string;
  latitude?: number;
  longitude?: number;
  logo_url: string;
  cover_image_url: string;
  website: string;
  instagram: string;
  views_count: number;
  clicks_count: number;
  featured: boolean;
  slug: string;
  reviews_count: number;
}

const Diretorio = () => {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [businessBoosts, setBusinessBoosts] = useState<{[key: string]: any[]}>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [nearbyRadius, setNearbyRadius] = useState(50); // km

  // Categorias disponíveis
  const categories = [
    'Alimentação',
    'Artesanato',
    'Beleza e Estética',
    'Consultoria',
    'Educação',
    'Moda',
    'Saúde e Bem-estar',
    'Serviços',
    'Tecnologia',
    'Outros'
  ];

  // Estados brasileiros
  const states = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
    'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
    'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_public_businesses')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      const businessList = data || [];
      setBusinesses(businessList);

      // Fetch boost data for each business
      const boostPromises = businessList.map(async (business: any) => {
        const { data: boosts } = await supabase
          .rpc('get_business_boosts', { business_uuid: business.id });
        return { businessId: business.id, boosts: boosts || [] };
      });

      const boostResults = await Promise.all(boostPromises);
      const boostMap: {[key: string]: any[]} = {};
      boostResults.forEach(result => {
        boostMap[result.businessId] = result.boosts;
      });
      setBusinessBoosts(boostMap);
    } catch (error) {
      console.error('Erro ao buscar negócios:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para calcular distância entre dois pontos
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const filteredBusinesses = businesses.filter(business => {
    const matchesSearch = business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         business.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || selectedCategory === 'all' || business.category === selectedCategory;
    const matchesState = !selectedState || selectedState === 'all' || business.state === selectedState;
    const matchesCity = !selectedCity || business.city.toLowerCase().includes(selectedCity.toLowerCase());

    // Filtro por proximidade se localização do usuário disponível
    let matchesProximity = true;
    if (userLocation && business.latitude && business.longitude) {
      const distance = calculateDistance(
        userLocation[1], userLocation[0],
        business.latitude, business.longitude
      );
      matchesProximity = distance <= nearbyRadius;
    }

    return matchesSearch && matchesCategory && matchesState && matchesCity && matchesProximity;
  });

  // Obter localização do usuário
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([longitude, latitude]);
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
        }
      );
    }
  };

  const BusinessCard = ({ business }: { business: Business }) => {
    const boosts = businessBoosts[business.id] || [];
    const hasFeaturedListing = boosts.some((boost: any) => boost.active && boost.boost_type === 'featured_listing');
    const hasPremiumBadge = boosts.some((boost: any) => boost.active && boost.boost_type === 'premium_badge');
    
    return (
      <Card className="group hover:shadow-lg transition-all duration-200">
        <div className="relative">
          {business.cover_image_url && (
            <img 
              src={business.cover_image_url} 
              alt={business.name}
              className="w-full h-48 object-cover rounded-t-lg"
            />
          )}
          {(business.featured || hasFeaturedListing) && (
            <div className="absolute top-2 left-2">
              <FeaturedBadge type="featured_listing" size="sm" />
            </div>
          )}
        </div>
        
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="relative">
              {business.logo_url && (
                <img 
                  src={business.logo_url} 
                  alt={`Logo ${business.name}`}
                  className="w-12 h-12 rounded-full object-cover border-2 border-border"
                />
              )}
              {hasPremiumBadge && (
                <div className="absolute -top-1 -right-1">
                  <FeaturedBadge type="premium_badge" size="sm" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                {business.name}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-3 h-3" />
                {business.city}, {business.state}
              </div>
            </div>
          </div>
        </CardHeader>
      
      <CardContent>
        <Badge variant="secondary" className="mb-2">
          {business.category}
        </Badge>
        {business.subcategory && (
          <Badge variant="outline" className="ml-1 mb-2">
            {business.subcategory}
          </Badge>
        )}
        
        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
          {business.description}
        </p>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <span>{business.views_count} visualizações</span>
          <span>{business.reviews_count} avaliações</span>
        </div>
        
        <div className="flex justify-end">
          <Link to={`/diretorio/${business.slug}`}>
            <Button size="sm">
              Ver Perfil
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
    );
  };

  const BusinessListItem = ({ business }: { business: Business }) => {
    const boosts = businessBoosts[business.id] || [];
    const hasFeaturedListing = boosts.some((boost: any) => boost.active && boost.boost_type === 'featured_listing');
    const hasPremiumBadge = boosts.some((boost: any) => boost.active && boost.boost_type === 'premium_badge');
    
    return (
      <Card className="group hover:shadow-md transition-all duration-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              {business.logo_url && (
                <img 
                  src={business.logo_url} 
                  alt={`Logo ${business.name}`}
                  className="w-16 h-16 rounded-full object-cover border-2 border-border flex-shrink-0"
                />
              )}
              {hasPremiumBadge && (
                <div className="absolute -top-1 -right-1">
                  <FeaturedBadge type="premium_badge" size="sm" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold group-hover:text-primary transition-colors truncate">
                  {business.name}
                </h3>
                {(business.featured || hasFeaturedListing) && (
                  <FeaturedBadge type="featured_listing" size="sm" />
                )}
              </div>
            
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                {business.city}, {business.state}
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">
                  {business.category}
                </Badge>
                {business.subcategory && (
                  <Badge variant="outline" className="text-xs">
                    {business.subcategory}
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground line-clamp-2">
                {business.description}
              </p>
            </div>
          
          <div className="flex flex-col items-end gap-2">
            <div className="text-xs text-muted-foreground text-right">
              <div>{business.views_count} visualizações</div>
              <div>{business.reviews_count} avaliações</div>
            </div>
            <Link to={`/diretorio/${business.slug}`}>
              <Button size="sm">
                Ver Perfil
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
    );
  };

  return (
    <Layout>
      <Helmet>
        <title>Diretório de Associadas | Mulheres em Convergência</title>
        <meta 
          name="description" 
          content="Descubra empresas lideradas por mulheres empreendedoras. Conecte-se com negócios locais e apoie o empreendedorismo feminino."
        />
        <meta name="keywords" content="diretório empresarial, mulheres empreendedoras, negócios femininos, empreendedorismo" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-brand-primary to-brand-secondary py-16 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Diretório de Associadas
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-white/90">
                Descubra empresas lideradas por mulheres empreendedoras
              </p>
              
              {/* Search Bar */}
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Buscar por empresa, categoria ou localização..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-3 text-lg bg-white text-foreground"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Filters and Controls */}
        <section className="py-6 bg-muted/30 border-b">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              
              {/* Filters */}
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="md:hidden"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>

                <div className={`flex items-center gap-2 ${showFilters ? 'flex' : 'hidden md:flex'}`}>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedState} onValueChange={setSelectedState}>
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {states.map(state => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Cidade"
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-32"
                  />
                </div>
              </div>

              {/* Location and Proximity */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={getCurrentLocation}
                  disabled={!!userLocation}
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  {userLocation ? 'Localização ativa' : 'Buscar próximas'}
                </Button>
                
                {userLocation && (
                  <Select 
                    value={nearbyRadius.toString()} 
                    onValueChange={(value) => setNearbyRadius(Number(value))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 km</SelectItem>
                      <SelectItem value="25">25 km</SelectItem>
                      <SelectItem value="50">50 km</SelectItem>
                      <SelectItem value="100">100 km</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* View Mode and Results */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {filteredBusinesses.length} empresas encontradas
                </span>
                
                <div className="flex items-center gap-1 border rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="px-2"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="px-2"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'map' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('map')}
                    className="px-2"
                  >
                    <MapIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Business Listings */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-primary"></div>
              </div>
            ) : filteredBusinesses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-muted-foreground">
                  Nenhuma empresa encontrada com os filtros selecionados.
                </p>
              </div>
            ) : viewMode === 'map' ? (
              <Map
                businesses={filteredBusinesses}
                center={userLocation || [-51.2177, -30.0346]}
                zoom={userLocation ? 12 : 10}
                height="600px"
                showSearch={true}
                onBusinessClick={(businessId) => navigate(`/diretorio/${businessId}`)}
              />
            ) : (
              <div className={
                viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4"
              }>
                {filteredBusinesses.map(business => 
                  viewMode === 'grid' 
                    ? <BusinessCard key={business.id} business={business} />
                    : <BusinessListItem key={business.id} business={business} />
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Diretorio;