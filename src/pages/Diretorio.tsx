import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, MapPin, Grid, List, Filter } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

interface Business {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  city: string;
  state: string;
  logo_url: string;
  cover_image_url: string;
  website: string;
  instagram: string;
  views_count: number;
  clicks_count: number;
  featured: boolean;
}

const Diretorio = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

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
      setBusinesses(data || []);
    } catch (error) {
      console.error('Erro ao buscar negócios:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBusinesses = businesses.filter(business => {
    const matchesSearch = business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         business.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || business.category === selectedCategory;
    const matchesState = !selectedState || business.state === selectedState;
    const matchesCity = !selectedCity || business.city.toLowerCase().includes(selectedCity.toLowerCase());

    return matchesSearch && matchesCategory && matchesState && matchesCity;
  });

  const BusinessCard = ({ business }: { business: Business }) => (
    <Card className="group hover:shadow-lg transition-all duration-200">
      <div className="relative">
        {business.cover_image_url && (
          <img 
            src={business.cover_image_url} 
            alt={business.name}
            className="w-full h-48 object-cover rounded-t-lg"
          />
        )}
        {business.featured && (
          <Badge className="absolute top-2 left-2 bg-brand-primary text-white">
            Destaque
          </Badge>
        )}
      </div>
      
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          {business.logo_url && (
            <img 
              src={business.logo_url} 
              alt={`Logo ${business.name}`}
              className="w-12 h-12 rounded-full object-cover border-2 border-border"
            />
          )}
          <div className="flex-1">
            <CardTitle className="text-lg group-hover:text-brand-primary transition-colors">
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
        
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {business.views_count} visualizações
          </div>
          
          <Link to={`/diretorio/${business.id}`}>
            <Button size="sm" className="bg-brand-primary hover:bg-brand-primary/90">
              Ver Perfil
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );

  const BusinessListItem = ({ business }: { business: Business }) => (
    <Card className="group hover:shadow-md transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {business.logo_url && (
            <img 
              src={business.logo_url} 
              alt={`Logo ${business.name}`}
              className="w-16 h-16 rounded-full object-cover border-2 border-border flex-shrink-0"
            />
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold group-hover:text-brand-primary transition-colors truncate">
                {business.name}
              </h3>
              {business.featured && (
                <Badge className="bg-brand-primary text-white text-xs">
                  Destaque
                </Badge>
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
            <div className="text-xs text-muted-foreground">
              {business.views_count} visualizações
            </div>
            <Link to={`/diretorio/${business.id}`}>
              <Button size="sm" className="bg-brand-primary hover:bg-brand-primary/90">
                Ver Perfil
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );

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
                      <SelectItem value="">Todas</SelectItem>
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
                      <SelectItem value="">Todos</SelectItem>
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