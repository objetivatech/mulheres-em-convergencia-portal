import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { 
  Search, 
  MoreVertical, 
  Edit, 
  DollarSign, 
  Link as LinkIcon, 
  Copy,
  TrendingUp,
  Percent,
  ExternalLink,
} from 'lucide-react';
import { AmbassadorWithProfile, useAmbassadorAdmin } from '@/hooks/useAmbassadorAdmin';
import { useToast } from '@/hooks/use-toast';

interface AdminAmbassadorsListProps {
  ambassadors: AmbassadorWithProfile[];
  onEditAmbassador: (ambassador: AmbassadorWithProfile) => void;
  onEditPayment: (ambassador: AmbassadorWithProfile) => void;
  onViewDetails: (ambassador: AmbassadorWithProfile) => void;
}

export const AdminAmbassadorsList = ({
  ambassadors,
  onEditAmbassador,
  onEditPayment,
  onViewDetails,
}: AdminAmbassadorsListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { useToggleAmbassadorStatus } = useAmbassadorAdmin();
  const toggleStatus = useToggleAmbassadorStatus();
  const { toast } = useToast();

  const filteredAmbassadors = ambassadors.filter(amb => {
    const name = amb.profile?.full_name?.toLowerCase() || '';
    const email = amb.profile?.email?.toLowerCase() || '';
    const code = amb.referral_code.toLowerCase();
    const search = searchTerm.toLowerCase();
    return name.includes(search) || email.includes(search) || code.includes(search);
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const copyLink = (code: string) => {
    const link = `${window.location.origin}/convite/${code}`;
    navigator.clipboard.writeText(link);
    toast({
      title: 'Link copiado!',
      description: 'Link de convite copiado para a área de transferência.',
    });
  };

  const handleToggleStatus = async (amb: AmbassadorWithProfile) => {
    await toggleStatus.mutateAsync({
      ambassadorId: amb.id,
      active: !amb.active,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Lista de Embaixadoras ({ambassadors.length})
          </CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Embaixadora</TableHead>
                <TableHead>Código</TableHead>
                <TableHead className="text-center">Taxa</TableHead>
                <TableHead className="text-center">Cliques</TableHead>
                <TableHead className="text-center">Conversões</TableHead>
                <TableHead className="text-right">Ganhos</TableHead>
                <TableHead className="text-right">Pendente</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAmbassadors.map((amb) => {
                const conversionRate = amb.link_clicks > 0 
                  ? ((amb.total_sales / amb.link_clicks) * 100).toFixed(1) 
                  : '0.0';
                
                return (
                  <TableRow key={amb.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{amb.profile?.full_name || 'Sem nome'}</p>
                        <p className="text-sm text-muted-foreground">{amb.profile?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded text-sm">
                          {amb.referral_code}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyLink(amb.referral_code)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">
                        <Percent className="h-3 w-3 mr-1" />
                        {amb.commission_rate}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {amb.link_clicks?.toLocaleString('pt-BR') || 0}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-medium">{amb.total_sales || 0}</span>
                        <span className="text-xs text-muted-foreground">
                          ({conversionRate}%)
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {formatCurrency(amb.total_earnings || 0)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-orange-600">
                      {formatCurrency(amb.pending_commission || 0)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={amb.active}
                        onCheckedChange={() => handleToggleStatus(amb)}
                        disabled={toggleStatus.isPending}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onViewDetails(amb)}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEditAmbassador(amb)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar taxa
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEditPayment(amb)}>
                            <DollarSign className="h-4 w-4 mr-2" />
                            Dados de pagamento
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => copyLink(amb.referral_code)}>
                            <LinkIcon className="h-4 w-4 mr-2" />
                            Copiar link
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredAmbassadors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'Nenhuma embaixadora encontrada.' : 'Nenhuma embaixadora cadastrada.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
