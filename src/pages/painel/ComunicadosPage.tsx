import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, RefreshCw, Users, Mail } from 'lucide-react';
import PainelLayout from '@/components/painel/PainelLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

const CHAVE = 'reboot-boas-vindas';

type Campanha = {
  id: string;
  chave: string;
  assunto: string;
  titulo: string;
  corpo: string;
  cta_rotulo: string;
  situacao: string;
  disparado_em: string | null;
};

export default function ComunicadosPage() {
  const qc = useQueryClient();
  const [emailTeste, setEmailTeste] = useState('');
  const [rascunho, setRascunho] = useState<Partial<Campanha>>({});

  const { data: campanha } = useQuery({
    queryKey: ['campanha', CHAVE],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campanhas_email' as never)
        .select('*')
        .eq('chave', CHAVE)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Campanha;
    },
  });

  const { data: situacao, refetch: recarregarSituacao } = useQuery({
    queryKey: ['campanha-situacao', CHAVE],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('notificar-usuarias', {
        body: { acao: 'situacao', chave: CHAVE },
      });
      if (error) throw error;
      return data as { total: number; enviados: number; erros: number; pendentes: number };
    },
  });

  const valor = (campo: keyof Campanha) =>
    (rascunho[campo] as string) ?? (campanha?.[campo] as string) ?? '';

  const salvar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('campanhas_email' as never)
        .update(rascunho as never)
        .eq('chave', CHAVE);
      if (error) throw error;
    },
    onSuccess: () => {
      setRascunho({});
      qc.invalidateQueries({ queryKey: ['campanha', CHAVE] });
      toast({ title: 'Texto salvo' });
    },
    onError: (e: Error) => toast({ title: 'Não deu para salvar', description: e.message, variant: 'destructive' }),
  });

  const acao = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data, error } = await supabase.functions.invoke('notificar-usuarias', {
        body: { chave: CHAVE, site: window.location.origin, ...body },
      });
      if (error) throw error;
      return data as Record<string, unknown>;
    },
    onSuccess: (data) => {
      recarregarSituacao();
      toast({ title: 'Pronto', description: JSON.stringify(data) });
    },
    onError: (e: Error) => toast({ title: 'Falhou', description: e.message, variant: 'destructive' }),
  });

  return (
    <PainelLayout
      titulo="Comunicados"
      descricao="Envio em massa para todas as usuárias. Nada sai daqui sem você clicar em enviar."
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Mensagem de relançamento</CardTitle>
            <CardDescription>
              Cada pessoa recebe um botão para criar a nova senha, válido por 24 horas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Assunto do e-mail</Label>
              <Input
                value={valor('assunto')}
                onChange={(e) => setRascunho((r) => ({ ...r, assunto: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Título dentro do e-mail</Label>
              <Input
                value={valor('titulo')}
                onChange={(e) => setRascunho((r) => ({ ...r, titulo: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Texto</Label>
              <Textarea
                rows={7}
                value={valor('corpo')}
                onChange={(e) => setRascunho((r) => ({ ...r, corpo: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Texto do botão</Label>
              <Input
                value={valor('cta_rotulo')}
                onChange={(e) => setRascunho((r) => ({ ...r, cta_rotulo: e.target.value }))}
              />
            </div>
            <Button onClick={() => salvar.mutate()} disabled={!Object.keys(rascunho).length || salvar.isPending}>
              Salvar texto
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="w-4 h-4" /> Situação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>Na lista: <strong>{situacao?.total ?? 0}</strong></p>
              <p>Já receberam: <strong>{situacao?.enviados ?? 0}</strong></p>
              <p>Aguardando: <strong>{situacao?.pendentes ?? 0}</strong></p>
              <p>Com erro: <strong>{situacao?.erros ?? 0}</strong></p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => recarregarSituacao()}>
                <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="w-4 h-4" /> Testar antes
              </CardTitle>
              <CardDescription>Envia só para o endereço abaixo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                type="email"
                placeholder="seu@email.com"
                value={emailTeste}
                onChange={(e) => setEmailTeste(e.target.value)}
              />
              <Button
                variant="secondary"
                className="w-full"
                disabled={!emailTeste || acao.isPending}
                onClick={() => acao.mutate({ acao: 'teste', email: emailTeste })}
              >
                Enviar teste
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Send className="w-4 h-4" /> Disparar
              </CardTitle>
              <CardDescription>
                Atualize a lista e envie por lotes de 100. Repita até não sobrar ninguém aguardando.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                disabled={acao.isPending}
                onClick={() => acao.mutate({ acao: 'preparar' })}
              >
                Atualizar lista de destinatárias
              </Button>
              <Button
                className="w-full"
                disabled={acao.isPending || !situacao?.pendentes}
                onClick={() => {
                  if (window.confirm('Enviar agora para até 100 pessoas?')) {
                    acao.mutate({ acao: 'disparar', limite: 100 });
                  }
                }}
              >
                Enviar próximo lote
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PainelLayout>
  );
}
