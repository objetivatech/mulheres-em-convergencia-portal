import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Plus, Eye } from 'lucide-react';

export const PageBuilderLink = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Edit className="h-5 w-5" />
          <span>Page Builder</span>
        </CardTitle>
        <CardDescription>
          Construtor visual de páginas com componentes drag-and-drop
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Crie páginas personalizadas usando o editor visual com componentes 
            pré-configurados como hero sections, texto, botões, imagens e cards.
          </p>
          
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/admin/page-builder/new">
                <Plus className="w-4 h-4 mr-2" />
                Nova Página
              </Link>
            </Button>
            
            <Button variant="outline" asChild>
              <Link to="/admin/pages">
                <Eye className="w-4 h-4 mr-2" />
                Ver Páginas
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};