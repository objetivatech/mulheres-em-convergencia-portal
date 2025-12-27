import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ProductConfig } from '@/types/landing-page';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LPCheckoutFormProps {
  product: ProductConfig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LPCheckoutForm = ({ product, open, onOpenChange }: LPCheckoutFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    cpf: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações básicas
    if (!formData.full_name.trim() || !formData.email.trim()) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({ title: 'Email inválido', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-product-payment', {
        body: {
          product_id: product.id,
          product_name: product.name,
          product_price: product.price,
          product_description: product.paymentDescription,
          customer_data: {
            full_name: formData.full_name,
            email: formData.email,
            phone: formData.phone || null,
            cpf: formData.cpf || null,
          },
          payment_method: 'PIX',
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao processar pagamento');

      // Redireciona para checkout do ASAAS
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
        return;
      }

      toast({ title: 'Pagamento iniciado com sucesso!' });
    } catch (error: any) {
      console.error('[LPCheckoutForm] Error:', error);
      toast({ 
        title: 'Erro ao processar pagamento', 
        description: error.message || 'Tente novamente em alguns instantes.',
        variant: 'destructive' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Finalizar Inscrição</DialogTitle>
          <DialogDescription>
            Preencha seus dados para garantir sua vaga no {product.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nome completo *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Seu nome completo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">WhatsApp</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              value={formData.cpf}
              onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
              placeholder="000.000.000-00"
            />
          </div>

          {/* Resumo do Produto */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <p className="font-medium text-foreground">{product.name}</p>
            {product.eventDates && (
              <p className="text-sm text-muted-foreground">📅 {product.eventDates}</p>
            )}
            <p className="text-xl font-bold text-primary">
              R$ {product.price.toFixed(2).replace('.', ',')}
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              'Continuar para Pagamento'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
