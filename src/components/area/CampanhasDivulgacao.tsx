import { Copy, Download, MessageCircle, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useCampanhas, linkComIndicacao, montarMensagem } from '@/hooks/useCampanhasEmbaixadoras';

/** Campanhas criadas pela equipe, com o link da embaixadora já incluído. */
export default function CampanhasDivulgacao({ codigo, nome }: { codigo?: string | null; nome?: string }) {
  const { data = [], isLoading } = useCampanhas();
  const { toast } = useToast();
  if (isLoading || !data.length) return null;

  const copiar = async (texto: string, titulo: string) => {
    await navigator.clipboard.writeText(texto);
    toast({ title: titulo, description: 'Agora é só colar onde quiser.' });
  };

  return (
    <section data-tour="embaixadora-campanhas" className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div>
        <h2 className="font-semibold">Campanhas da equipe</h2>
        <p className="text-sm text-muted-foreground">Mensagens e imagens prontas. Seu link de indicação já está dentro.</p>
      </div>
      <ul className="space-y-4">
        {data.map((c) => {
          const link = linkComIndicacao(c.link_url, codigo);
          const texto = montarMensagem(c.mensagem, link, nome);
          return (
            <li key={c.id} className="rounded-lg border border-border p-4 space-y-3">
              <div>
                <p className="font-medium">{c.titulo}</p>
                {c.descricao && <p className="text-sm text-muted-foreground">{c.descricao}</p>}
                {c.fim_em && <p className="text-xs text-muted-foreground">Até {new Date(c.fim_em).toLocaleDateString('pt-BR')}</p>}
              </div>
              <p className="whitespace-pre-line rounded-md bg-muted/50 p-3 text-sm">{texto}</p>
              {c.imagens?.length > 0 && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {c.imagens.map((url, i) => (
                    <a key={url + i} href={url} target="_blank" rel="noopener noreferrer" download className="group relative block">
                      <img src={url} alt={`Imagem ${i + 1} da campanha ${c.titulo}`} className="h-28 w-full rounded-md object-cover" />
                      <span className="absolute bottom-1 right-1 flex items-center gap-1 rounded bg-background/90 px-2 py-0.5 text-xs">
                        <Download className="h-3 w-3" /> Baixar
                      </span>
                    </a>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank')}>
                  <MessageCircle className="mr-2 h-4 w-4" /> Enviar no WhatsApp
                </Button>
                <Button size="sm" variant="outline" onClick={() => copiar(texto, 'Mensagem copiada')}>
                  <Copy className="mr-2 h-4 w-4" /> Copiar mensagem
                </Button>
                <Button size="sm" variant="outline" onClick={() => copiar(link, 'Link copiado')}>Copiar só o link</Button>
                {typeof navigator !== 'undefined' && 'share' in navigator && (
                  <Button size="sm" variant="ghost" onClick={() => navigator.share({ title: c.titulo, text: texto }).catch(() => {})}>
                    <Share2 className="mr-2 h-4 w-4" /> Compartilhar
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
