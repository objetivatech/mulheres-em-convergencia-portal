import { useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { ConectaLayout } from '@/components/conecta/ConectaLayout';
import { useConectaProfile } from '@/hooks/useConectaProfile';
import { useConectaAccess } from '@/hooks/useConectaAccess';
import { useR2Storage } from '@/hooks/useR2Storage';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import RankBadge from '@/components/conecta/RankBadge';
import ConectaProfileStats from '@/components/conecta/ConectaProfileStats';
import BusinessProfileCard from '@/components/conecta/BusinessProfileCard';
import { toast } from 'sonner';
import { 
  Loader2, Save, Building, Phone, Mail, Globe, Linkedin, Instagram, 
  ImagePlus, Cake, Briefcase, Tag, Target, UserCheck, Megaphone, Sparkles, X
} from 'lucide-react';

export default function ConectaPerfil() {
  const { user } = useConectaAccess();
  const { profile, isLoading, updateProfile, isUpdating } = useConectaProfile();
  const { uploadFile, uploading: isUploadingBanner } = useR2Storage();
  const [isEditing, setIsEditing] = useState(false);
  const [generatingPitch, setGeneratingPitch] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [tagInput, setTagInput] = useState('');
  const [formData, setFormData] = useState({
    company: '',
    position: '',
    phone: '',
    bio: '',
    linkedin_url: '',
    instagram_url: '',
    website_url: '',
    birthday: '',
    area_of_expertise: '',
    skills_tags: [] as string[],
    pitch_what_i_do: '',
    pitch_ideal_client: '',
    pitch_how_to_refer: '',
    contact_email: '',
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
        area_of_expertise: profile.area_of_expertise || '',
        skills_tags: profile.skills_tags || [],
        pitch_what_i_do: profile.pitch_what_i_do || '',
        pitch_ideal_client: profile.pitch_ideal_client || '',
        pitch_how_to_refer: profile.pitch_how_to_refer || '',
        contact_email: profile.contact_email || '',
      });
    }
    setIsEditing(true);
  };

  const handleSave = async () => {
    updateProfile(formData);

    // Sync back to profiles
    if (user?.id) {
      await supabase.from('profiles').update({
        phone: formData.phone || null,
        linkedin_url: formData.linkedin_url || null,
        instagram_url: formData.instagram_url || null,
        website_url: formData.website_url || null,
        bio: formData.bio || null,
      }).eq('id', user.id);
    }

    setIsEditing(false);
  };

  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;
    if (!file.type.startsWith('image/')) { toast.error('Selecione uma imagem válida'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('A imagem deve ter no máximo 5MB'); return; }

    const url = await uploadFile(file, 'conecta/banners');
    if (url) {
      updateProfile({ banner_url: url });
      toast.success('Capa atualizada!');
    }
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.skills_tags.includes(tag)) {
      setFormData({ ...formData, skills_tags: [...formData.skills_tags, tag] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, skills_tags: formData.skills_tags.filter(t => t !== tag) });
  };

  const generatePitch = async () => {
    if (!formData.company && !formData.position && !formData.area_of_expertise) {
      toast.error('Preencha pelo menos empresa, cargo ou área de atuação para gerar o pitch');
      return;
    }
    setGeneratingPitch(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-conecta-pitch', {
        body: {
          company: formData.company,
          position: formData.position,
          area_of_expertise: formData.area_of_expertise,
          bio: formData.bio,
          skills_tags: formData.skills_tags,
          pitch_what_i_do: formData.pitch_what_i_do,
          pitch_ideal_client: formData.pitch_ideal_client,
        },
      });
      if (error) throw error;
      if (data?.pitch_what_i_do) setFormData(prev => ({ ...prev, pitch_what_i_do: data.pitch_what_i_do }));
      if (data?.pitch_ideal_client) setFormData(prev => ({ ...prev, pitch_ideal_client: data.pitch_ideal_client }));
      if (data?.pitch_how_to_refer) setFormData(prev => ({ ...prev, pitch_how_to_refer: data.pitch_how_to_refer }));
      toast.success('Pitch gerado! Revise e edite antes de salvar.');
    } catch {
      toast.error('Erro ao gerar pitch. Tente novamente.');
    } finally {
      setGeneratingPitch(false);
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

        {/* Banner + Avatar Card */}
        <Card className="overflow-hidden">
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
                  <ImagePlus className="h-5 w-5" /><span>Alterar capa</span>
                </div>
              )}
            </button>
            <input ref={bannerInputRef} type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
          </div>

          <CardContent className="relative pt-6">
            <div className="absolute -top-16 left-6">
              <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || ''} />
                <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
                  {getInitials(profile?.full_name)}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex flex-col md:flex-row gap-6 pt-24 md:pt-6 md:pl-40">
              <div className="hidden md:block min-w-[180px]">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{profile?.points ?? 0}</p>
                  <p className="text-xs text-muted-foreground">pontos</p>
                  <div className="mt-2"><RankBadge rank={profile?.rank as any} /></div>
                </div>
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-bold">{profile?.full_name}</h2>
                {profile?.position && profile?.company && (
                  <p className="text-muted-foreground">{profile.position} na {profile.company}</p>
                )}
                {profile?.area_of_expertise && (
                  <p className="text-sm text-primary font-medium mt-1">{profile.area_of_expertise}</p>
                )}
                {profile?.bio && <p className="text-foreground/80 mt-2">{profile.bio}</p>}
                {profile?.skills_tags && profile.skills_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {profile.skills_tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {isEditing ? (
          <>
            {/* Section 1: Basic Info */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Building className="w-5 h-5" />Informações Básicas</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Empresa</Label>
                    <Input value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Cargo</Label>
                    <Input value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Textarea value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} placeholder="Conte sobre você..." rows={3} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Briefcase className="w-4 h-4" />Área de Atuação</Label>
                  <Input value={formData.area_of_expertise} onChange={e => setFormData({ ...formData, area_of_expertise: e.target.value })} placeholder="Ex: SEO Estratégico e Marketing Digital" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Tag className="w-4 h-4" />Tags / Habilidades</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={tagInput} 
                      onChange={e => setTagInput(e.target.value)} 
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                      placeholder="Digite e pressione Enter" 
                    />
                    <Button type="button" variant="outline" onClick={addTag}>Adicionar</Button>
                  </div>
                  {formData.skills_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {formData.skills_tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          {tag}
                          <button onClick={() => removeTag(tag)} className="hover:text-destructive"><X className="w-3 h-3" /></button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Cake className="w-4 h-4" />Data de Aniversário</Label>
                  <Input type="date" value={formData.birthday} onChange={e => setFormData({ ...formData, birthday: e.target.value })} />
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Contact & Social */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Phone className="w-5 h-5" />Contato & Redes</CardTitle></CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Telefone / WhatsApp</Label>
                    <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="(11) 99999-9999" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email de Contato</Label>
                    <Input type="email" value={formData.contact_email} onChange={e => setFormData({ ...formData, contact_email: e.target.value })} placeholder="contato@empresa.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Website</Label>
                    <Input value={formData.website_url} onChange={e => setFormData({ ...formData, website_url: e.target.value })} placeholder="https://..." />
                  </div>
                  <div className="space-y-2">
                    <Label>LinkedIn</Label>
                    <Input value={formData.linkedin_url} onChange={e => setFormData({ ...formData, linkedin_url: e.target.value })} placeholder="https://linkedin.com/in/..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Instagram</Label>
                    <Input value={formData.instagram_url} onChange={e => setFormData({ ...formData, instagram_url: e.target.value })} placeholder="@usuario" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 3: Elevator Pitch */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><Megaphone className="w-5 h-5" />Apresentação (Elevator Pitch)</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={generatePitch} 
                    disabled={generatingPitch}
                    className="gap-2"
                  >
                    {generatingPitch ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Gerar com IA
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Briefcase className="w-4 h-4" />O que eu faço</Label>
                  <Textarea 
                    value={formData.pitch_what_i_do} 
                    onChange={e => setFormData({ ...formData, pitch_what_i_do: e.target.value })} 
                    placeholder="Descreva seus serviços, produtos ou especialidades..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Target className="w-4 h-4" />Meu cliente ideal</Label>
                  <Textarea 
                    value={formData.pitch_ideal_client} 
                    onChange={e => setFormData({ ...formData, pitch_ideal_client: e.target.value })} 
                    placeholder="Quem são seus clientes ideais? Que perfil de empresa ou pessoa?"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><UserCheck className="w-4 h-4" />Como me indicar</Label>
                  <Textarea 
                    value={formData.pitch_how_to_refer} 
                    onChange={e => setFormData({ ...formData, pitch_how_to_refer: e.target.value })} 
                    placeholder="Qual o melhor caminho para alguém te indicar? Link, contato, processo?"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* View Mode: Contact & Social */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Phone className="w-5 h-5" />Contato & Redes</CardTitle></CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {profile?.contact_email && (
                    <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-muted-foreground" /><span>{profile.contact_email}</span></div>
                  )}
                  {profile?.email && !profile?.contact_email && (
                    <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-muted-foreground" /><span>{profile.email}</span></div>
                  )}
                  {profile?.phone && (
                    <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-muted-foreground" /><span>{profile.phone}</span></div>
                  )}
                  {profile?.company && (
                    <div className="flex items-center gap-2 text-sm"><Building className="w-4 h-4 text-muted-foreground" /><span>{profile.company}</span></div>
                  )}
                  {profile?.birthday && (
                    <div className="flex items-center gap-2 text-sm">
                      <Cake className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {(() => {
                          try {
                            const [, m, d] = profile.birthday.split('-');
                            const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
                            return `${parseInt(d, 10)}/${months[parseInt(m, 10) - 1]}`;
                          } catch { return profile.birthday; }
                        })()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex gap-3 mt-4">
                  {profile?.linkedin_url && (
                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors">
                      <Linkedin className="w-5 h-5" />
                    </a>
                  )}
                  {profile?.instagram_url && (
                    <a href={`https://instagram.com/${profile.instagram_url.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors">
                      <Instagram className="w-5 h-5" />
                    </a>
                  )}
                  {profile?.website_url && (
                    <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors">
                      <Globe className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* View Mode: Pitch */}
            {(profile?.pitch_what_i_do || profile?.pitch_ideal_client || profile?.pitch_how_to_refer) && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Megaphone className="w-5 h-5" />Apresentação (Elevator Pitch)</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {profile?.pitch_what_i_do && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1"><Briefcase className="w-4 h-4" />O que eu faço</p>
                      <p className="text-foreground/90">{profile.pitch_what_i_do}</p>
                    </div>
                  )}
                  {profile?.pitch_ideal_client && (
                    <div>
                      <Separator className="mb-4" />
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1"><Target className="w-4 h-4" />Meu cliente ideal</p>
                      <p className="text-foreground/90">{profile.pitch_ideal_client}</p>
                    </div>
                  )}
                  {profile?.pitch_how_to_refer && (
                    <div>
                      <Separator className="mb-4" />
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-1"><UserCheck className="w-4 h-4" />Como me indicar</p>
                      <p className="text-foreground/90">{profile.pitch_how_to_refer}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* View Mode: Business Card */}
            {user?.id && <BusinessProfileCard userId={user.id} />}

            {/* View Mode: Points & Stats */}
            <ConectaProfileStats />
          </>
        )}
      </div>
    </ConectaLayout>
  );
}
