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
import CampoImagem from '@/components/imagens/CampoImagem';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ListaPaginas } from './PainelPaginas';
import { useSearchParams, Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';

/** Onde cada grupo do catálogo aparece no site, para o botão "Ver página". */
const LINK_GRUPO: Record<string, string> = {
  'Página inicial': '/', 'Diretório': '/diretorio', 'Blog Convergindo': '/convergindo', 'Encontros': '/eventos',
  'Planos': '/planos', 'Academy': '/academy', 'Embaixadoras': '/embaixadoras', 'Contato': '/contato',
  'Página da Elisângela': '/quem-e-elisangela-aranda', 'Nossa história (Sobre)': '/sobre', 'Manifesto': '/manifesto',
};

export default function PainelTextos() {
  const { data, isLoading } = useTextosSite();
  const salvar = useSalvarTexto();
  const [busca, setBusca] = useState('');
  const [rascunhos, setRascunhos] = useState<Record<string, string>>({});
  const [params, setParams] = useSearchParams();
  const aba = params.get('aba') === 'paginas' ? 'paginas' : 'secoes';
  const [pagina, setPagina] = useState('todas');
  const nomesGrupos = useMemo(() => Array.from(new Set(CATALOGO_TEXTOS.map((t) => t.grupo))), []);

  const grupos = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const lista = CATALOGO_TEXTOS.filter(
      (t) => (pagina === 'todas' || t.grupo === pagina) && (!termo || t.rotulo.toLowerCase().includes(termo) || t.grupo.toLowerCase().includes(termo) || t.padrao.toLowerCase().includes(termo))
    );
    return lista.reduce<Record<string, typeof CATALOGO_TEXTOS>>((acc, t) => {
      (acc[t.grupo] ||= []).push(t);
      return acc;
    }, {});
  }, [busca, pagina]);

  const valorDe = (chave: string, padrao: string) =>
    rascunhos[chave] ?? data?.mapa[chave] ?? padrao;

  return (
    <PainelLayout
      titulo="Editor de páginas"
      descricao="Tudo o que aparece nas páginas do site num só lugar. Em Seções das páginas ficam textos, fotos e botões de cada página; em Páginas de texto, as páginas de leitura como Nossa história e Termos de uso."
    >
      <Tabs value={aba} onValueChange={(v) => setParams(v === 'paginas' ? { aba: 'paginas' } : {})}>
        <TabsList className="mb-4">
          <TabsTrigger value="secoes">Seções das páginas</TabsTrigger>
          <TabsTrigger value="paginas">Páginas de texto</TabsTrigger>
        </TabsList>
        <TabsContent value="paginas"><ListaPaginas /></TabsContent>
        <TabsContent value="secoes">
      <div className="mb-6 flex flex-wrap gap-2">
        <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={pagina} onChange={(e) => setPagina(e.target.value)} aria-label="Escolher página">
          <option value="todas">Todas as páginas</option>
          {nomesGrupos.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      <div className="relative max-w-md flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar texto" value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>
      </div>

      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : (
        <div className="space-y-6">
          {Object.entries(grupos).map(([grupo, itens]) => (
            <Card key={grupo}>
              <CardHeader className="flex-row items-center justify-between space-y-0"><CardTitle className="text-base">{grupo}</CardTitle>
                {LINK_GRUPO[grupo] && <Link to={LINK_GRUPO[grupo]} target="_blank" className="inline-flex items-center gap-1 text-sm text-primary underline underline-offset-4"><ExternalLink className="h-3.5 w-3.5" /> Ver página</Link>}</CardHeader>
              <CardContent className="space-y-5">
                {itens.map((t) => {
                  const valor = valorDe(t.chave, t.padrao);
                  const alterado = valor !== (data?.mapa[t.chave] ?? t.padrao);
                  return (
                    <div key={t.chave} className="space-y-2">
                      <label className="text-sm font-medium">{t.rotulo}</label>
                      {t.tipo === 'imagem' ? (
                        <CampoImagem chave={t.chave} value={valor} onChange={(url) => setRascunhos((r) => ({ ...r, [t.chave]: url }))} pasta="site" alturaPrevia="h-40" />
                      ) : t.padrao.length > 60 ? (
                        <Textarea rows={3} value={valor} onChange={(e) => setRascunhos((r) => ({ ...r, [t.chave]: e.target.value }))} />
                      ) : (
                        <Input value={valor} placeholder={t.tipo === 'link' ? 'Ex.: /planos ou https://…' : undefined} onChange={(e) => setRascunhos((r) => ({ ...r, [t.chave]: e.target.value }))} />
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
        </TabsContent>
      </Tabs>
    </PainelLayout>
  );
}
