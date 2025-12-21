import React, { useState } from 'react';
import { useDonations, Donation, Sponsor } from '@/hooks/useDonations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Plus, Heart, Building2, TrendingUp, 
  DollarSign, Users, Calendar, Search,
  Edit2, CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const tierColors: Record<string, string> = {
  bronze: 'bg-amber-600',
  silver: 'bg-gray-400',
  gold: 'bg-yellow-500',
  platinum: 'bg-blue-400',
  diamond: 'bg-purple-500',
};

const tierLabels: Record<string, string> = {
  bronze: 'Bronze',
  silver: 'Prata',
  gold: 'Ouro',
  platinum: 'Platina',
  diamond: 'Diamante',
};

export const DonationsManagement: React.FC = () => {
  const { toast } = useToast();
  const donations = useDonations();
  const { data: donationsList, isLoading: donationsLoading } = donations.useDonationsList();
  const { data: sponsorsList, isLoading: sponsorsLoading } = donations.useSponsorsList();
  const { data: stats } = donations.useDonationStats();
  const createDonation = donations.useCreateDonation();
  const updateDonation = donations.useUpdateDonation();
  const createSponsor = donations.useCreateSponsor();
  const updateSponsor = donations.useUpdateSponsor();

  const [showDonationForm, setShowDonationForm] = useState(false);
  const [showSponsorForm, setShowSponsorForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Donation Form
  const DonationForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [formData, setFormData] = useState({
      donor_name: '',
      email: '',
      phone: '',
      cpf: '',
      amount: 0,
      type: 'one_time' as const,
      status: 'completed' as const,
      payment_method: 'pix',
      project: '',
      campaign: '',
      anonymous: false,
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        await createDonation.mutateAsync(formData);
        toast({ title: 'Doação registrada com sucesso!' });
        onClose();
      } catch (error) {
        toast({ title: 'Erro ao registrar doação', variant: 'destructive' });
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label>Nome do Doador</Label>
            <Input
              value={formData.donor_name}
              onChange={(e) => setFormData({ ...formData, donor_name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Telefone</Label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div>
            <Label>CPF</Label>
            <Input
              value={formData.cpf}
              onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
            />
          </div>
          <div>
            <Label>Valor (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              required
            />
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="one_time">Única</SelectItem>
                <SelectItem value="recurring">Recorrente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Método de Pagamento</Label>
            <Select value={formData.payment_method} onValueChange={(v) => setFormData({ ...formData, payment_method: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
                <SelectItem value="transfer">Transferência</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Projeto</Label>
            <Input
              value={formData.project}
              onChange={(e) => setFormData({ ...formData, project: e.target.value })}
              placeholder="Ex: Educação, Saúde..."
            />
          </div>
          <div>
            <Label>Campanha</Label>
            <Input
              value={formData.campaign}
              onChange={(e) => setFormData({ ...formData, campaign: e.target.value })}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={createDonation.isPending}>Registrar Doação</Button>
        </div>
      </form>
    );
  };

  // Sponsor Form
  const SponsorForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [formData, setFormData] = useState({
      name: '',
      contact_name: '',
      email: '',
      phone: '',
      cnpj: '',
      tier: 'bronze' as const,
      total_contribution: 0,
      status: 'active' as const,
      website: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        await createSponsor.mutateAsync(formData);
        toast({ title: 'Patrocinador adicionado com sucesso!' });
        onClose();
      } catch (error) {
        toast({ title: 'Erro ao adicionar patrocinador', variant: 'destructive' });
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label>Nome da Empresa</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Contato</Label>
            <Input
              value={formData.contact_name}
              onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Telefone</Label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div>
            <Label>CNPJ</Label>
            <Input
              value={formData.cnpj}
              onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
            />
          </div>
          <div>
            <Label>Nível</Label>
            <Select value={formData.tier} onValueChange={(v) => setFormData({ ...formData, tier: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bronze">Bronze</SelectItem>
                <SelectItem value="silver">Prata</SelectItem>
                <SelectItem value="gold">Ouro</SelectItem>
                <SelectItem value="platinum">Platina</SelectItem>
                <SelectItem value="diamond">Diamante</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Contribuição Total (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.total_contribution}
              onChange={(e) => setFormData({ ...formData, total_contribution: parseFloat(e.target.value) })}
            />
          </div>
          <div>
            <Label>Website</Label>
            <Input
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={createSponsor.isPending}>Adicionar Patrocinador</Button>
        </div>
      </form>
    );
  };

  // Pie chart data for donation types
  const pieData = [
    { name: 'Doações Únicas', value: stats?.one_time_donations || 0, color: 'hsl(var(--primary))' },
    { name: 'Doações Recorrentes', value: stats?.recurring_donations || 0, color: 'hsl(var(--secondary))' },
    { name: 'Patrocínios', value: stats?.total_sponsorship || 0, color: 'hsl(var(--tertiary))' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div className="text-2xl font-bold">{formatCurrency(stats?.total_revenue || 0)}</div>
            </div>
            <p className="text-muted-foreground text-sm">Receita Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              <div className="text-2xl font-bold">{formatCurrency(stats?.total_donations || 0)}</div>
            </div>
            <p className="text-muted-foreground text-sm">Doações</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-500" />
              <div className="text-2xl font-bold">{formatCurrency(stats?.total_sponsorship || 0)}</div>
            </div>
            <p className="text-muted-foreground text-sm">Patrocínios</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              <div className="text-2xl font-bold">{stats?.donors_count || 0}</div>
            </div>
            <p className="text-muted-foreground text-sm">Doadores</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Doações por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.monthly_data || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => `R$${v/1000}k`} />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.3} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Receita</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Donations and Sponsors */}
      <Tabs defaultValue="donations" className="w-full">
        <TabsList>
          <TabsTrigger value="donations" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Doações
          </TabsTrigger>
          <TabsTrigger value="sponsors" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Patrocinadores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="donations" className="mt-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar doações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog open={showDonationForm} onOpenChange={setShowDonationForm}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Doação
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Registrar Doação</DialogTitle>
                </DialogHeader>
                <DonationForm onClose={() => setShowDonationForm(false)} />
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              {donationsLoading ? (
                <p className="p-6">Carregando...</p>
              ) : donationsList?.length === 0 ? (
                <p className="p-6 text-muted-foreground">Nenhuma doação encontrada.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Doador</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Projeto</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {donationsList?.filter(d => 
                      d.donor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      d.email.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map((donation) => (
                      <TableRow key={donation.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {donation.anonymous ? 'Anônimo' : donation.donor_name}
                            </div>
                            <div className="text-sm text-muted-foreground">{donation.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-green-600">
                          {formatCurrency(donation.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={donation.type === 'recurring' ? 'default' : 'secondary'}>
                            {donation.type === 'recurring' ? 'Recorrente' : 'Única'}
                          </Badge>
                        </TableCell>
                        <TableCell>{donation.project || '-'}</TableCell>
                        <TableCell>
                          {format(new Date(donation.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={donation.status === 'completed' ? 'default' : 'secondary'}>
                            {donation.status === 'completed' ? 'Confirmada' : donation.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sponsors" className="mt-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="text-muted-foreground">
              {stats?.active_sponsors || 0} patrocinadores ativos
            </div>
            <Dialog open={showSponsorForm} onOpenChange={setShowSponsorForm}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Patrocinador
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Adicionar Patrocinador</DialogTitle>
                </DialogHeader>
                <SponsorForm onClose={() => setShowSponsorForm(false)} />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sponsorsLoading ? (
              <p>Carregando...</p>
            ) : sponsorsList?.length === 0 ? (
              <p className="text-muted-foreground col-span-full">Nenhum patrocinador cadastrado.</p>
            ) : (
              sponsorsList?.map((sponsor) => (
                <Card key={sponsor.id} className="overflow-hidden">
                  <div className={`h-2 ${tierColors[sponsor.tier]}`} />
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{sponsor.name}</h3>
                        <p className="text-sm text-muted-foreground">{sponsor.email}</p>
                      </div>
                      <Badge className={tierColors[sponsor.tier]}>
                        {tierLabels[sponsor.tier]}
                      </Badge>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Contribuição:</span>
                        <span className="font-medium">{formatCurrency(sponsor.total_contribution)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={sponsor.status === 'active' ? 'default' : 'secondary'}>
                          {sponsor.status === 'active' ? 'Ativo' : sponsor.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
