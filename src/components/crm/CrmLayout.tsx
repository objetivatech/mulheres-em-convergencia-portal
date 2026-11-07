import { ReactNode, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { CalendarCheck, Users, Workflow, ListTodo, MessageSquareText, Search, Radar, CopyCheck, FileSpreadsheet } from 'lucide-react';
import PainelLayout from '@/components/painel/PainelLayout';
import { Input } from '@/components/ui/input';
import { useSouEditora } from '@/hooks/usePainelConteudo';
import { cn } from '@/lib/utils';

const BASE = '/painel-conteudo/relacionamento';
export const rotaCrm = {
  hoje: BASE,
  pessoas: `${BASE}/pessoas`,
  ficha: (id: string) => `${BASE}/pessoa/${id}`,
  funil: `${BASE}/funil`,
  tarefas: `${BASE}/tarefas`,
  mensagens: `${BASE}/mensagens`,
  radar: `${BASE}/radar`,
  repetidas: `${BASE}/repetidas`,
  importar: `${BASE}/importar`,
};

const ABAS = [
  { para: rotaCrm.hoje, rotulo: 'Hoje', icone: CalendarCheck, fim: true },
  { para: rotaCrm.pessoas, rotulo: 'Pessoas', icone: Users },
  { para: rotaCrm.funil, rotulo: 'Funil', icone: Workflow },
  { para: rotaCrm.tarefas, rotulo: 'Tarefas', icone: ListTodo },
  { para: rotaCrm.radar, rotulo: 'Radar pós-encontro', icone: Radar },
  { para: rotaCrm.repetidas, rotulo: 'Fichas repetidas', icone: CopyCheck },
  { para: rotaCrm.importar, rotulo: 'Importar planilha', icone: FileSpreadsheet },
  { para: rotaCrm.mensagens, rotulo: 'Mensagens prontas', icone: MessageSquareText },
];

/** Moldura do CRM: só administração, abas internas e busca rápida sempre à mão. */
export default function CrmLayout({
  titulo, descricao, acoes, children,
}: { titulo: string; descricao?: string; acoes?: ReactNode; children: ReactNode }) {
  const { data: permissao } = useSouEditora();
  const navegar = useNavigate();
  const [busca, setBusca] = useState('');

  return (
    <PainelLayout titulo={titulo} descricao={descricao} acoes={acoes} tour="crm">
      {permissao && !permissao.admin ? (
        <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          O CRM é exclusivo da administração. Fale com a coordenação se precisar acompanhar algum contato.
        </p>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-3" data-tour="crm-abas">
            <nav className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1">
              {ABAS.map((a) => (
                <NavLink
                  key={a.para}
                  to={a.para}
                  end={a.fim}
                  className={({ isActive }) => cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive ? 'bg-grad-marca text-primary-foreground font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <a.icone className="h-4 w-4" /> {a.rotulo}
                </NavLink>
              ))}
            </nav>
            <form
              className="relative ml-auto min-w-[220px] flex-1 sm:max-w-xs"
              onSubmit={(e) => { e.preventDefault(); navegar(`${rotaCrm.pessoas}?q=${encodeURIComponent(busca.trim())}`); }}
              data-tour="crm-busca"
            >
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar pessoa, apelido, telefone…"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                aria-label="Busca rápida de pessoas"
              />
            </form>
          </div>
          {children}
        </>
      )}
    </PainelLayout>
  );
}
