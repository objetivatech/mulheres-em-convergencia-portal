import React, { useState } from 'react';
import { useEventCoupons, EventCoupon } from '@/hooks/useEventCoupons';
import { useEvents } from '@/hooks/useEvents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Plus, Ticket, Percent, DollarSign, Edit2, Trash2, 
  Copy, Calendar, Users, CheckCircle, XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const CouponForm: React.FC<{ 
  coupon?: EventCoupon | null; 
  onClose: () => void;
}> = ({ coupon, onClose }) => {
  const { toast } = useToast();
  const couponsHook = useEventCoupons();
  const createCoupon = couponsHook.useCreateCoupon();
  const updateCoupon = couponsHook.useUpdateCoupon();
  const events = useEvents();
  const { data: eventsList } = events.useEventsList();

  const [formData, setFormData] = useState({
    code: coupon?.code || '',
    description: coupon?.description || '',
    discount_type: coupon?.discount_type || 'percentage',
    discount_value: coupon?.discount_value || 10,
    event_id: coupon?.event_id || '',
    all_events: coupon?.all_events ?? true,
    max_uses: coupon?.max_uses || null,
    min_purchase: coupon?.min_purchase || 0,
    valid_until: coupon?.valid_until ? format(new Date(coupon.valid_until), "yyyy-MM-dd'T'HH:mm") : '',
    active: coupon?.active ?? true,
  });

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        ...formData,
        code: formData.code.toUpperCase(),
        event_id: formData.all_events ? null : formData.event_id || null,
        valid_until: formData.valid_until || null,
        max_uses: formData.max_uses || null,
      };

      if (coupon) {
        await updateCoupon.mutateAsync({ id: coupon.id, ...payload });
        toast({ title: 'Cupom atualizado!' });
      } else {
        await createCoupon.mutateAsync(payload);
        toast({ title: 'Cupom criado!' });
      }
      onClose();
    } catch (error: any) {
      toast({ title: 'Erro ao salvar cupom', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>Código do Cupom</Label>
          <div className="flex gap-2">
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="EX: PROMO2024"
              required
              className="font-mono uppercase"
            />
            <Button type="button" variant="outline" onClick={generateCode}>
              Gerar
            </Button>
          </div>
        </div>

        <div className="col-span-2">
          <Label>Descrição</Label>
          <Input
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descrição interna do cupom"
          />
        </div>

        <div>
          <Label>Tipo de Desconto</Label>
          <Select 
            value={formData.discount_type} 
            onValueChange={(v) => setFormData({ ...formData, discount_type: v as any })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentual (%)</SelectItem>
              <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Valor do Desconto</Label>
          <div className="relative">
            <Input
              type="number"
              step={formData.discount_type === 'percentage' ? '1' : '0.01'}
              value={formData.discount_value}
              onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
              className="pr-8"
              required
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {formData.discount_type === 'percentage' ? '%' : 'R$'}
            </span>
          </div>
        </div>

        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-2">
            <Switch
              checked={formData.all_events}
              onCheckedChange={(checked) => setFormData({ ...formData, all_events: checked })}
            />
            <Label>Válido para todos os eventos</Label>
          </div>
          
          {!formData.all_events && (
            <Select 
              value={formData.event_id} 
              onValueChange={(v) => setFormData({ ...formData, event_id: v })}
            >
              <SelectTrigger><SelectValue placeholder="Selecionar evento..." /></SelectTrigger>
              <SelectContent>
                {eventsList?.filter(e => !e.free).map(event => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div>
          <Label>Limite de Usos</Label>
          <Input
            type="number"
            value={formData.max_uses || ''}
            onChange={(e) => setFormData({ ...formData, max_uses: e.target.value ? parseInt(e.target.value) : null })}
            placeholder="Sem limite"
          />
        </div>

        <div>
          <Label>Compra Mínima (R$)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.min_purchase}
            onChange={(e) => setFormData({ ...formData, min_purchase: parseFloat(e.target.value) || 0 })}
          />
        </div>

        <div className="col-span-2">
          <Label>Válido Até</Label>
          <Input
            type="datetime-local"
            value={formData.valid_until}
            onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
          />
          <p className="text-xs text-muted-foreground mt-1">Deixe em branco para sem expiração</p>
        </div>

        <div className="col-span-2 flex items-center gap-2">
          <Switch
            checked={formData.active}
            onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
          />
          <Label>Cupom Ativo</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={createCoupon.isPending || updateCoupon.isPending}>
          {coupon ? 'Atualizar' : 'Criar'} Cupom
        </Button>
      </div>
    </form>
  );
};

export const CouponsManagement: React.FC = () => {
  const { toast } = useToast();
  const couponsHook = useEventCoupons();
  const { data: coupons, isLoading } = couponsHook.useCoupons({});
  const { data: stats } = couponsHook.useCouponStats();
  const deleteCoupon = couponsHook.useDeleteCoupon();

  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<EventCoupon | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este cupom?')) return;
    try {
      await deleteCoupon.mutateAsync(id);
      toast({ title: 'Cupom excluído' });
    } catch (error: any) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Código copiado!' });
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats?.total_coupons || 0}</div>
            <p className="text-muted-foreground text-sm">Total Cupons</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">{stats?.active_coupons || 0}</div>
            <p className="text-muted-foreground text-sm">Ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats?.total_uses || 0}</div>
            <p className="text-muted-foreground text-sm">Utilizações</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{formatCurrency(stats?.total_discounts || 0)}</div>
            <p className="text-muted-foreground text-sm">Descontos Aplicados</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) setEditingCoupon(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingCoupon(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cupom
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingCoupon ? 'Editar Cupom' : 'Novo Cupom'}</DialogTitle>
            </DialogHeader>
            <CouponForm 
              coupon={editingCoupon} 
              onClose={() => { setShowForm(false); setEditingCoupon(null); }} 
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Coupons Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Cupons de Desconto
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Carregando...</p>
          ) : coupons?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum cupom cadastrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Desconto</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Usos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons?.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded font-mono text-sm">
                          {coupon.code}
                        </code>
                        <Button size="icon" variant="ghost" onClick={() => copyCode(coupon.code)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      {coupon.description && (
                        <p className="text-xs text-muted-foreground mt-1">{coupon.description}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {coupon.discount_type === 'percentage' ? (
                          <><Percent className="h-4 w-4" />{coupon.discount_value}%</>
                        ) : (
                          <><DollarSign className="h-4 w-4" />{formatCurrency(coupon.discount_value)}</>
                        )}
                      </div>
                      {coupon.all_events ? (
                        <Badge variant="outline" className="mt-1 text-xs">Todos eventos</Badge>
                      ) : (
                        <Badge variant="secondary" className="mt-1 text-xs">Evento específico</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {coupon.valid_until ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(coupon.valid_until), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Sem expiração</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {coupon.current_uses}/{coupon.max_uses || '∞'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {coupon.active ? (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />Ativo
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />Inativo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => { setEditingCoupon(coupon); setShowForm(true); }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => handleDelete(coupon.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
