import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics';
import { Search, TrendingUp, Users, Star, Eye, MessageSquare, MapPin, Calendar, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const BusinessAnalyticsDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');

  const { data: businesses = [], isLoading, error } = useAdminAnalytics();

  // Filtrar negócios
  const filteredBusinesses = businesses.filter(business => {
    const matchesSearch = business.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         business.owner_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || selectedCategory === 'all' || business.business_category === selectedCategory;
    const matchesState = !selectedState || selectedState === 'all' || business.business_state === selectedState;
    const matchesPlan = !selectedPlan || selectedPlan === 'all' || business.subscription_plan === selectedPlan;
    
    return matchesSearch && matchesCategory && matchesState && matchesPlan;
  });

  // Calcular métricas gerais
  const totalBusinesses = businesses.length;
  const activeBusinesses = businesses.filter(b => b.subscription_active).length;
  const totalViews = businesses.reduce((sum, b) => sum + (b.total_views || 0), 0);
  const totalReviews = businesses.reduce((sum, b) => sum + (Number(b.total_reviews) || 0), 0);
  const averageRating = businesses.length > 0 
    ? businesses.reduce((sum, b) => sum + (Number(b.average_rating) || 0), 0) / businesses.length
    : 0;

  // Obter categorias únicas
  const categories = [...new Set(businesses.map(b => b.business_category).filter(Boolean))];
  const states = [...new Set(businesses.map(b => b.business_state).filter(Boolean))];
  const plans = [...new Set(businesses.map(b => b.subscription_plan).filter(Boolean))];

  const exportData = () => {
    const csvContent = [
      ['Nome', 'Categoria', 'Cidade', 'Estado', 'Plano', 'Ativo', 'Visualização', 'Cliques', 'Contatos', 'Avaliações', 'Nota Média', 'Data de Cadastro'].join(','),
      ...filteredBusinesses.map(business => [
        business.business_name,
        business.business_category,
        business.business_city,
        business.business_state,
        business.subscription_plan,
        business.subscription_active ? 'Sim' : 'Não',
        business.total_views,
        business.total_clicks,
        business.total_contacts,
        business.total_reviews,
        business.average_rating,
        format(new Date(business.created_at), 'dd/MM/yyyy', { locale: ptBR })
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `analytics-negocios-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Erro ao carregar analytics. Tente novamente.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métricas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-primary" />
              <div>
                <div className="text-2xl font-bold">{totalBusinesses}</div>
                <div className="text-sm text-muted-foreground">Total de Negócios</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{activeBusinesses}</div>
                <div className="text-sm text-muted-foreground">Negócios Ativos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Visualizações</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">{totalReviews}</div>
                <div className="text-sm text-muted-foreground">Total Avaliações</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">{averageRating.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">Nota Média Geral</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Controles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Negócios Cadastrados</CardTitle>
            <Button onClick={exportData} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estados</SelectItem>
                {states.map(state => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger>
                <SelectValue placeholder="Plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os planos</SelectItem>
                {plans.map(plan => (
                  <SelectItem key={plan} value={plan}>
                    {plan}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estatísticas dos Filtros */}
          <div className="text-sm text-muted-foreground">
            Mostrando {filteredBusinesses.length} de {totalBusinesses} negócios
          </div>

          {/* Tabela */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Negócio</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Métricas</TableHead>
                  <TableHead>Avaliações</TableHead>
                  <TableHead>Cadastro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBusinesses.map((business) => (
                  <TableRow key={business.business_id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{business.business_name}</div>
                        <div className="text-sm text-muted-foreground">{business.owner_email}</div>
                        <div className="text-xs text-muted-foreground">{business.business_category}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span className="text-sm">{business.business_city}, {business.business_state}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Badge variant={business.subscription_active ? 'default' : 'secondary'}>
                          {business.subscription_plan}
                        </Badge>
                        {!business.subscription_active && (
                          <Badge variant="destructive" className="text-xs">
                            Inativo
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center space-x-2">
                          <Eye className="h-3 w-3" />
                          <span>{business.total_views || 0}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="h-3 w-3" />
                          <span>{business.total_contacts || 0}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">{Number(business.average_rating).toFixed(1)}</span>
                        <span className="text-sm text-muted-foreground">
                          ({business.total_reviews} avaliações)
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span className="text-sm">
                          {format(new Date(business.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredBusinesses.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum negócio encontrado com os filtros aplicados.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};