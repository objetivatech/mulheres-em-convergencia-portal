import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Eye, EyeOff, ArrowUp, ArrowDown, ExternalLink, Edit, Upload, Loader2 } from 'lucide-react';

interface AmbassadorPublicSettings {
  id: string;
  referral_code: string;
  tier: string;
  show_on_public_page: boolean;
  display_order: number;
  public_name: string | null;
  public_photo_url: string | null;
  public_bio: string | null;
  public_city: string | null;
  public_state: string | null;
  public_instagram_url: string | null;
  public_linkedin_url: string | null;
  public_website_url: string | null;
  profile: {
    full_name: string;
    avatar_url: string | null;
  };
}

export function AdminPublicPageManager() {
  const queryClient = useQueryClient();
  const [editingAmbassador, setEditingAmbassador] = useState<AmbassadorPublicSettings | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
          public_name,
          public_photo_url,
          public_bio,
          public_city,
          public_state,
          public_instagram_url,
          public_linkedin_url,
          public_website_url,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .eq('active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      return (data || []).map((a: any) => ({
        ...a,
        profile: a.profiles || { full_name: 'Sem nome', avatar_url: null },
      }));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<AmbassadorPublicSettings> & { id: string }) => {
      const { id, profile, ...data } = updates as any;
      
      const { error } = await supabase
        .from('ambassadors')
        .update(data)
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editingAmbassador) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${editingAmbassador.id}-${Date.now()}.${fileExt}`;
      const filePath = `public-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('ambassador-materials')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('ambassador-materials')
        .getPublicUrl(filePath);

      setEditingAmbassador(prev => prev ? { ...prev, public_photo_url: publicUrl } : null);
      toast.success('Foto enviada com sucesso!');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Erro ao enviar foto');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveEdit = () => {
    if (!editingAmbassador) return;

    updateMutation.mutate({
      id: editingAmbassador.id,
      public_name: editingAmbassador.public_name,
      public_photo_url: editingAmbassador.public_photo_url,
      public_bio: editingAmbassador.public_bio,
      public_city: editingAmbassador.public_city,
      public_state: editingAmbassador.public_state,
      public_instagram_url: editingAmbassador.public_instagram_url,
      public_linkedin_url: editingAmbassador.public_linkedin_url,
      public_website_url: editingAmbassador.public_website_url,
    });

    setEditingAmbassador(null);
    toast.success('Dados salvos com sucesso!');
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

  const visibleCount = ambassadors?.filter(a => a.show_on_public_page && a.public_name).length || 0;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Página Pública de Embaixadoras
              </CardTitle>
              <CardDescription>
                Cadastre os dados públicos das embaixadoras e controle a visibilidade na página
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
              const displayName = ambassador.public_name || ambassador.profile.full_name;
              const displayPhoto = ambassador.public_photo_url || ambassador.profile.avatar_url;
              const hasPublicData = !!ambassador.public_name;
              
              return (
                <div 
                  key={ambassador.id}
                  className={`flex items-center gap-4 p-4 border rounded-lg transition-colors ${
                    ambassador.show_on_public_page && hasPublicData 
                      ? 'bg-primary/5 border-primary/20' 
                      : 'bg-muted/30'
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
                    <AvatarImage src={displayPhoto || undefined} />
                    <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{displayName}</p>
                      <Badge className={`${tierInfo.color} text-xs`}>{tierInfo.label}</Badge>
                      {!hasPublicData && (
                        <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                          Não cadastrada
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {ambassador.profile.full_name} • {ambassador.referral_code}
                    </p>
                  </div>

                  {/* Edit Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingAmbassador(ambassador)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>

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
                    {ambassador.show_on_public_page && hasPublicData ? (
                      <Eye className="h-4 w-4 text-primary" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Switch
                      checked={ambassador.show_on_public_page}
                      onCheckedChange={() => handleToggleVisibility(ambassador.id, ambassador.show_on_public_page)}
                      disabled={!hasPublicData}
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

      {/* Edit Dialog */}
      <Dialog open={!!editingAmbassador} onOpenChange={(open) => !open && setEditingAmbassador(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Dados Públicos</DialogTitle>
            <DialogDescription>
              Configure os dados que serão exibidos na página pública para esta embaixadora.
              <br />
              <span className="text-muted-foreground">
                Perfil original: {editingAmbassador?.profile.full_name}
              </span>
            </DialogDescription>
          </DialogHeader>

          {editingAmbassador && (
            <div className="space-y-4">
              {/* Photo Upload */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={editingAmbassador.public_photo_url || undefined} />
                  <AvatarFallback className="text-xl">
                    {getInitials(editingAmbassador.public_name || editingAmbassador.profile.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {uploading ? 'Enviando...' : 'Enviar Foto'}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    Máximo 5MB, formatos: JPG, PNG, WebP
                  </p>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="public_name">Nome para Exibição *</Label>
                <Input
                  id="public_name"
                  value={editingAmbassador.public_name || ''}
                  onChange={(e) => setEditingAmbassador(prev => prev ? { ...prev, public_name: e.target.value } : null)}
                  placeholder={editingAmbassador.profile.full_name}
                />
              </div>

              {/* Location */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="public_city">Cidade</Label>
                  <Input
                    id="public_city"
                    value={editingAmbassador.public_city || ''}
                    onChange={(e) => setEditingAmbassador(prev => prev ? { ...prev, public_city: e.target.value } : null)}
                    placeholder="Ex: São Paulo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="public_state">Estado</Label>
                  <Input
                    id="public_state"
                    value={editingAmbassador.public_state || ''}
                    onChange={(e) => setEditingAmbassador(prev => prev ? { ...prev, public_state: e.target.value } : null)}
                    placeholder="Ex: SP"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="public_bio">Mini-Bio</Label>
                <Textarea
                  id="public_bio"
                  value={editingAmbassador.public_bio || ''}
                  onChange={(e) => setEditingAmbassador(prev => prev ? { ...prev, public_bio: e.target.value } : null)}
                  placeholder="Uma breve descrição sobre a embaixadora..."
                  rows={3}
                />
              </div>

              {/* Social Links */}
              <div className="space-y-2">
                <Label htmlFor="public_instagram_url">Instagram</Label>
                <Input
                  id="public_instagram_url"
                  value={editingAmbassador.public_instagram_url || ''}
                  onChange={(e) => setEditingAmbassador(prev => prev ? { ...prev, public_instagram_url: e.target.value } : null)}
                  placeholder="https://instagram.com/usuario"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="public_linkedin_url">LinkedIn</Label>
                <Input
                  id="public_linkedin_url"
                  value={editingAmbassador.public_linkedin_url || ''}
                  onChange={(e) => setEditingAmbassador(prev => prev ? { ...prev, public_linkedin_url: e.target.value } : null)}
                  placeholder="https://linkedin.com/in/usuario"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="public_website_url">Website</Label>
                <Input
                  id="public_website_url"
                  value={editingAmbassador.public_website_url || ''}
                  onChange={(e) => setEditingAmbassador(prev => prev ? { ...prev, public_website_url: e.target.value } : null)}
                  placeholder="https://exemplo.com"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAmbassador(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={!editingAmbassador?.public_name}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
