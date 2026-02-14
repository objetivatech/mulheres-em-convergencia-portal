import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useTimelineAdmin, type TimelineItem } from '@/hooks/useTimeline';
import { useR2Storage } from '@/hooks/useR2Storage';
import { Plus, Pencil, Trash2, Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PRODUCTION_DOMAIN } from '@/lib/constants';

const emptyForm = {
  year: new Date().getFullYear(),
  date_label: '',
  title: '',
  description: '',
  image_url: '',
  display_order: 0,
  active: true,
};

const AdminTimeline = () => {
  const { items, loading, createItem, updateItem, deleteItem } = useTimelineAdmin();
  const { uploadFile, uploading } = useR2Storage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TimelineItem | null>(null);
  const [form, setForm] = useState(emptyForm);

  const handleOpenNew = () => {
    setEditingItem(null);
    setForm({ ...emptyForm, display_order: items.length + 1 });
    setDialogOpen(true);
  };

  const handleEdit = (item: TimelineItem) => {
    setEditingItem(item);
    setForm({
      year: item.year,
      date_label: item.date_label,
      title: item.title,
      description: item.description,
      image_url: item.image_url || '',
      display_order: item.display_order,
      active: item.active,
    });
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file, 'timeline');
    if (url) setForm(prev => ({ ...prev, image_url: url }));
  };

  const handleSave = async () => {
    if (!form.title || !form.date_label || !form.description) {
      toast({ title: 'Erro', description: 'Preencha título, período e descrição.', variant: 'destructive' });
      return;
    }
    try {
      if (editingItem) {
        await updateItem(editingItem.id, form);
        toast({ title: 'Atualizado', description: 'Item atualizado com sucesso.' });
      } else {
        await createItem(form);
        toast({ title: 'Criado', description: 'Item criado com sucesso.' });
      }
      setDialogOpen(false);
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;
    try {
      await deleteItem(id);
      toast({ title: 'Excluído', description: 'Item removido com sucesso.' });
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <>
      <Helmet>
        <title>Gestão da Timeline - Admin</title>
        <link rel="canonical" href={`${PRODUCTION_DOMAIN}/admin/timeline`} />
      </Helmet>
      <Layout>
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Linha do Tempo</h1>
                <p className="text-muted-foreground">Gerencie os marcos históricos do projeto</p>
              </div>
            </div>
            <Button onClick={handleOpenNew}>
              <Plus className="h-4 w-4 mr-2" /> Novo Item
            </Button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="animate-pulse"><CardContent className="h-20" /></Card>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(item => (
                <Card key={item.id} className={`${!item.active ? 'opacity-50' : ''}`}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {item.image_url && (
                        <img src={item.image_url} alt="" className="w-16 h-12 object-cover rounded" />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">{item.year}</Badge>
                          <span className="text-sm text-muted-foreground">{item.date_label}</span>
                          {!item.active && <Badge variant="secondary" className="text-xs">Inativo</Badge>}
                        </div>
                        <p className="font-medium truncate">{item.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span className="text-xs text-muted-foreground">#{item.display_order}</span>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Dialog for create/edit */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Editar Item' : 'Novo Item'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Ano</Label>
                    <Input type="number" value={form.year} onChange={e => setForm(p => ({ ...p, year: parseInt(e.target.value) || 0 }))} />
                  </div>
                  <div>
                    <Label>Ordem</Label>
                    <Input type="number" value={form.display_order} onChange={e => setForm(p => ({ ...p, display_order: parseInt(e.target.value) || 0 }))} />
                  </div>
                </div>
                <div>
                  <Label>Período/Data</Label>
                  <Input value={form.date_label} onChange={e => setForm(p => ({ ...p, date_label: e.target.value }))} placeholder="Ex: Maio 2015" />
                </div>
                <div>
                  <Label>Título</Label>
                  <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={4} />
                </div>
                <div>
                  <Label>Imagem</Label>
                  {form.image_url && (
                    <img src={form.image_url} alt="Preview" className="w-full h-32 object-cover rounded mb-2" />
                  )}
                  <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                  {uploading && <p className="text-sm text-muted-foreground mt-1">Enviando...</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.active} onCheckedChange={v => setForm(p => ({ ...p, active: v }))} />
                  <Label>Ativo</Label>
                </div>
                <Button onClick={handleSave} className="w-full" disabled={uploading}>
                  {editingItem ? 'Salvar Alterações' : 'Criar Item'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </Layout>
    </>
  );
};

export default AdminTimeline;
