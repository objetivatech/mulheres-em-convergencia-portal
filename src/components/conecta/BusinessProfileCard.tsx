import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ExternalLink, Store } from 'lucide-react';

interface BusinessProfileCardProps {
  userId: string;
}

export default function BusinessProfileCard({ userId }: BusinessProfileCardProps) {
  const { data: business, isLoading } = useQuery({
    queryKey: ['conecta-user-business', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name, slug, logo_url, category, description, phone, whatsapp, email, instagram')
        .eq('owner_id', userId)
        .eq('subscription_active', true)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  if (isLoading || !business) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Store className="w-5 h-5 text-primary" />
          Meu Negócio
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Link
          to={`/guia/${business.slug}`}
          className="flex items-start gap-4 p-4 rounded-lg border bg-muted/30 hover:bg-accent/50 transition-colors group"
        >
          <Avatar className="h-14 w-14 rounded-lg">
            <AvatarImage src={business.logo_url || undefined} alt={business.name} className="object-cover" />
            <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold">
              {business.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                {business.name}
              </h3>
              <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
            </div>
            <p className="text-sm text-muted-foreground capitalize">{business.category?.replace(/_/g, ' ')}</p>
            {business.description && (
              <p className="text-sm text-foreground/70 mt-1 line-clamp-2">{business.description}</p>
            )}
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}
