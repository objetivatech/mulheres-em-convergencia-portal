/**
 * Painel da equipe — todos os textos fixos do site em um só lugar.
 */
import { useMemo, useState } from 'react';
import { Loader2, Search, RotateCcw } from 'lucide-react';
import PainelLayout from '@/components/painel/PainelLayout';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CATALOGO_TEXTOS } from '@/lib/textosCatalogo';
import { useSalvarTexto, useTextosSite } from '@/hooks/useTextosSite';
import { toast } from '@/hooks/use-toast';

export default function PainelTextos() {
  const { data, isLoading } = useTextosSite();
  const salvar = useSalvarTexto();
  const [busca, setBusca] = useState('');
  const [rascunhos, setRascunhos] = useState<Record<string, string>>({});

  const grupos = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const lista = CATALOGO_TEXTOS.filter(
      (t) => !termo || t.rotulo.toLowerCase().includes(termo) || t.grupo.toLowerCase().includes(termo) || t.padrao.toLowerCase().includes(termo)
    );
    return lista.reduce<Record<string, typeof CATALOGO_TEXTOS>>((acc, t) => {
      (acc[t.grupo] ||= []).push(t);
      return acc;
    }, {});
  }, [busca]);

  const valorDe = (chave: string, padrao: string) =>
    rascunhos[chave] ?? data?.mapa[chave] ?? padrao;

  return (
    <PainelLayout
      titulo="Textos do site"
      descricao="Edite aqui qualquer texto fixo das páginas públicas. Também dá para editar direto na página, pelo lápis."
    >
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar texto" value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : (
        <div className="space-y-6">
          {Object.entries(grupos).map(([grupo, itens]) => (
            <Card key={grupo}>
              <CardHeader><CardTitle className="text-base">{grupo}</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                {itens.map((t) => {
                  const valor = valorDe(t.chave, t.padrao);
                  const alterado = valor !== (data?.mapa[t.chave] ?? t.padrao);
                  return (
                    <div key={t.chave} className="space-y-2">
                      <label className="text-sm font-medium">{t.rotulo}</label>
                      {t.padrao.length > 60 ? (
                        <Textarea rows={3} value={valor} onChange={(e) => setRascunhos((r) => ({ ...r, [t.chave]: e.target.value }))} />
                      ) : (
                        <Input value={valor} onChange={(e) => setRascunhos((r) => ({ ...r, [t.chave]: e.target.value }))} />
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={!alterado || salvar.isPending}
                          onClick={() =>
                            salvar.mutate(
                              { chave: t.chave, valor },
                              {
                                onSuccess: () => {
                                  setRascunhos((r) => { const n = { ...r }; delete n[t.chave]; return n; });
                                  toast({ title: 'Texto atualizado' });
                                },
                                onError: () => toast({ title: 'Não foi possível salvar', variant: 'destructive' }),
                              }
                            )
                          }
                        >
                          Salvar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            salvar.mutate(
                              { chave: t.chave, valor: t.padrao },
                              {
                                onSuccess: () => {
                                  setRascunhos((r) => { const n = { ...r }; delete n[t.chave]; return n; });
                                  toast({ title: 'Texto original restaurado' });
                                },
                              }
                            )
                          }
                        >
                          <RotateCcw className="mr-2 h-3.5 w-3.5" /> Restaurar original
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PainelLayout>
  );
}
