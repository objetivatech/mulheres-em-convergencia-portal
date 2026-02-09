import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Eye, EyeOff, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';

interface AmbassadorPublicSettings {
  id: string;
  referral_code: string;
  tier: string;
  show_on_public_page: boolean;
  display_order: number;
  profile: {
    full_name: string;
    avatar_url: string | null;
    city: string | null;
    state: string | null;
  };
}

export function AdminPublicPageManager() {
  const queryClient = useQueryClient();
  
  const { data: ambassadors, isLoading } = useQuery({
    queryKey: ['admin-ambassadors-public'],
    queryFn: async (): Promise<AmbassadorPublicSettings[]> => {
      const { data, error } = await supabase
        .from('ambassadors')
        .select(`
          id,
          referral_code,
          tier,
          show_on_public_page,
          display_order,
          profiles:user_id (
            full_name,
            avatar_url,
            city,
            state
          )
        `)
        .eq('active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      return (data || []).map((a: any) => ({
        ...a,
        profile: a.profiles || { full_name: 'Sem nome', avatar_url: null, city: null, state: null },
      }));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, show_on_public_page, display_order }: { 
      id: string; 
      show_on_public_page?: boolean; 
      display_order?: number;
    }) => {
      const updates: any = {};
      if (show_on_public_page !== undefined) updates.show_on_public_page = show_on_public_page;
      if (display_order !== undefined) updates.display_order = display_order;
      
      const { error } = await supabase
        .from('ambassadors')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ambassadors-public'] });
      queryClient.invalidateQueries({ queryKey: ['public-ambassadors'] });
    },
    onError: (error) => {
      console.error('Error updating ambassador:', error);
      toast.error('Erro ao atualizar configurações');
    },
  });

  const handleToggleVisibility = (id: string, currentValue: boolean) => {
    updateMutation.mutate({ id, show_on_public_page: !currentValue });
    toast.success(!currentValue ? 'Embaixadora visível na página pública' : 'Embaixadora oculta da página pública');
  };

  const handleOrderChange = (id: string, newOrder: number) => {
    updateMutation.mutate({ id, display_order: newOrder });
  };

  const moveUp = (ambassador: AmbassadorPublicSettings) => {
    if (!ambassadors) return;
    const currentIndex = ambassadors.findIndex(a => a.id === ambassador.id);
    if (currentIndex <= 0) return;
    
    const prevAmbassador = ambassadors[currentIndex - 1];
    updateMutation.mutate({ id: ambassador.id, display_order: prevAmbassador.display_order });
    updateMutation.mutate({ id: prevAmbassador.id, display_order: ambassador.display_order });
  };

  const moveDown = (ambassador: AmbassadorPublicSettings) => {
    if (!ambassadors) return;
    const currentIndex = ambassadors.findIndex(a => a.id === ambassador.id);
    if (currentIndex >= ambassadors.length - 1) return;
    
    const nextAmbassador = ambassadors[currentIndex + 1];
    updateMutation.mutate({ id: ambassador.id, display_order: nextAmbassador.display_order });
    updateMutation.mutate({ id: nextAmbassador.id, display_order: ambassador.display_order });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const tierConfig: Record<string, { label: string; color: string }> = {
    bronze: { label: 'Bronze', color: 'bg-amber-700 text-white' },
    silver: { label: 'Prata', color: 'bg-gray-400 text-gray-900' },
    gold: { label: 'Ouro', color: 'bg-yellow-500 text-yellow-900' },
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-20 ml-auto" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const visibleCount = ambassadors?.filter(a => a.show_on_public_page).length || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Página Pública de Embaixadoras
            </CardTitle>
            <CardDescription>
              Gerencie quais embaixadoras aparecem na página pública e sua ordem de exibição
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline">
              {visibleCount} visíveis de {ambassadors?.length || 0}
            </Badge>
            <Button variant="outline" size="sm" asChild>
              <a href="/embaixadoras" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver Página
              </a>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {ambassadors?.map((ambassador, index) => {
            const tierInfo = tierConfig[ambassador.tier] || tierConfig.bronze;
            const location = [ambassador.profile.city, ambassador.profile.state].filter(Boolean).join(', ');
            
            return (
              <div 
                key={ambassador.id}
                className={`flex items-center gap-4 p-4 border rounded-lg transition-colors ${
                  ambassador.show_on_public_page ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'
                }`}
              >
                {/* Order Controls */}
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => moveUp(ambassador)}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => moveDown(ambassador)}
                    disabled={index === (ambassadors?.length || 0) - 1}
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>

                {/* Avatar */}
                <Avatar className="h-12 w-12">
                  <AvatarImage src={ambassador.profile.avatar_url || undefined} />
                  <AvatarFallback>{getInitials(ambassador.profile.full_name)}</AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{ambassador.profile.full_name}</p>
                    <Badge className={`${tierInfo.color} text-xs`}>{tierInfo.label}</Badge>
                  </div>
                  {location && (
                    <p className="text-sm text-muted-foreground truncate">{location}</p>
                  )}
                </div>

                {/* Order Number */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Ordem:</span>
                  <Input
                    type="number"
                    value={ambassador.display_order}
                    onChange={(e) => handleOrderChange(ambassador.id, parseInt(e.target.value) || 0)}
                    className="w-16 h-8 text-center"
                  />
                </div>

                {/* Visibility Toggle */}
                <div className="flex items-center gap-2">
                  {ambassador.show_on_public_page ? (
                    <Eye className="h-4 w-4 text-primary" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Switch
                    checked={ambassador.show_on_public_page}
                    onCheckedChange={() => handleToggleVisibility(ambassador.id, ambassador.show_on_public_page)}
                  />
                </div>
              </div>
            );
          })}

          {(!ambassadors || ambassadors.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma embaixadora ativa encontrada
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
