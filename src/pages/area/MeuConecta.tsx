import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import AreaLayout from '@/components/area/AreaLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useMeuConecta, useSalvarConectaPerfil, useMeuPerfil } from '@/hooks/useMinhaArea';

export default function MeuConecta() {
  const { data, isLoading } = useMeuConecta();
  const { data: perfil } = useMeuPerfil();
  const salvar = useSalvarConectaPerfil();
  const { toast } = useToast();

  const [form, setForm] = useState({ apresentacao: '', empresa: '', cargo: '' });

  useEffect(() => {
    if (data?.perfil) {
      setForm({
        apresentacao: data.perfil.apresentacao ?? '',
        empresa: data.perfil.empresa ?? '',
        cargo: data.perfil.cargo ?? '',
      });
    }
  }, [data?.perfil]);

  const enviar = async () => {
    try {
      await salvar.mutateAsync({
        apresentacao: form.apresentacao.trim() || null,
        empresa: form.empresa.trim() || null,
        cargo: form.cargo.trim() || null,
      });
      toast({ title: 'Perfil atualizado', description: 'Suas informações do Conecta+ foram salvas.' });
    } catch (e: any) {
      toast({ title: 'Não foi possível salvar', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <AreaLayout titulo="Conecta+" descricao="Sua presença na rede de negócios entre associadas.">
      <Helmet>
        <title>Conecta+ | Minha área</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      {!perfil?.acesso_conecta && (
        <div className="mb-6 rounded-xl border border-dashed border-border p-5 space-y-3">
          <p className="text-sm text-muted-foreground">
            O Conecta+ é para associadas com plano ativo. Você pode preencher seu perfil desde já.
          </p>
          <Button asChild size="sm"><Link to="/planos">Ver planos</Link></Button>
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-72 rounded-xl" />
      ) : (
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-6 max-w-2xl space-y-4">
            <h2 className="font-semibold">Meu perfil na rede</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="empresa">Empresa</Label>
                <Input id="empresa" value={form.empresa} onChange={(e) => setForm({ ...form, empresa: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cargo">O que você faz</Label>
                <Input id="cargo" value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="apresentacao">Apresentação</Label>
              <Textarea id="apresentacao" rows={4} value={form.apresentacao} onChange={(e) => setForm({ ...form, apresentacao: e.target.value })} />
            </div>
            <Button onClick={enviar} disabled={salvar.isPending}>
              {salvar.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold mb-3">Grupos</h2>
            {!data?.grupos.length ? (
              <p className="text-sm text-muted-foreground">Nenhum grupo disponível no momento.</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {data.grupos.map((g) => (
                  <li key={g.id} className="rounded-lg border border-border p-3">
                    <p className="text-sm font-medium">{g.nome}</p>
                    {g.descricao && <p className="text-xs text-muted-foreground">{g.descricao}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold mb-3">Indicações</h2>
            {!data?.indicacoes.length ? (
              <p className="text-sm text-muted-foreground">Você ainda não trocou indicações.</p>
            ) : (
              <ul className="divide-y divide-border">
                {data.indicacoes.map((i) => (
                  <li key={i.id} className="py-3 flex items-center justify-between gap-3">
                    <p className="text-sm">{i.descricao}</p>
                    <Badge variant="outline">{i.situacao}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </AreaLayout>
  );
}
