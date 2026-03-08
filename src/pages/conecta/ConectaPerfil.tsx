import { useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { ConectaLayout } from '@/components/conecta/ConectaLayout';
import { useConectaProfile } from '@/hooks/useConectaProfile';
import { useConectaAccess } from '@/hooks/useConectaAccess';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import RankBadge from '@/components/conecta/RankBadge';
import { toast } from 'sonner';
import { 
  Loader2, Save, Building, Phone, Mail, Globe, Linkedin, Instagram, 
  Camera, ImagePlus, Cake 
} from 'lucide-react';

export default function ConectaPerfil() {
  const { user } = useConectaAccess();
  const { profile, isLoading, updateProfile, isUpdating } = useConectaProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    company: '',
    position: '',
    phone: '',
    bio: '',
    linkedin_url: '',
    instagram_url: '',
    website_url: '',
    birthday: '',
  });

  const handleEdit = () => {
    if (profile) {
      setFormData({
        company: profile.company || '',
        position: profile.position || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        linkedin_url: profile.linkedin_url || '',
        instagram_url: profile.instagram_url || '',
        website_url: profile.website_url || '',
        birthday: profile.birthday || '',
      });
    }
    setIsEditing(true);
  };

  const handleSave = () => {
    updateProfile(formData);
    setIsEditing(false);
  };

  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;
    if (!file.type.startsWith('image/')) { toast.error('Selecione uma imagem válida'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('A imagem deve ter no máximo 5MB'); return; }

    setIsUploadingBanner(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `conecta/${user.id}/banner.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      updateProfile({ banner_url: `${publicUrl}?t=${Date.now()}` });
      toast.success('Capa atualizada!');
    } catch {
      toast.error('Erro ao fazer upload da capa');
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <ConectaLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ConectaLayout>
    );
  }

  return (
    <ConectaLayout>
      <Helmet>
        <title>Meu Perfil | CONECTA+</title>
      </Helmet>

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Meu Perfil CONECTA+</h1>
            <p className="text-muted-foreground">Gerencie suas informações profissionais</p>
          </div>
          {!isEditing ? (
            <Button onClick={handleEdit}>Editar Perfil</Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={isUpdating}>
                {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar
              </Button>
            </div>
          )}
        </div>

        <Card className="overflow-hidden">
          {/* Banner */}
          <div 
            className="relative h-32 md:h-48 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20"
            style={profile?.banner_url ? { 
              backgroundImage: `url(${profile.banner_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            } : undefined}
          >
            <button
              onClick={() => bannerInputRef.current?.click()}
              disabled={isUploadingBanner}
              className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
            >
              {isUploadingBanner ? (
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              ) : (
                <div className="flex items-center gap-2 text-white bg-black/50 px-4 py-2 rounded-lg">
                  <ImagePlus className="h-5 w-5" />
                  <span>Alterar capa</span>
                </div>
              )}
            </button>
            <input ref={bannerInputRef} type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
          </div>

          <CardContent className="relative pt-6">
            {/* Avatar */}
            <div className="absolute -top-16 left-6">
              <div className="relative group">
                <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                  <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || ''} />
                  <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
                    {getInitials(profile?.full_name)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col md:flex-row gap-6 pt-24 md:pt-6 md:pl-40">
              <div className="hidden md:block min-w-[180px]">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{profile?.points ?? 0}</p>
                  <p className="text-xs text-muted-foreground">pontos</p>
                  <div className="mt-2">
                    <RankBadge rank={profile?.rank as any} />
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-4">
                {isEditing ? (
                  <>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company">Empresa</Label>
                        <Input id="company" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="position">Cargo</Label>
                        <Input id="position" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">WhatsApp</Label>
                        <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="(11) 99999-9999" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="birthday">Data de Aniversário</Label>
                        <Input id="birthday" type="date" value={formData.birthday} onChange={(e) => setFormData({ ...formData, birthday: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea id="bio" value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} placeholder="Conte um pouco sobre você..." rows={3} />
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="linkedin_url">LinkedIn</Label>
                        <Input id="linkedin_url" value={formData.linkedin_url} onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })} placeholder="https://linkedin.com/in/..." />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="instagram_url">Instagram</Label>
                        <Input id="instagram_url" value={formData.instagram_url} onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })} placeholder="@usuario" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website_url">Website</Label>
                        <Input id="website_url" value={formData.website_url} onChange={(e) => setFormData({ ...formData, website_url: e.target.value })} placeholder="https://..." />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <h2 className="text-2xl font-bold">{profile?.full_name}</h2>
                      {profile?.position && profile?.company && (
                        <p className="text-muted-foreground">{profile.position} na {profile.company}</p>
                      )}
                    </div>
                    {profile?.bio && <p className="text-foreground/80">{profile.bio}</p>}
                    <div className="flex flex-wrap gap-4 pt-2">
                      {profile?.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-4 h-4" /><span>{profile.email}</span>
                        </div>
                      )}
                      {profile?.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="w-4 h-4" /><span>{profile.phone}</span>
                        </div>
                      )}
                      {profile?.company && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building className="w-4 h-4" /><span>{profile.company}</span>
                        </div>
                      )}
                      {profile?.birthday && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Cake className="w-4 h-4" /><span>{profile.birthday}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3 pt-2">
                      {profile?.linkedin_url && (
                        <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors">
                          <Linkedin className="w-5 h-5" />
                        </a>
                      )}
                      {profile?.instagram_url && (
                        <a href={`https://instagram.com/${profile.instagram_url.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors">
                          <Instagram className="w-5 h-5" />
                        </a>
                      )}
                      {profile?.website_url && (
                        <a href={profile.website_url} target="_blank" rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors">
                          <Globe className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ConectaLayout>
  );
}
