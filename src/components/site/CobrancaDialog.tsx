import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

type Props = {
  aberto: boolean;
  aoFechar: () => void;
  tipo: 'plano' | 'evento';
  slug: string;
  titulo: string;
  valorTexto: string;
  permiteCupom?: boolean;
  aoConcluir?: () => void;
};

export default function CobrancaDialog({
  aberto, aoFechar, tipo, slug, titulo, valorTexto, permiteCupom, aoConcluir,
}: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cupom, setCupom] = useState('');
  const [enviando, setEnviando] = useState(false);

  const confirmar = async () => {
    if (!user) {
      navigate('/entrar');
      return;
    }
    if (nome.trim().length < 2 || cpf.replace(/\D/g, '').length !== 11) {
      toast({ title: 'Confira seus dados', description: 'Precisamos do seu nome completo e do CPF.', variant: 'destructive' });
      return;
    }
    setEnviando(true);
    try {
      const { data, error } = await supabase.functions.invoke('criar-cobranca', {
        body: { tipo, slug, nome, cpf, telefone, cupom: cupom || undefined },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      if ((data as any)?.gratuito) {
        toast({ title: 'Inscrição confirmada!', description: 'Você já está na lista deste encontro.' });
        aoConcluir?.();
        aoFechar();
        return;
      }
      const link = (data as any)?.link;
      if (link) {
        window.location.href = link;
        return;
      }
      toast({ title: 'Quase lá', description: 'A cobrança foi criada, mas o link não veio. Fale com a equipe.' });
    } catch (e: any) {
      toast({ title: 'Não deu certo', description: e?.message ?? 'Tente novamente em instantes.', variant: 'destructive' });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && aoFechar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>
            {valorTexto} — confirme seus dados para gerar o pagamento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cob-nome">Nome completo</Label>
            <Input id="cob-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cob-cpf">CPF</Label>
            <Input id="cob-cpf" value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" inputMode="numeric" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cob-tel">Celular (opcional)</Label>
            <Input id="cob-tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" inputMode="tel" />
          </div>
          {permiteCupom && (
            <div className="space-y-1.5">
              <Label htmlFor="cob-cupom">Cupom de desconto (opcional)</Label>
              <Input id="cob-cupom" value={cupom} onChange={(e) => setCupom(e.target.value)} placeholder="Código" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={aoFechar} disabled={enviando}>Cancelar</Button>
          <Button onClick={confirmar} disabled={enviando}>
            {enviando ? 'Gerando…' : 'Continuar para o pagamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
