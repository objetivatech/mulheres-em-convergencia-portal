import { useState } from 'react';
import PainelLayout from '@/components/painel/PainelLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFunil, useSalvarNegociacao, useExcluirNegociacao } from '@/hooks/useAdminNovo';
import { dinheiro } from '@/hooks/usePlanosEventos';

const vazio = { titulo: '', valor: '', contato_nome: '', contato_email: '', estagio_id: '' };

export default function PainelCRM() {
  const { data, isLoading } = useFunil();
  const salvar = useSalvarNegociacao();
  const excluir = useExcluirNegociacao();
  const { toast } = useToast();
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState(vazio);

  const criar = async () => {
    if (!data?.funil) return;
    try {
      await salvar.mutateAsync({
        valores: {
          funil_id: data.funil.id,
          estagio_id: form.estagio_id || data.estagios[0]?.id,
          titulo: form.titulo.trim(),
          valor_centavos: Math.round(Number(form.valor.replace(',', '.') || 0) * 100),
          contato_nome: form.contato_nome.trim() || null,
          contato_email: form.contato_email.trim() || null,
        },
      });
      setForm(vazio);
      setAberto(false);
      toast({ title: 'Oportunidade criada' });
    } catch (e: any) {
      toast({ title: 'Não foi possível salvar', description: e.message, variant: 'destructive' });
    }
  };

  const mover = (id: string, estagio_id: string) =>
    salvar.mutateAsync({ id, valores: { estagio_id } }).catch((e) =>
      toast({ title: 'Não foi possível mover', description: e.message, variant: 'destructive' })
    );

  return (
    <PainelLayout
      titulo="Relacionamento"
      descricao="Oportunidades em andamento, por etapa."
      acoes={
        <Dialog open={aberto} onOpenChange={setAberto}>
          <DialogTrigger asChild><Button size="sm">Nova oportunidade</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova oportunidade</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="titulo">Título</Label>
                <Input id="titulo" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="valor">Valor (R$)</Label>
                  <Input id="valor" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Etapa</Label>
                  <Select value={form.estagio_id} onValueChange={(v) => setForm({ ...form, estagio_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Primeira etapa" /></SelectTrigger>
                    <SelectContent>
                      {(data?.estagios ?? []).map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cn">Contato</Label>
                  <Input id="cn" value={form.contato_nome} onChange={(e) => setForm({ ...form, contato_nome: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ce">E-mail</Label>
                  <Input id="ce" type="email" value={form.contato_email} onChange={(e) => setForm({ ...form, contato_email: e.target.value })} />
                </div>
              </div>
              <Button onClick={criar} disabled={!form.titulo.trim() || salvar.isPending} className="w-full">
                {salvar.isPending ? 'Salvando…' : 'Criar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      {isLoading ? (
        <Skeleton className="h-72 rounded-xl" />
      ) : !data?.funil ? (
        <p className="text-sm text-muted-foreground">Nenhum funil configurado.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.estagios.map((e) => {
            const itens = data.negociacoes.filter((n) => n.estagio_id === e.id);
            const total = itens.reduce((s, n) => s + (n.valor_centavos ?? 0), 0);
            return (
              <section key={e.id} className="rounded-xl border border-border bg-card p-4">
                <header className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-sm">{e.nome}</h2>
                  <span className="text-xs text-muted-foreground">{itens.length} · {dinheiro(total)}</span>
                </header>
                <ul className="space-y-2">
                  {itens.map((n) => (
                    <li key={n.id} className="rounded-lg border border-border p-3 space-y-2">
                      <p className="text-sm font-medium">{n.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {n.pessoa?.nome ?? n.contato_nome ?? 'Sem contato'} · {dinheiro(n.valor_centavos)}
                      </p>
                      <div className="flex items-center gap-2">
                        <Select value={n.estagio_id ?? ''} onValueChange={(v) => mover(n.id, v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {data.estagios.map((s) => (
                              <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="sm" variant="ghost" onClick={() => excluir.mutate(n.id)} aria-label="Excluir">
                          ×
                        </Button>
                      </div>
                    </li>
                  ))}
                  {!itens.length && <p className="text-xs text-muted-foreground">Nada por aqui.</p>}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </PainelLayout>
  );
}
