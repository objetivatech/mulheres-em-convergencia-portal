import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Linha = {
  pessoa_id: string | null; nome: string; cpf: string | null; email: string | null; telefone: string | null;
  total_eventos: number; eventos_gratuitos: number; ultimo_evento: string; ultima_participacao: string; assinante: boolean;
};

export default function ParticipantesEventos() {
  const [busca, setBusca] = useState('');
  const [soNaoAssinantes, setSoNaoAssinantes] = useState(true);
  const { data, isLoading } = useQuery({
    queryKey: ['painel', 'participantes-eventos'],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)('participantes_eventos');
      if (error) throw error;
      return (data ?? []) as Linha[];
    },
  });

  const lista = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return (data ?? []).filter((l) =>
      (!soNaoAssinantes || !l.assinante) &&
      (!t || [l.nome, l.email, l.cpf].some((v) => v?.toLowerCase().includes(t))));
  }, [data, busca, soNaoAssinantes]);

  const exportar = () => {
    const cab = 'Nome;CPF;E-mail;Telefone;Encontros;Gratuitos;Último encontro;Data;Assinante';
    const linhas = lista.map((l) => [l.nome, l.cpf ?? '', l.email ?? '', l.telefone ?? '', l.total_eventos,
      l.eventos_gratuitos, l.ultimo_evento, new Date(l.ultima_participacao).toLocaleDateString('pt-BR'),
      l.assinante ? 'Sim' : 'Não'].join(';'));
    const blob = new Blob(['\ufeff' + [cab, ...linhas].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'participantes-encontros.csv'; a.click();
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Todas as pessoas que já participaram de algum encontro. Quem ainda não assina já usou o encontro
        gratuito e é uma ótima pessoa para convidar a assinar.
      </p>
      <div className="flex flex-wrap gap-2 items-center">
        <Input className="max-w-xs" placeholder="Buscar por nome, e-mail ou CPF" value={busca} onChange={(e) => setBusca(e.target.value)} />
        <Button variant={soNaoAssinantes ? 'default' : 'outline'} size="sm" onClick={() => setSoNaoAssinantes((v) => !v)}>
          {soNaoAssinantes ? 'Mostrando: só quem não assina' : 'Mostrando: todas'}
        </Button>
        <Button variant="outline" size="sm" onClick={exportar} disabled={!lista.length}>Baixar planilha</Button>
        <span className="text-sm text-muted-foreground">{lista.length} pessoa(s)</span>
      </div>
      {isLoading ? <p className="text-sm text-muted-foreground">Carregando…</p> : !lista.length ? (
        <p className="text-sm text-muted-foreground">Ninguém por aqui ainda.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr><th className="p-2">Pessoa</th><th className="p-2">Contato</th><th className="p-2">Encontros</th><th className="p-2">Último</th><th className="p-2">Situação</th></tr>
            </thead>
            <tbody>
              {lista.map((l, i) => (
                <tr key={l.pessoa_id ?? i} className="border-t">
                  <td className="p-2"><div className="font-medium">{l.nome}</div><div className="text-xs text-muted-foreground">{l.cpf ?? 'sem CPF'}</div></td>
                  <td className="p-2"><div>{l.email}</div><div className="text-xs text-muted-foreground">{l.telefone}</div></td>
                  <td className="p-2">{l.total_eventos} <span className="text-xs text-muted-foreground">({l.eventos_gratuitos} grátis)</span></td>
                  <td className="p-2"><div>{l.ultimo_evento}</div><div className="text-xs text-muted-foreground">{new Date(l.ultima_participacao).toLocaleDateString('pt-BR')}</div></td>
                  <td className="p-2">{l.assinante ? <Badge>Assinante</Badge> : <Badge variant="secondary">Degustação usada</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
