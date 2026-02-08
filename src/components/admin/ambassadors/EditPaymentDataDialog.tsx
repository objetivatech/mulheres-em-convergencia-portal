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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AmbassadorWithProfile, useAmbassadorAdmin } from '@/hooks/useAmbassadorAdmin';
import { BankData } from '@/hooks/useAmbassador';

interface EditPaymentDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ambassador: AmbassadorWithProfile | null;
}

export const EditPaymentDataDialog = ({
  open,
  onOpenChange,
  ambassador,
}: EditPaymentDataDialogProps) => {
  const [paymentPreference, setPaymentPreference] = useState<'pix' | 'bank_transfer'>('pix');
  const [pixKey, setPixKey] = useState('');
  const [bankData, setBankData] = useState<BankData>({
    bank_name: '',
    bank_code: '',
    agency: '',
    account: '',
    account_type: 'corrente',
    holder_name: '',
    holder_cpf: '',
  });

  const { useAdminUpdatePaymentData } = useAmbassadorAdmin();
  const updatePayment = useAdminUpdatePaymentData();

  useEffect(() => {
    if (ambassador) {
      setPaymentPreference(ambassador.payment_preference || 'pix');
      setPixKey(ambassador.pix_key || '');
      setBankData({
        bank_name: ambassador.bank_data?.bank_name || '',
        bank_code: ambassador.bank_data?.bank_code || '',
        agency: ambassador.bank_data?.agency || '',
        account: ambassador.bank_data?.account || '',
        account_type: ambassador.bank_data?.account_type || 'corrente',
        holder_name: ambassador.bank_data?.holder_name || '',
        holder_cpf: ambassador.bank_data?.holder_cpf || '',
      });
    }
  }, [ambassador]);

  const handleSave = async () => {
    if (!ambassador) return;
    
    await updatePayment.mutateAsync({
      ambassadorId: ambassador.id,
      payment_preference: paymentPreference,
      pix_key: pixKey,
      bank_data: bankData,
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Dados de Pagamento</DialogTitle>
          <DialogDescription>
            Editar informações de pagamento de {ambassador?.profile?.full_name}
          </DialogDescription>
        </DialogHeader>
        <Tabs value={paymentPreference} onValueChange={(v) => setPaymentPreference(v as 'pix' | 'bank_transfer')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pix">PIX</TabsTrigger>
            <TabsTrigger value="bank_transfer">Transferência</TabsTrigger>
          </TabsList>
          <TabsContent value="pix" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="pixKey">Chave PIX</Label>
              <Input
                id="pixKey"
                placeholder="CPF, Email, Telefone ou Chave Aleatória"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
              />
            </div>
          </TabsContent>
          <TabsContent value="bank_transfer" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Nome do Banco</Label>
                <Input
                  id="bankName"
                  placeholder="Ex: Banco do Brasil"
                  value={bankData.bank_name}
                  onChange={(e) => setBankData({ ...bankData, bank_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankCode">Código do Banco</Label>
                <Input
                  id="bankCode"
                  placeholder="Ex: 001"
                  value={bankData.bank_code}
                  onChange={(e) => setBankData({ ...bankData, bank_code: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agency">Agência</Label>
                <Input
                  id="agency"
                  placeholder="0000"
                  value={bankData.agency}
                  onChange={(e) => setBankData({ ...bankData, agency: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account">Conta</Label>
                <Input
                  id="account"
                  placeholder="00000-0"
                  value={bankData.account}
                  onChange={(e) => setBankData({ ...bankData, account: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountType">Tipo de Conta</Label>
              <Select 
                value={bankData.account_type} 
                onValueChange={(v) => setBankData({ ...bankData, account_type: v as 'corrente' | 'poupanca' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="corrente">Conta Corrente</SelectItem>
                  <SelectItem value="poupanca">Poupança</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="holderName">Nome do Titular</Label>
                <Input
                  id="holderName"
                  placeholder="Nome completo"
                  value={bankData.holder_name}
                  onChange={(e) => setBankData({ ...bankData, holder_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="holderCpf">CPF do Titular</Label>
                <Input
                  id="holderCpf"
                  placeholder="000.000.000-00"
                  value={bankData.holder_cpf}
                  onChange={(e) => setBankData({ ...bankData, holder_cpf: e.target.value })}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={updatePayment.isPending}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
