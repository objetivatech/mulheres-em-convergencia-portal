import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Store, Search, CheckCircle, XCircle, Gift, Calendar, 
  RefreshCw, Eye, Building2, User, CreditCard, AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PRODUCTION_DOMAIN } from '@/lib/constants';
import { Link } from 'react-router-dom';

interface Business {
  id: string;
  name: string;
  slug: string;
  category: string;
  city: string | null;
  state: string | null;
  subscription_active: boolean;
  subscription_renewal_date: string | null;
  subscription_expires_at: string | null;
  is_complimentary: boolean;
  created_at: string;
  updated_at: string | null;
  owner_id: string | null;
  owner?: {
    id: string;
    full_name: string | null;
    email: string;
  };
  subscription?: {
    id: string;
    status: string;
    external_subscription_id: string | null;
    plan_id: string;
    expires_at: string | null;
    starts_at: string;
  } | null;
}

const AdminBusinessManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Buscar todos os negócios com informações do proprietário e assinatura
  const { data: businesses = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-businesses'],
    queryFn: async () => {
      const { data: businessesData, error } = await supabase
        .from('businesses')
        .select(`
          id, name, slug, category, city, state,
          subscription_active, subscription_renewal_date, subscription_expires_at,
          is_complimentary, created_at, updated_at, owner_id
        `)
        .order('updated_at', { ascending: false, nullsFirst: false });

      if (error) throw error;

      // Buscar proprietários e assinaturas
      const ownerIds = [...new Set(businessesData.filter(b => b.owner_id).map(b => b.owner_id))];
      
      const [{ data: owners }, { data: subscriptions }] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email').in('id', ownerIds),
        supabase.from('user_subscriptions').select('id, status, external_subscription_id, plan_id, expires_at, starts_at, user_id').in('user_id', ownerIds)
      ]);

      return businessesData.map(business => ({
        ...business,
        owner: owners?.find(o => o.id === business.owner_id) || null,
        subscription: subscriptions?.find(s => s.user_id === business.owner_id && s.status === 'active') || null,
      })) as Business[];
    },
  });

  // Filtrar negócios
  const filteredBusinesses = businesses.filter(business => {
    const matchesSearch = 
      business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.owner?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.owner?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'active') return matchesSearch && (business.subscription_active || business.is_complimentary);
    if (statusFilter === 'inactive') return matchesSearch && !business.subscription_active && !business.is_complimentary;
    if (statusFilter === 'complimentary') return matchesSearch && business.is_complimentary;
    if (statusFilter === 'paid') return matchesSearch && business.subscription_active && !business.is_complimentary;
    
    return matchesSearch;
  });

  // Stats
  const stats = {
    total: businesses.length,
    active: businesses.filter(b => b.subscription_active || b.is_complimentary).length,
    inactive: businesses.filter(b => !b.subscription_active && !b.is_complimentary).length,
    complimentary: businesses.filter(b => b.is_complimentary).length,
    paid: businesses.filter(b => b.subscription_active && !b.is_complimentary).length,
  };

  const getStatusBadge = (business: Business) => {
    if (business.is_complimentary) {
      return (
        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
          <Gift className="h-3 w-3 mr-1" />
          Cortesia
        </Badge>
      );
    }
    if (business.subscription_active) {
      return (
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          <CreditCard className="h-3 w-3 mr-1" />
          Assinante
        </Badge>
      );
    }
    return (
      <Badge variant="destructive">
        <XCircle className="h-3 w-3 mr-1" />
        Inativo
      </Badge>
    );
  };

  const handleViewDetails = (business: Business) => {
    setSelectedBusiness(business);
    setShowDetailsDialog(true);
  };

  return (
    <>
      <Helmet>
        <title>Gestão de Negócios | Admin | {PRODUCTION_DOMAIN}</title>
      </Helmet>

      <Layout>
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4 max-w-7xl">
            <header className="mb-8">
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Building2 className="h-8 w-8" />
                Gestão de Negócios
              </h1>
              <p className="text-muted-foreground mt-2">
                Consulte, ative e desative negócios do diretório com rastreabilidade completa
              </p>
            </header>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('all')}>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('active')}>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                  <div className="text-sm text-muted-foreground">Ativos</div>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('inactive')}>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
                  <div className="text-sm text-muted-foreground">Inativos</div>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('complimentary')}>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-emerald-600">{stats.complimentary}</div>
                  <div className="text-sm text-muted-foreground">Cortesia</div>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('paid')}>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">{stats.paid}</div>
                  <div className="text-sm text-muted-foreground">Pagantes</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                  <div>
                    <CardTitle>Negócios Cadastrados</CardTitle>
                    <CardDescription>
                      {filteredBusinesses.length} negócio(s) encontrado(s)
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => refetch()}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Atualizar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filtros */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome, email, cidade..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativos</SelectItem>
                      <SelectItem value="inactive">Inativos</SelectItem>
                      <SelectItem value="complimentary">Cortesia</SelectItem>
                      <SelectItem value="paid">Pagantes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tabela */}
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Negócio</TableHead>
                          <TableHead>Proprietária</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Assinatura</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBusinesses.map((business) => (
                          <TableRow key={business.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{business.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {business.category} • {business.city}, {business.state}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {business.owner ? (
                                <div>
                                  <div className="font-medium">{business.owner.full_name || 'Sem nome'}</div>
                                  <div className="text-sm text-muted-foreground">{business.owner.email}</div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">Sem proprietário</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {getStatusBadge(business)}
                                {(business.subscription_active || business.is_complimentary) && (
                                  <div className="text-xs text-green-600 flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    Visível no diretório
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {business.is_complimentary ? (
                                <span className="text-emerald-600 text-sm">Permanente</span>
                              ) : business.subscription_expires_at ? (
                                <div className="text-sm">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Expira: {format(new Date(business.subscription_expires_at), 'dd/MM/yyyy', { locale: ptBR })}
                                  </div>
                                  {business.subscription?.external_subscription_id && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      ASAAS: {business.subscription.external_subscription_id.substring(0, 15)}...
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">Sem assinatura</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewDetails(business)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Link to={`/diretorio/${business.id}`} target="_blank">
                                  <Button variant="outline" size="sm">
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </Link>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {filteredBusinesses.length === 0 && !isLoading && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum negócio encontrado com os filtros aplicados.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </Layout>

      {/* Dialog de Detalhes */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Detalhes do Negócio
            </DialogTitle>
          </DialogHeader>
          
          {selectedBusiness && (
            <div className="space-y-6">
              {/* Info Básica */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{selectedBusiness.name}</h3>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedBusiness)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedBusiness.category} • {selectedBusiness.city}, {selectedBusiness.state}
                </p>
              </div>

              {/* Proprietária */}
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium flex items-center gap-2 mb-2">
                  <User className="h-4 w-4" />
                  Proprietária
                </h4>
                {selectedBusiness.owner ? (
                  <div>
                    <p className="font-medium">{selectedBusiness.owner.full_name || 'Sem nome'}</p>
                    <p className="text-sm text-muted-foreground">{selectedBusiness.owner.email}</p>
                    <Link 
                      to={`/admin/crm/contatos?search=${selectedBusiness.owner.email}`}
                      className="text-sm text-primary hover:underline"
                    >
                      Ver no CRM →
                    </Link>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Sem proprietário associado</p>
                )}
              </div>

              {/* Assinatura */}
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4" />
                  Informações de Assinatura
                </h4>
                
                {selectedBusiness.is_complimentary ? (
                  <div className="space-y-2">
                    <Badge className="bg-emerald-100 text-emerald-800">
                      <Gift className="h-3 w-3 mr-1" />
                      Acesso Cortesia (Permanente)
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Este negócio tem acesso gratuito e permanente ao diretório.
                    </p>
                  </div>
                ) : selectedBusiness.subscription ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <p className="font-medium capitalize">{selectedBusiness.subscription.status}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">ID ASAAS:</span>
                        <p className="font-mono text-xs">{selectedBusiness.subscription.external_subscription_id || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Início:</span>
                        <p>{format(new Date(selectedBusiness.subscription.starts_at), 'dd/MM/yyyy', { locale: ptBR })}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Expira:</span>
                        <p>{selectedBusiness.subscription.expires_at 
                          ? format(new Date(selectedBusiness.subscription.expires_at), 'dd/MM/yyyy', { locale: ptBR })
                          : 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-amber-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Sem assinatura ativa</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Este negócio não possui assinatura ativa e não aparece no diretório.
                    </p>
                  </div>
                )}
              </div>

              {/* Datas */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Criado em:</span>
                  <p>{format(new Date(selectedBusiness.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Última atualização:</span>
                  <p>{selectedBusiness.updated_at 
                    ? format(new Date(selectedBusiness.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                    : 'N/A'}</p>
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-2 pt-4 border-t">
                <Link to={`/diretorio/${selectedBusiness.id}`} target="_blank" className="flex-1">
                  <Button variant="outline" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    Ver no Diretório
                  </Button>
                </Link>
                {selectedBusiness.owner && (
                  <Link to={`/admin/usuarios?search=${selectedBusiness.owner.email}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      <User className="h-4 w-4 mr-2" />
                      Gerenciar Usuário
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminBusinessManagement;
