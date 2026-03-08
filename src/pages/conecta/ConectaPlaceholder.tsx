import { Helmet } from 'react-helmet-async';
import { ConectaLayout } from '@/components/conecta/ConectaLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Construction } from 'lucide-react';

interface ConectaPlaceholderProps {
  title: string;
  description?: string;
  requireMember?: boolean;
}

export default function ConectaPlaceholder({ title, description, requireMember = false }: ConectaPlaceholderProps) {
  return (
    <ConectaLayout requireMember={requireMember}>
      <Helmet>
        <title>{title} | CONECTA+</title>
      </Helmet>
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center text-center p-8 gap-4">
            <Construction className="h-12 w-12 text-muted-foreground" />
            <h1 className="text-xl font-bold text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground">
              {description || 'Esta seção está sendo construída. Em breve estará disponível!'}
            </p>
          </CardContent>
        </Card>
      </div>
    </ConectaLayout>
  );
}
