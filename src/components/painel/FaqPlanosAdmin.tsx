import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

type Faq = { id: string; pergunta: string; resposta: string; ordem: number; ativo: boolean };
const db = supabase as any;

/** Perguntas frequentes da página pública de planos. */
export default function FaqPlanosAdmin() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: itens = [] } = useQuery({
    queryKey: ['painel', 'faq-planos'],
    queryFn: async () => {
      const { data, error } = await db.from('faq_planos').select('*').order('ordem');
      if (error) throw error;
      return data as Faq[];
    },
  });
  const [edicao, setEdicao] = useState<Record<string, Partial<Faq>>>({});

  const recarregar = () => {
    qc.invalidateQueries({ queryKey: ['painel', 'faq-planos'] });
    qc.invalidateQueries({ queryKey: ['faq-planos'] });
  };
  const erro = (e: any) => toast({ title: 'Não foi possível salvar', description: e.message, variant: 'destructive' });

  const novo = async () => {
    const { error } = await db.from('faq_planos').insert({
      pergunta: 'Nova pergunta', resposta: 'Escreva a resposta aqui.', ordem: (itens[itens.length - 1]?.ordem ?? 0) + 1,
    });
    error ? erro(error) : recarregar();
  };
  const salvar = async (f: Faq) => {
    const { error } = await db.from('faq_planos').update({ ...f, ...edicao[f.id] }).eq('id', f.id);
    if (error) return erro(error);
    setEdicao((e) => { const n = { ...e }; delete n[f.id]; return n; });
    toast({ title: 'Pergunta salva' });
    recarregar();
  };
  const apagar = async (id: string) => {
    const { error } = await db.from('faq_planos').delete().eq('id', id);
    error ? erro(error) : recarregar();
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Estas perguntas aparecem no fim da página de planos. Desligue a chave para esconder sem apagar.
      </p>
      <Button onClick={novo}><Plus className="mr-2 h-4 w-4" /> Nova pergunta</Button>
      {itens.map((f) => {
        const v = { ...f, ...edicao[f.id] };
        const muda = (k: keyof Faq, val: any) => setEdicao((e) => ({ ...e, [f.id]: { ...e[f.id], [k]: val } }));
        return (
          <div key={f.id} className="space-y-2 rounded-lg border border-border bg-card p-4">
            <div className="flex gap-2">
              <Input type="number" className="w-20" value={v.ordem} onChange={(e) => muda('ordem', Number(e.target.value))} />
              <Input value={v.pergunta} onChange={(e) => muda('pergunta', e.target.value)} />
            </div>
            <Textarea rows={3} value={v.resposta} onChange={(e) => muda('resposta', e.target.value)} />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={v.ativo} onCheckedChange={(x) => muda('ativo', x)} /> Visível no site
              </label>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => apagar(f.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                <Button size="sm" onClick={() => salvar(f)} disabled={!edicao[f.id]}><Save className="mr-2 h-4 w-4" />Salvar</Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
