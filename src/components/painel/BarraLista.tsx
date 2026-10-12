/** Barra padrão de busca, ordenação e filtro para as listagens do painel. */
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Opcao = { v: string; r: string };
type Props = {
  busca: string; onBusca: (v: string) => void;
  ordem?: string; onOrdem?: (v: string) => void; ordens?: Opcao[];
  filtro?: string; onFiltro?: (v: string) => void; filtros?: Opcao[];
  placeholder?: string;
};

export default function BarraLista({ busca, onBusca, ordem, onOrdem, ordens, filtro, onFiltro, filtros, placeholder = 'Buscar' }: Props) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <div className="relative min-w-[200px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder={placeholder} value={busca} onChange={(e) => onBusca(e.target.value)} />
      </div>
      {ordens && onOrdem && (
        <Select value={ordem} onValueChange={onOrdem}>
          <SelectTrigger className="w-[220px]" aria-label="Ordenar"><SelectValue placeholder="Ordenar" /></SelectTrigger>
          <SelectContent>{ordens.map((o) => <SelectItem key={o.v} value={o.v}>{o.r}</SelectItem>)}</SelectContent>
        </Select>
      )}
      {filtros && onFiltro && (
        <Select value={filtro} onValueChange={onFiltro}>
          <SelectTrigger className="w-[180px]" aria-label="Filtrar"><SelectValue placeholder="Filtrar" /></SelectTrigger>
          <SelectContent>{filtros.map((o) => <SelectItem key={o.v} value={o.v}>{o.r}</SelectItem>)}</SelectContent>
        </Select>
      )}
    </div>
  );
}
