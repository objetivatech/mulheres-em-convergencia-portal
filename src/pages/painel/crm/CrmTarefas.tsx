import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import CrmLayout from '@/components/crm/CrmLayout';
import TarefaItem from '@/components/crm/TarefaItem';
import TarefaDialog from '@/components/crm/TarefaDialog';
import WhatsAppDialog from '@/components/crm/WhatsAppDialog';
import BarraLista from '@/components/painel/BarraLista';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAtividades } from '@/hooks/useCrmMec';
import { TIPOS_ATIVIDADE, crmTexto } from './crmTexto';
import { situacaoTarefa } from '@/lib/crm';

const FILTROS = [{ v: 'todos', r: 'Todos os tipos' }, ...TIPOS_ATIVIDADE];
const ORDENS = [
  { v: 'abertas', r: 'Abertas (por data)' },
  { v: 'feitas', r: 'Concluídas e canceladas' },
];

export default function CrmTarefas() {
  const [ordem, setOrdem] = useState('abertas');
  const [filtro, setFiltro] = useState('todos');
  const [busca, setBusca] = useState('');
  const [nova, setNova] = useState(false);
  const [editar, setEditar] = useState<any>(null);
  const [wa, setWa] = useState<{ p: string; op?: string | null } | null>(null);
  const { data, isLoading } = useAtividades({ abertas: ordem === 'abertas' });

  const grupos = useMemo(() => {
    const b = crmTexto(busca);
    const l = (data ?? []).filter((t) =>
      (filtro === 'todos' || t.tipo === filtro) &&
      (!b || crmTexto(`${t.titulo} ${t.pessoa?.nome ?? ''} ${t.pessoa?.nome_social ?? ''}`).includes(b)));
    if (ordem !== 'abertas') return [{ titulo: 'Concluídas e canceladas', itens: l }];
    return [
      { titulo: 'Atrasadas', itens: l.filter((t) => situacaoTarefa(t) === 'atrasada') },
      { titulo: 'Hoje', itens: l.filter((t) => situacaoTarefa(t) === 'hoje') },
      { titulo: 'Próximas', itens: l.filter((t) => situacaoTarefa(t) === 'futura') },
    ];
  }, [data, filtro, busca, ordem]);

  return (
    <CrmLayout
      titulo="CRM · Tarefas"
      descricao="Retornos, relacionamentos e ativações. Concluir uma tarefa registra no histórico da pessoa."
      acoes={<Button size="sm" onClick={() => setNova(true)}><Plus className="mr-1 h-4 w-4" /> Nova tarefa</Button>}
    >
      <BarraLista busca={busca} onBusca={setBusca} placeholder="Buscar tarefa ou pessoa" filtro={filtro} onFiltro={setFiltro} filtros={FILTROS} ordem={ordem} onOrdem={setOrdem} ordens={ORDENS} />
      {isLoading ? <Skeleton className="h-72 rounded-xl" /> : (
        <div className="space-y-6">
          {grupos.map((g) => (
            <section key={g.titulo}>
              <h2 className="mb-2 text-sm font-bold">{g.titulo} <span className="font-normal text-muted-foreground">({g.itens.length})</span></h2>
              {!g.itens.length ? <p className="text-sm text-muted-foreground">Nenhuma.</p> : (
                <ul className="space-y-2">
                  {g.itens.map((t) => <TarefaItem key={t.id} t={t} onWhatsApp={(p, op) => setWa({ p, op })} onEditar={setEditar} />)}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
      <TarefaDialog aberto={nova || !!editar} tarefa={editar} onFechar={() => { setNova(false); setEditar(null); }} />
      <WhatsAppDialog pessoaId={wa?.p ?? null} oportunidadeId={wa?.op} aberto={!!wa} onFechar={() => setWa(null)} />
    </CrmLayout>
  );
}
