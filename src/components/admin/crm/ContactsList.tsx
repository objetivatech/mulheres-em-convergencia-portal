import { useState, useEffect } from 'react';
import { Search, UserPlus, Filter, Users, UserCheck, Clock, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCRM, UnifiedContact } from '@/hooks/useCRM';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ContactsListProps {
  onSelectContact: (contact: UnifiedContact) => void;
  onAddContact: () => void;
}

const statusLabels: Record<string, string> = {
  new: 'Novo',
  contacted: 'Contatado',
  qualified: 'Qualificado',
  converted: 'Convertido',
  lost: 'Perdido',
  active: 'Ativo',
};

const statusColors: Record<string, string> = {
  new: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  contacted: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  qualified: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  converted: 'bg-green-500/10 text-green-500 border-green-500/20',
  lost: 'bg-red-500/10 text-red-500 border-red-500/20',
  active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
};

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export const ContactsList = ({ onSelectContact, onAddContact }: ContactsListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(0);

  const debouncedSearch = useDebounce(searchTerm, 400);

  // Reset to page 0 when search or filters change
  useEffect(() => { setPage(0); }, [debouncedSearch, typeFilter, statusFilter]);

  const { useUnifiedContacts, useCRMStats } = useCRM();
  const { data, isLoading } = useUnifiedContacts(debouncedSearch || undefined, page);
  const { data: stats } = useCRMStats();

  const allContacts = data?.contacts || [];

  const filteredContacts = allContacts.filter(contact => {
    if (typeFilter !== 'all' && contact.type !== typeFilter) return false;
    if (statusFilter !== 'all' && contact.status !== statusFilter) return false;
    return true;
  });

  const hasMore = data?.hasMore ?? false;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold">{stats?.total_leads || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Novos</p>
                <p className="text-2xl font-bold">{stats?.new_leads || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <UserCheck className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Convertidos</p>
                <p className="text-2xl font-bold">{stats?.converted_leads || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <DollarSign className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taxa Conversão</p>
                <p className="text-2xl font-bold">{stats?.conversion_rate?.toFixed(1) || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Contatos</CardTitle>
              <CardDescription>Gestão unificada de leads e usuários</CardDescription>
            </div>
            <Button onClick={onAddContact}>
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Contato
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="lead">Leads</SelectItem>
                <SelectItem value="user">Usuários</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="new">Novo</SelectItem>
                <SelectItem value="contacted">Contatado</SelectItem>
                <SelectItem value="qualified">Qualificado</SelectItem>
                <SelectItem value="converted">Convertido</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="lost">Perdido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum contato encontrado
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Desde</TableHead>
                    <TableHead className="text-right">Interações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact) => (
                    <TableRow
                      key={`${contact.type}-${contact.id}`}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => onSelectContact(contact)}
                    >
                      <TableCell className="font-medium">{contact.full_name}</TableCell>
                      <TableCell className="text-muted-foreground">{contact.email || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={contact.type === 'lead' ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'}>
                          {contact.type === 'lead' ? 'Lead' : 'Usuário'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[contact.status] || ''}>
                          {statusLabels[contact.status] || contact.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{contact.source || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(contact.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">{contact.interactions_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {(page > 0 || hasMore) && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Página {page + 1}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={!hasMore || isLoading}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
