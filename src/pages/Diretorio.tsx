import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, MapPin, Grid, List, Filter, Map as MapIcon, Navigation, Building2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate } from 'react-router-dom';
import { SafeLeafletMap } from '@/components/SafeLeafletMap';
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
  average_rating: number;
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
      setLoading(true);
      console.log('Iniciando busca de negócios...');
      
      // Fetch businesses with pagination for better performance
      console.log('Chamando RPC get_public_businesses...');
      const { data, error } = await supabase
        .rpc('get_public_businesses')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50); // Limit initial load for better performance

      if (error) {
        console.error('Erro na RPC get_public_businesses:', error);
        throw error;
      }
      
      console.log('Negócios carregados:', data?.length || 0);
      const businessList = data || [];
      setBusinesses(businessList);

      // Fetch boost data in batches to avoid too many concurrent requests
      const batchSize = 5;
      const boostMap: {[key: string]: any[]} = {};
      
      for (let i = 0; i < businessList.length; i += batchSize) {
        const batch = businessList.slice(i, i + batchSize);
        const boostPromises = batch.map(async (business: any) => {
          try {
            const { data: boosts } = await supabase
              .rpc('get_business_boosts', { business_uuid: business.id });
            return { businessId: business.id, boosts: boosts || [] };
          } catch (err) {
            console.warn(`Failed to fetch boosts for ${business.id}:`, err);
            return { businessId: business.id, boosts: [] };
          }
        });

        const batchResults = await Promise.all(boostPromises);
        batchResults.forEach(result => {
          boostMap[result.businessId] = result.boosts;
        });
        
        // Update state incrementally for better UX
        setBusinessBoosts(prev => ({ ...prev, ...boostMap }));
      }
      } catch (error) {
        console.error('Erro ao buscar negócios:', error);
        // Mostrar mensagem de erro mais amigável
        setBusinesses([]);
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

  // Obter localização do usuário e ativar modo mapa
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([longitude, latitude]);
          // Auto-ativar modo mapa quando localização for obtida
          if (viewMode !== 'map') {
            setViewMode('map');
          }
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
        }
      );
    }
  };

  // Auto-solicitar localização ao carregar a página se não houver filtros ativos
  useEffect(() => {
    // Só pedir localização se não houver filtros específicos aplicados
    if (!searchTerm && !selectedCategory && !selectedState && !selectedCity) {
      getCurrentLocation();
    }
  }, []);

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
          <div className="flex items-center space-x-1">
            <span>⭐ {business.average_rating.toFixed(1)}</span>
            <span>({business.reviews_count})</span>
          </div>
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
              <div className="flex items-center space-x-1">
                <span>⭐ {business.average_rating.toFixed(1)}</span>
                <span>({business.reviews_count})</span>
              </div>
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

        {/* Results */}
        <div className="container mx-auto px-4 py-8">
          <div className={`grid ${viewMode === 'map' ? 'lg:grid-cols-3 gap-6' : ''}`}>
            
            {/* Map Sidebar - appears first on mobile when in map mode */}
            {viewMode === 'map' && (
              <div className="lg:col-span-1 lg:order-1 mb-6 lg:mb-0">
                <div className="sticky top-4">
                  <div className="bg-white rounded-lg shadow-lg border p-4 mb-4">
                    <h3 className="font-semibold mb-3">🗺️ Explorar no Mapa</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Veja empresas próximas a você ou explore por região
                    </p>
                    {!userLocation && (
                      <Button 
                        onClick={getCurrentLocation} 
                        variant="outline" 
                        size="sm" 
                        className="w-full mb-3"
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        Usar minha localização
                      </Button>
                    )}
                    {userLocation && (
                      <div className="text-xs text-green-600 bg-green-50 p-2 rounded border mb-3">
                        ✅ Localização ativa - Mostrando empresas próximas
                      </div>
                    )}
                  </div>
                  
                  {/* Business List in Sidebar */}
                  <div className="bg-white rounded-lg shadow-lg border max-h-96 overflow-y-auto">
                    <div className="p-3 border-b bg-muted/30">
                      <h4 className="font-medium text-sm">
                        {filteredBusinesses.length} empresas encontradas
                      </h4>
                    </div>
                    <div className="divide-y">
                      {filteredBusinesses.slice(0, 10).map(business => (
                        <div 
                          key={business.id} 
                          className="p-3 hover:bg-muted/30 cursor-pointer transition-colors"
                          onClick={() => navigate(`/diretorio/${business.slug}`)}
                        >
                          <div className="flex items-center gap-3">
                            {business.logo_url && (
                              <img 
                                src={business.logo_url} 
                                alt={business.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-sm truncate">{business.name}</h5>
                              <p className="text-xs text-muted-foreground truncate">
                                {business.city}, {business.state}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {filteredBusinesses.length > 10 && (
                        <div className="p-3 text-center text-xs text-muted-foreground bg-muted/20">
                          +{filteredBusinesses.length - 10} empresas no mapa
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className={`${viewMode === 'map' ? 'lg:col-span-2 lg:order-2' : ''}`}>
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              )}

              {!loading && filteredBusinesses.length === 0 && (
                <div className="text-center py-12">
                  <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Building2 className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Nenhuma empresa encontrada</h3>
                  <p className="text-muted-foreground mb-4">
                    Tente ajustar os filtros ou termos de busca
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('');
                      setSelectedState('');
                      setSelectedCity('');
                      setUserLocation(null);
                    }}
                  >
                    Limpar Filtros
                  </Button>
                </div>
              )}

              {!loading && filteredBusinesses.length > 0 && (
                <>
                  {viewMode === 'grid' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredBusinesses.map(business => (
                        <BusinessCard key={business.id} business={business} />
                      ))}
                    </div>
                  )}

                  {viewMode === 'list' && (
                    <div className="space-y-4">
                      {filteredBusinesses.map(business => (
                        <BusinessListItem key={business.id} business={business} />
                      ))}
                    </div>
                  )}

                  {viewMode === 'map' && (
                    <div className="min-h-[60vh] lg:min-h-[70vh] rounded-lg overflow-hidden border shadow-lg">
                      <SafeLeafletMap
                        businesses={filteredBusinesses.map(business => ({
                          id: business.id,
                          name: business.name,
                          latitude: business.latitude,
                          longitude: business.longitude,
                          category: business.category,
                          city: business.city,
                          state: business.state
                        }))}
                        center={userLocation || [-51.2177, -30.0346]}
                        zoom={userLocation ? 12 : 6}
                        height="100%"
                        showSearch={true}
                        onBusinessClick={(businessId) => {
                          const business = filteredBusinesses.find(b => b.id === businessId);
                          if (business) {
                            navigate(`/diretorio/${business.slug}`);
                          }
                        }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Diretorio;