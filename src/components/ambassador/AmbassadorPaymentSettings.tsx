import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, CreditCard, Save, Loader2 } from 'lucide-react';
import { Ambassador, BankData, useAmbassador } from '@/hooks/useAmbassador';

interface AmbassadorPaymentSettingsProps {
  ambassador: Ambassador;
}

const BANKS = [
  { code: '001', name: 'Banco do Brasil' },
  { code: '033', name: 'Santander' },
  { code: '104', name: 'Caixa Econômica' },
  { code: '237', name: 'Bradesco' },
  { code: '341', name: 'Itaú' },
  { code: '260', name: 'Nubank' },
  { code: '077', name: 'Inter' },
  { code: '756', name: 'Sicoob' },
  { code: '748', name: 'Sicredi' },
  { code: '336', name: 'C6 Bank' },
  { code: '290', name: 'PagSeguro' },
  { code: '380', name: 'PicPay' },
];

export const AmbassadorPaymentSettings = ({ ambassador }: AmbassadorPaymentSettingsProps) => {
  const { useUpdatePaymentData } = useAmbassador();
  const updatePayment = useUpdatePaymentData();

  const [paymentPreference, setPaymentPreference] = useState<'pix' | 'bank_transfer'>(
    ambassador.payment_preference || 'pix'
  );
  const [pixKey, setPixKey] = useState(ambassador.pix_key || '');
  const [bankData, setBankData] = useState<BankData>(ambassador.bank_data || {});

  useEffect(() => {
    setPaymentPreference(ambassador.payment_preference || 'pix');
    setPixKey(ambassador.pix_key || '');
    setBankData(ambassador.bank_data || {});
  }, [ambassador]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await updatePayment.mutateAsync({
      payment_preference: paymentPreference,
      pix_key: paymentPreference === 'pix' ? pixKey : undefined,
      bank_data: paymentPreference === 'bank_transfer' ? bankData : undefined,
    });
  };

  const updateBankData = (field: keyof BankData, value: string) => {
    setBankData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Dados para Pagamento
        </CardTitle>
        <CardDescription>
          Configure como você deseja receber suas comissões
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <Label>Forma de pagamento preferida:</Label>
            <RadioGroup
              value={paymentPreference}
              onValueChange={(value) => setPaymentPreference(value as 'pix' | 'bank_transfer')}
              className="grid gap-4 md:grid-cols-2"
            >
              <div>
                <RadioGroupItem
                  value="pix"
                  id="pix"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="pix"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <Wallet className="mb-3 h-6 w-6" />
                  <span className="font-semibold">PIX</span>
                  <span className="text-sm text-muted-foreground">Receba instantaneamente</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="bank_transfer"
                  id="bank_transfer"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="bank_transfer"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <CreditCard className="mb-3 h-6 w-6" />
                  <span className="font-semibold">Transferência</span>
                  <span className="text-sm text-muted-foreground">TED/DOC para sua conta</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {paymentPreference === 'pix' && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="pix_key">Chave PIX</Label>
                <Input
                  id="pix_key"
                  placeholder="CPF, email, telefone ou chave aleatória"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Informe sua chave PIX para receber os pagamentos
                </p>
              </div>
            </div>
          )}

          {paymentPreference === 'bank_transfer' && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="holder_name">Nome do titular</Label>
                  <Input
                    id="holder_name"
                    placeholder="Nome completo"
                    value={bankData.holder_name || ''}
                    onChange={(e) => updateBankData('holder_name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="holder_cpf">CPF do titular</Label>
                  <Input
                    id="holder_cpf"
                    placeholder="000.000.000-00"
                    value={bankData.holder_cpf || ''}
                    onChange={(e) => updateBankData('holder_cpf', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bank">Banco</Label>
                  <Select
                    value={bankData.bank_code || ''}
                    onValueChange={(value) => {
                      const bank = BANKS.find(b => b.code === value);
                      updateBankData('bank_code', value);
                      if (bank) updateBankData('bank_name', bank.name);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o banco" />
                    </SelectTrigger>
                    <SelectContent>
                      {BANKS.map((bank) => (
                        <SelectItem key={bank.code} value={bank.code}>
                          {bank.code} - {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account_type">Tipo de conta</Label>
                  <Select
                    value={bankData.account_type || ''}
                    onValueChange={(value) => updateBankData('account_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="corrente">Conta Corrente</SelectItem>
                      <SelectItem value="poupanca">Conta Poupança</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="agency">Agência</Label>
                  <Input
                    id="agency"
                    placeholder="0000"
                    value={bankData.agency || ''}
                    onChange={(e) => updateBankData('agency', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account">Conta (com dígito)</Label>
                  <Input
                    id="account"
                    placeholder="00000-0"
                    value={bankData.account || ''}
                    onChange={(e) => updateBankData('account', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <Button type="submit" disabled={updatePayment.isPending}>
            {updatePayment.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Dados de Pagamento
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
