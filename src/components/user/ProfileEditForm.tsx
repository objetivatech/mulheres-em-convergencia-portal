import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Save, Linkedin, Instagram, Globe, Phone, MapPin } from 'lucide-react';
import { ImageCropUploader, IMAGE_PRESETS } from '@/components/ui/ImageCropUploader';

interface ProfileData {
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  public_bio: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  website_url: string | null;
}

interface ProfileEditFormProps {
  profile: ProfileData | null;
  onProfileUpdated: () => void;
}

export const ProfileEditForm = ({ profile, onProfileUpdated }: ProfileEditFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { uploadFile, uploading } = useR2Storage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    bio: profile?.bio || '',
    public_bio: profile?.public_bio || '',
    phone: profile?.phone || '',
    city: profile?.city || '',
    state: profile?.state || '',
    linkedin_url: profile?.linkedin_url || '',
    instagram_url: profile?.instagram_url || '',
    website_url: profile?.website_url || '',
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Erro', description: 'Selecione uma imagem válida', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Erro', description: 'Máximo 5MB', variant: 'destructive' });
      return;
    }

    const url = await uploadFile(file, `avatars/${user.id}`);
    if (url) {
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id);
      onProfileUpdated();
      toast({ title: 'Sucesso', description: 'Foto atualizada!' });
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          bio: form.bio || null,
          public_bio: form.public_bio || null,
          phone: form.phone || null,
          city: form.city || null,
          state: form.state || null,
          linkedin_url: form.linkedin_url || null,
          instagram_url: form.instagram_url || null,
          website_url: form.website_url || null,
        })
        .eq('id', user.id);

      if (error) throw error;
      onProfileUpdated();
      toast({ title: 'Sucesso', description: 'Perfil atualizado!' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const initials = (profile?.full_name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      {/* Avatar + Nome */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Foto e Identificação</CardTitle>
          <CardDescription>Sua foto será reutilizada no CONECTA+, Embaixadora e outros módulos. Recomendado: 400×400px, máx. 5MB.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-start gap-6">
          <div className="relative group">
            <Avatar className="h-24 w-24 border-2 border-primary/20">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback className="text-2xl font-semibold bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer"
            >
              {uploading ? (
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              ) : (
                <Camera className="h-6 w-6 text-white" />
              )}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="font-semibold text-lg">{profile?.full_name || '—'}</p>
            <p className="text-sm text-muted-foreground">Nome cadastrado no CPF. Para alterar, entre em contato com o suporte.</p>
          </div>
        </CardContent>
      </Card>

      {/* Bio */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bio</CardTitle>
          <CardDescription>A bio pública é exibida no CONECTA+ e na página de Embaixadora</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Mini-bio (privada)</Label>
            <Textarea value={form.bio} onChange={e => update('bio', e.target.value)} placeholder="Uma breve descrição sobre você..." rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* Contato e Localização */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contato e Localização</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> Telefone / WhatsApp</Label>
            <Input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="(11) 99999-9999" />
          </div>
          <div className="space-y-1">
            <Label className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Cidade</Label>
            <Input value={form.city} onChange={e => update('city', e.target.value)} placeholder="Sua cidade" />
          </div>
          <div className="space-y-1">
            <Label>Estado (UF)</Label>
            <Input value={form.state} onChange={e => update('state', e.target.value)} placeholder="SP" maxLength={2} />
          </div>
        </CardContent>
      </Card>

      {/* Redes Sociais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Redes Sociais</CardTitle>
          <CardDescription>Links compartilhados com CONECTA+ e perfil de Embaixadora</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label className="flex items-center gap-1"><Linkedin className="h-3.5 w-3.5" /> LinkedIn</Label>
            <Input value={form.linkedin_url} onChange={e => update('linkedin_url', e.target.value)} placeholder="https://linkedin.com/in/..." />
          </div>
          <div className="space-y-1">
            <Label className="flex items-center gap-1"><Instagram className="h-3.5 w-3.5" /> Instagram</Label>
            <Input value={form.instagram_url} onChange={e => update('instagram_url', e.target.value)} placeholder="@usuario" />
          </div>
          <div className="space-y-1">
            <Label className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" /> Website</Label>
            <Input value={form.website_url} onChange={e => update('website_url', e.target.value)} placeholder="https://..." />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto">
        {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</> : <><Save className="h-4 w-4 mr-2" /> Salvar Perfil</>}
      </Button>
    </div>
  );
};
