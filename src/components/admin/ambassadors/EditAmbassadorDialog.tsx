import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { AmbassadorWithProfile, useAmbassadorAdmin } from '@/hooks/useAmbassadorAdmin';
import { Percent } from 'lucide-react';

interface EditAmbassadorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ambassador: AmbassadorWithProfile | null;
}

export const EditAmbassadorDialog = ({
  open,
  onOpenChange,
  ambassador,
}: EditAmbassadorDialogProps) => {
  const [commissionRate, setCommissionRate] = useState(15);
  const { useUpdateCommissionRate } = useAmbassadorAdmin();
  const updateRate = useUpdateCommissionRate();

  useEffect(() => {
    if (ambassador) {
      setCommissionRate(ambassador.commission_rate);
    }
  }, [ambassador]);

  const handleSave = async () => {
    if (!ambassador) return;
    
    await updateRate.mutateAsync({
      ambassadorId: ambassador.id,
      rate: commissionRate,
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Taxa de Comissão</DialogTitle>
          <DialogDescription>
            Ajuste a taxa de comissão para {ambassador?.profile?.full_name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Taxa de Comissão</Label>
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(Number(e.target.value))}
                  className="w-20 text-center"
                  min={0}
                  max={100}
                />
              </div>
            </div>
            <Slider
              value={[commissionRate]}
              onValueChange={([value]) => setCommissionRate(value)}
              min={0}
              max={50}
              step={0.5}
            />
            <p className="text-sm text-muted-foreground">
              Comissão padrão: 15%. A embaixadora receberá {commissionRate}% de cada venda.
            </p>
          </div>

          {ambassador && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <h4 className="font-medium">Informações</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Código:</span>
                <span className="font-mono">{ambassador.referral_code}</span>
                <span className="text-muted-foreground">Total de vendas:</span>
                <span>{ambassador.total_sales}</span>
                <span className="text-muted-foreground">Total de cliques:</span>
                <span>{ambassador.link_clicks}</span>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={updateRate.isPending}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
