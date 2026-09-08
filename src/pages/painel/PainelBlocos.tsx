import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import PainelLayout from '@/components/painel/PainelLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { usePainelBlocos, useSalvarBloco } from '@/hooks/usePainelConteudo';

const NOMES: Record<string, string> = {
  home_hero: 'Abertura da página inicial',
  home_pilares: 'Os caminhos da rede',
};

function BlocoSimples({ bloco }: { bloco: any }) {
  const { toast } = useToast();
  const salvar = useSalvarBloco();
  const [conteudo, setConteudo] = useState(() => JSON.stringify(bloco.conteudo ?? {}, null, 2));
  const [ativo, setAtivo] = useState(!!bloco.ativo);
  const [erroJson, setErroJson] = useState<string | null>(null);

  useEffect(() => {
    setConteudo(JSON.stringify(bloco.conteudo ?? {}, null, 2));
    setAtivo(!!bloco.ativo);
  }, [bloco]);

  const simples = bloco.conteudo && typeof bloco.conteudo === 'object' && !Array.isArray(bloco.conteudo)
    ? Object.entries(bloco.conteudo).filter(([, v]) => typeof v === 'string')
    : [];

  const gravarCampos = async (valores: Record<string, any>) => {
    try {
      await salvar.mutateAsync({ id: bloco.id, valores });
      toast({ title: 'Conteúdo salvo' });
    } catch (e: any) {
      toast({ title: 'Não foi possível salvar', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{NOMES[bloco.chave] ?? bloco.chave}</CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Mostrar no site</span>
          <Switch
            checked={ativo}
            onCheckedChange={(v) => { setAtivo(v); gravarCampos({ ativo: v }); }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {simples.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {simples.map(([chave, valor]) => (
              <div key={chave} className={String(valor).length > 60 ? 'sm:col-span-2' : ''}>
                <Label className="capitalize">{chave.replace(/_/g, ' ')}</Label>
                {String(valor).length > 60 ? (
                  <Textarea
                    rows={3}
                    defaultValue={String(valor)}
                    onBlur={(e) =>
                      gravarCampos({ conteudo: { ...bloco.conteudo, [chave]: e.target.value } })
                    }
                  />
                ) : (
                  <Input
                    defaultValue={String(valor)}
                    onBlur={(e) =>
                      gravarCampos({ conteudo: { ...bloco.conteudo, [chave]: e.target.value } })
                    }
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground">
            Edição avançada (para quem conhece o formato)
          </summary>
          <Textarea
            rows={12}
            className="font-mono text-xs mt-2"
            value={conteudo}
            onChange={(e) => { setConteudo(e.target.value); setErroJson(null); }}
          />
          {erroJson && <p className="text-destructive text-xs mt-1">{erroJson}</p>}
          <Button
            size="sm"
            className="mt-2"
            onClick={() => {
              try {
                const parsed = JSON.parse(conteudo);
                gravarCampos({ conteudo: parsed });
              } catch {
                setErroJson('O formato está inválido. Confira vírgulas e aspas.');
              }
            }}
          >
            <Save className="w-4 h-4 mr-2" /> Salvar bloco
          </Button>
        </details>
      </CardContent>
    </Card>
  );
}

export default function PainelBlocos() {
  const { data, isLoading } = usePainelBlocos();

  return (
    <PainelLayout
      titulo="Página inicial"
      descricao="Frase de abertura, botões e os caminhos da rede."
    >
      {isLoading ? (
        <div className="space-y-4">{[0, 1].map((i) => <Skeleton key={i} className="h-48 w-full" />)}</div>
      ) : (
        <div className="space-y-6">
          {(data ?? []).map((b) => <BlocoSimples key={b.id} bloco={b} />)}
        </div>
      )}
    </PainelLayout>
  );
}
