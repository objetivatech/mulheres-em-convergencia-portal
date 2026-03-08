import { useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { ConectaLayout } from '@/components/conecta/ConectaLayout';
import { useConectaOneOnOnes } from '@/hooks/useConectaOneOnOnes';
import { useConectaAccess } from '@/hooks/useConectaAccess';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import ConectaMemberSelect from '@/components/conecta/ConectaMemberSelect';
import { Loader2, Plus, Handshake, User, Users, Trash2, Calendar, ImagePlus, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

async function compressImage(file: File, maxWidth = 1200, quality = 0.7): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) { height = (height * maxWidth) / width; width = maxWidth; }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Falha')), 'image/jpeg', quality);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ConectaReunioes() {
  const { user } = useConectaAccess();
  const { meetings, isLoading, createOneOnOne, deleteOneOnOne } = useConectaOneOnOnes();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    meeting_type: 'membro' as 'membro' | 'convidado',
    partner_id: '',
    guest_name: '',
    guest_company: '',
    notes: '',
    meeting_date: new Date().toISOString().split('T')[0],
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Selecione uma imagem'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Máximo 10MB'); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => { setImageFile(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !user?.id) return null;
    try {
      setUploading(true);
      const compressed = await compressImage(imageFile);
      const fileName = `conecta/one-on-one/${user.id}/${Date.now()}.jpg`;
      const { error } = await supabase.storage.from('avatars').upload(fileName, compressed, { contentType: 'image/jpeg', upsert: true });
      if (error) throw error;
      return supabase.storage.from('avatars').getPublicUrl(fileName).data.publicUrl;
    } catch { toast.error('Erro ao enviar imagem'); return null; } finally { setUploading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.meeting_type === 'membro' && !formData.partner_id) { toast.error('Selecione uma membro'); return; }
    if (formData.meeting_type === 'convidado' && !formData.guest_name.trim()) { toast.error('Nome da convidada é obrigatório'); return; }

    const photoUrl = await uploadImage();
    await createOneOnOne.mutateAsync({ ...formData, photo_url: photoUrl || undefined });
    setOpen(false);
    setFormData({ meeting_type: 'membro', partner_id: '', guest_name: '', guest_company: '', notes: '', meeting_date: new Date().toISOString().split('T')[0] });
    removeImage();
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <ConectaLayout requireMember>
      <Helmet><title>Reuniões 1-a-1 | CONECTA+</title></Helmet>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Handshake className="w-6 h-6 text-primary" />Reuniões 1-a-1
            </h1>
            <p className="text-muted-foreground">Registre seus encontros individuais</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Nova Reunião</Button></DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Registrar Reunião 1-a-1</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de Reunião</Label>
                  <RadioGroup value={formData.meeting_type} onValueChange={v => setFormData({ ...formData, meeting_type: v as any })} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="membro" id="r-membro" />
                      <Label htmlFor="r-membro" className="flex items-center gap-1 cursor-pointer"><Users className="w-4 h-4" />Com Membro</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="convidado" id="r-convidado" />
                      <Label htmlFor="r-convidado" className="flex items-center gap-1 cursor-pointer"><User className="w-4 h-4" />Com Convidada</Label>
                    </div>
                  </RadioGroup>
                </div>

                {formData.meeting_type === 'membro' ? (
                  <div className="space-y-2">
                    <Label>Membro</Label>
                    <ConectaMemberSelect value={formData.partner_id} onChange={v => setFormData({ ...formData, partner_id: v })} />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome da Convidada</Label>
                      <Input value={formData.guest_name} onChange={e => setFormData({ ...formData, guest_name: e.target.value })} maxLength={100} />
                    </div>
                    <div className="space-y-2">
                      <Label>Empresa</Label>
                      <Input value={formData.guest_company} onChange={e => setFormData({ ...formData, guest_company: e.target.value })} maxLength={100} />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input type="date" value={formData.meeting_date} onChange={e => setFormData({ ...formData, meeting_date: e.target.value })} required />
                </div>

                <div className="space-y-2">
                  <Label>Foto do Encontro (opcional)</Label>
                  <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg border" />
                      <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={removeImage}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button type="button" variant="outline" className="w-full h-24 border-dashed" onClick={() => fileInputRef.current?.click()}>
                      <div className="flex flex-col items-center gap-2">
                        <ImagePlus className="w-6 h-6 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Adicionar foto</span>
                      </div>
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Observações (opcional)</Label>
                  <Textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={3} maxLength={500} />
                </div>

                <Button type="submit" className="w-full" disabled={createOneOnOne.isPending || uploading}>
                  {createOneOnOne.isPending || uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{uploading ? 'Enviando...' : 'Salvando...'}</> : 'Registrar Reunião'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : meetings.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            <Handshake className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Nenhuma reunião registrada</p>
            <p className="text-sm">Comece registrando sua primeira reunião 1-a-1!</p>
          </CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {meetings.map(meeting => (
              <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {meeting.photo_url ? (
                      <img src={meeting.photo_url} alt="" className="w-16 h-16 rounded-lg object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={meeting.partner?.avatar_url || ''} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(meeting.partner?.full_name || meeting.guest_name || '?')}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">
                          {meeting.meeting_type === 'membro' ? meeting.partner?.full_name : meeting.guest_name}
                        </h3>
                        <Badge variant={meeting.meeting_type === 'membro' ? 'default' : 'secondary'} className="text-xs shrink-0">
                          {meeting.meeting_type === 'membro' ? 'Membro' : 'Convidada'}
                        </Badge>
                      </div>
                      {(meeting.partner?.company || meeting.guest_company) && (
                        <p className="text-sm text-muted-foreground truncate">{meeting.partner?.company || meeting.guest_company}</p>
                      )}
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(meeting.meeting_date + 'T12:00:00'), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                      </div>
                      {meeting.notes && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{meeting.notes}</p>}
                    </div>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive shrink-0" onClick={() => deleteOneOnOne.mutate(meeting.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ConectaLayout>
  );
}
