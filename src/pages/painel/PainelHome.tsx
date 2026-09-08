import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PainelLayout from '@/components/painel/PainelLayout';
import { usePainelNegocios, usePainelPosts, usePainelPaginas } from '@/hooks/usePainelConteudo';

export default function PainelHome() {
  const { data: negocios } = usePainelNegocios();
  const { data: posts } = usePainelPosts();
  const { data: paginas } = usePainelPaginas();

  const cartoes = [
    {
      titulo: 'Negócios',
      total: negocios?.length ?? 0,
      detalhe: `${(negocios ?? []).filter((n) => n.publicado).length} aparecendo no diretório`,
      link: '/painel-conteudo/negocios',
    },
    {
      titulo: 'Textos do blog',
      total: posts?.length ?? 0,
      detalhe: `${(posts ?? []).filter((p) => p.situacao === 'publicado').length} publicados`,
      link: '/painel-conteudo/blog',
    },
    {
      titulo: 'Páginas',
      total: paginas?.length ?? 0,
      detalhe: `${(paginas ?? []).filter((p) => p.situacao === 'publicado').length} publicadas`,
      link: '/painel-conteudo/paginas',
    },
  ];

  return (
    <PainelLayout
      titulo="Conteúdo do site"
      descricao="Aqui a equipe cadastra negócios, escreve no blog e edita as páginas."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {cartoes.map((c) => (
          <Link key={c.titulo} to={c.link}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium text-muted-foreground">
                  {c.titulo}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{c.total}</p>
                <p className="text-sm text-muted-foreground mt-1">{c.detalhe}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Por onde começar</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong className="text-foreground">Negócios</strong> — cadastre a ficha, os contatos e
            as fotos. O negócio só aparece no diretório quando estiver marcado como publicado e a
            associada tiver acesso ao diretório em dia.
          </p>
          <p>
            <strong className="text-foreground">Blog</strong> — escreva o texto, escolha a autora e
            as categorias, e publique quando estiver pronto.
          </p>
          <p>
            <strong className="text-foreground">Página inicial</strong> — muda a frase de abertura,
            o botão principal e os quatro caminhos da rede.
          </p>
        </CardContent>
      </Card>
    </PainelLayout>
  );
}
