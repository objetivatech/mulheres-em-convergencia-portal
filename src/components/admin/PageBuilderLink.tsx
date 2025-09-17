import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Wand2 } from 'lucide-react';

export const PageBuilderLink: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Wand2 className="h-5 w-5" />
          <span>Editor de Páginas</span>
        </CardTitle>
        <CardDescription>
          Crie e gerencie páginas personalizadas com editor visual
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">🚧 <strong>Em breve:</strong></p>
            <ul className="space-y-1 text-xs ml-4">
              <li>• Editor visual drag-and-drop</li>
              <li>• Componentes pré-configurados</li>
              <li>• Templates responsivos</li>
              <li>• Integração com identidade visual</li>
            </ul>
          </div>
          <Button disabled className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Criar Nova Página (Em breve)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};