import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useCriarPessoa, useSemelhantes } from '@/hooks/useCrmMec';
import { ORIGENS } from '@/lib/crm';
import { rotaCrm } from './CrmLayout';

const vazio = { nome: '', apelido: '', telefone: '', email: '', cpf: '', origem: 'instagram', primeiro: '', observacao: '' };

/** Cadastro rápido de contato vindo de WhatsApp, Instagram, evento etc. CPF é opcional. */
export default function NovaPessoaDialog({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const { toast } = useToast();
  const navegar = useNavigate();
  const criar = useCriarPessoa();
  const [f, setF] = useState(vazio);
  const [debounced, setDebounced] = useState(vazio);

  useEffect(() => { if (aberto) { setF(vazio); setDebounced(vazio); } }, [aberto]);
  useEffect(() => { const t = setTimeout(() => setDebounced(f), 400); return () => clearTimeout(t); }, [f]);

  const { data: parecidas } = useSemelhantes({ nome: debounced.nome, email: debounced.email, telefone: debounced.telefone, cpf: debounced.cpf });
  const conflitoForte = (parecidas ?? []).some((p) => p.motivo !== 'Nome igual (confira antes)');

  const enviar = async () => {
    try {
      const id = await criar.mutateAsync({
        nome: f.nome, apelido: f.apelido, telefone: f.telefone, email: f.email, cpf: f.cpf,
        origem: f.origem, primeiro_contato_em: f.primeiro ? new Date(`${f.primeiro}T12:00:00`).toISOString() : null,
        observacao: f.observacao,
      });
      toast({ title: 'Contato cadastrado' });
      onFechar();
      navegar(rotaCrm.ficha(id));
    } catch (e: any) {
      toast({ title: 'Não foi possível cadastrar', description: e.message, variant: 'destructive' });
    }
  };

  const campo = (k: keyof typeof vazio) => ({ value: f[k], onChange: (e: any) => setF({ ...f, [k]: e.target.value }) });

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova pessoa</DialogTitle>
          <DialogDescription>
            Para quem chegou por WhatsApp, redes ou evento e ainda não tem conta no site. Quando ela se
            cadastrar com o mesmo e-mail ou CPF, a ficha é unida sozinha.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="np-nome">Nome *</Label>
              <Input id="np-nome" {...campo('nome')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="np-apelido">Apelido / como é conhecida</Label>
              <Input id="np-apelido" {...campo('apelido')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="np-tel">WhatsApp (com DDD)</Label>
              <Input id="np-tel" inputMode="tel" {...campo('telefone')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="np-email">E-mail</Label>
              <Input id="np-email" type="email" {...campo('email')} />
            </div>
            <div className="space-y-1.5">
              <Label>Como chegou</Label>
              <Select value={f.origem} onValueChange={(v) => setF({ ...f, origem: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ORIGENS.map((o) => <SelectItem key={o.v} value={o.v}>{o.r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="np-data">Primeiro contato (se souber)</Label>
              <Input id="np-data" type="date" {...campo('primeiro')} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="np-cpf">CPF (opcional)</Label>
              <Input id="np-cpf" inputMode="numeric" {...campo('cpf')} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="np-obs">Anotação inicial (opcional)</Label>
            <Textarea id="np-obs" rows={3} {...campo('observacao')} placeholder="Ex.: Conheci no encontro de março, tem loja de doces." />
          </div>

          {!!parecidas?.length && (
            <div className="rounded-xl border border-warning/50 bg-warning/10 p-3 text-sm space-y-2" role="status">
              <p className="font-semibold">Talvez esta pessoa já esteja cadastrada:</p>
              <ul className="space-y-1">
                {parecidas.map((p) => (
                  <li key={p.pessoa_id} className="flex items-center justify-between gap-2">
                    <span>{p.nome} <span className="text-muted-foreground">· {p.motivo}</span></span>
                    <Link to={rotaCrm.ficha(p.pessoa_id)} onClick={onFechar} className="text-primary underline underline-offset-2">Abrir ficha</Link>
                  </li>
                ))}
              </ul>
              {conflitoForte && <p className="text-xs">Com e-mail, telefone ou CPF iguais não dá para criar outra ficha. Abra a existente.</p>}
            </div>
          )}

          <Button className="w-full" onClick={enviar} disabled={f.nome.trim().length < 2 || conflitoForte || criar.isPending}>
            {criar.isPending ? 'Salvando…' : 'Cadastrar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
