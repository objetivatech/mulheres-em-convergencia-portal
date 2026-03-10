import { ConectaLayout } from '@/components/conecta/ConectaLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Video, FileText, Link2, BookOpen, GraduationCap } from 'lucide-react';
import { useConectaContents } from '@/hooks/useConectaContents';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';

const typeConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  video: { icon: Video, label: 'Vídeo', color: 'bg-red-100 text-red-700' },
  document: { icon: FileText, label: 'Documento', color: 'bg-blue-100 text-blue-700' },
  article: { icon: BookOpen, label: 'Artigo', color: 'bg-green-100 text-green-700' },
  link: { icon: Link2, label: 'Link', color: 'bg-purple-100 text-purple-700' },
};

export default function ConectaConteudos() {
  const { contents, isLoading } = useConectaContents();

  return (
    <ConectaLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground">📚 Conteúdos</h1>

        {contents.length === 0 && !isLoading ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhum conteúdo disponível no momento.
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {contents.map((content: any) => {
              const type = typeConfig[content.content_type] || typeConfig.link;
              const Icon = type.icon;
              const isAcademy = content.source === 'academy';
              return (
                <Card key={content.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 space-y-3">
                    {content.thumbnail_url && (
                      <img src={content.thumbnail_url} alt={content.title} className="w-full h-36 object-cover rounded-md" />
                    )}
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={type.color}>
                        <Icon className="h-3 w-3 mr-1" />{type.label}
                      </Badge>
                      {isAcademy && (
                        <Badge variant="outline" className="gap-1 text-primary border-primary/30">
                          <GraduationCap className="h-3 w-3" />Academy
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(content.created_at), "dd MMM yyyy", { locale: ptBR })}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground leading-tight">{content.title}</h3>
                    {content.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{content.description}</p>
                    )}
                    {content.url && (
                      isAcademy ? (
                        <Button variant="outline" size="sm" className="gap-2 w-full" asChild>
                          <Link to={content.url}>
                            <GraduationCap className="h-4 w-4" /> Ver Aula
                          </Link>
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" className="gap-2 w-full" asChild>
                          <a href={content.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" /> Acessar
                          </a>
                        </Button>
                      )
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </ConectaLayout>
  );
}
