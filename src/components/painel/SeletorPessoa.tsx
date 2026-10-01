import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/** Busca uma pessoa cadastrada por nome, e-mail ou CPF (só equipe). */
export default function SeletorPessoa({
  value, onChange, placeholder = 'Buscar por nome, e-mail ou CPF',
}: { value: string | null; onChange: (id: string | null, nome?: string) => void; placeholder?: string }) {
  const [termo, setTermo] = useState('');
  const { data: atual } = useQuery({
    queryKey: ['painel', 'pessoa-nome', value],
    enabled: !!value,
    queryFn: async () => {
      const { data } = await supabase.from('pessoas').select('nome').eq('id', value!).maybeSingle();
      return (data as any)?.nome as string | undefined;
    },
  });
  const { data: lista } = useQuery({
    queryKey: ['painel', 'buscar-pessoas', termo],
    enabled: termo.trim().length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('buscar_pessoas', { _termo: termo.trim(), _limite: 8 });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  if (value) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
        <span className="flex-1 truncate">{atual ?? 'Pessoa vinculada'}</span>
        <Button size="sm" variant="ghost" onClick={() => onChange(null)} aria-label="Desvincular">
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <Input value={termo} placeholder={placeholder} onChange={(e) => setTermo(e.target.value)} />
      {(lista ?? []).map((p) => (
        <button
          key={p.pessoa_id}
          type="button"
          className="block w-full text-left text-sm rounded px-2 py-1.5 hover:bg-muted"
          onClick={() => { onChange(p.pessoa_id, p.nome); setTermo(''); }}
        >
          {p.nome} <span className="text-muted-foreground text-xs">{p.email}</span>
        </button>
      ))}
    </div>
  );
}
