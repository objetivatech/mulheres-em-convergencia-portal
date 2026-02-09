import { useState } from 'react';
import { Plus, Edit, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ImageUploader } from '@/components/blog/ImageUploader';
import { useBlogAuthors, useCreateBlogAuthor, useUpdateBlogAuthor, useDeleteBlogAuthor, BlogAuthor } from '@/hooks/useBlogAuthors';

export const AuthorManager = () => {
  const { data: authors, isLoading } = useBlogAuthors();
  const createAuthor = useCreateBlogAuthor();
  const updateAuthor = useUpdateBlogAuthor();
  const deleteAuthor = useDeleteBlogAuthor();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<BlogAuthor | null>(null);
  const [formData, setFormData] = useState({
    display_name: '',
    photo_url: '',
    bio: '',
    instagram_url: '',
    linkedin_url: '',
    website_url: '',
  });

  const resetForm = () => {
    setFormData({ display_name: '', photo_url: '', bio: '', instagram_url: '', linkedin_url: '', website_url: '' });
    setEditingAuthor(null);
  };

  const openEdit = (author: BlogAuthor) => {
    setEditingAuthor(author);
    setFormData({
      display_name: author.display_name,
      photo_url: author.photo_url || '',
      bio: author.bio || '',
      instagram_url: author.instagram_url || '',
      linkedin_url: author.linkedin_url || '',
      website_url: author.website_url || '',
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.display_name.trim()) return;
    const data = {
      display_name: formData.display_name.trim(),
      photo_url: formData.photo_url || null,
      bio: formData.bio || null,
      instagram_url: formData.instagram_url || null,
      linkedin_url: formData.linkedin_url || null,
      website_url: formData.website_url || null,
      user_id: null,
    };

    if (editingAuthor) {
      await updateAuthor.mutateAsync({ id: editingAuthor.id, authorData: data });
    } else {
      await createAuthor.mutateAsync(data);
    }
    resetForm();
    setIsDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        <p className="mt-4 text-muted-foreground">Carregando autores...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Autores do Blog</h3>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Novo Autor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingAuthor ? 'Editar Autor' : 'Novo Autor'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome de Exibição *</Label>
                <Input
                  value={formData.display_name}
                  onChange={(e) => setFormData(f => ({ ...f, display_name: e.target.value }))}
                  placeholder="Nome da autora"
                />
              </div>
              <ImageUploader
                value={formData.photo_url}
                onChange={(url) => setFormData(f => ({ ...f, photo_url: url || '' }))}
                label="Foto do Autor"
              />
              <div>
                <Label>Mini Bio</Label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(f => ({ ...f, bio: e.target.value }))}
                  placeholder="Breve descrição sobre a autora"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Instagram</Label>
                  <Input
                    value={formData.instagram_url}
                    onChange={(e) => setFormData(f => ({ ...f, instagram_url: e.target.value }))}
                    placeholder="https://instagram.com/..."
                  />
                </div>
                <div>
                  <Label>LinkedIn</Label>
                  <Input
                    value={formData.linkedin_url}
                    onChange={(e) => setFormData(f => ({ ...f, linkedin_url: e.target.value }))}
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
              </div>
              <div>
                <Label>Website</Label>
                <Input
                  value={formData.website_url}
                  onChange={(e) => setFormData(f => ({ ...f, website_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { resetForm(); setIsDialogOpen(false); }}>Cancelar</Button>
                <Button onClick={handleSave} disabled={createAuthor.isPending || updateAuthor.isPending}>
                  {editingAuthor ? 'Salvar' : 'Criar Autor'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!authors || authors.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">Nenhum autor cadastrado.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Autor</TableHead>
              <TableHead>Bio</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {authors.map((author) => (
              <TableRow key={author.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {author.photo_url ? (
                      <img src={author.photo_url} alt={author.display_name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <p className="font-medium">{author.display_name}</p>
                  </div>
                </TableCell>
                <TableCell className="max-w-xs">
                  <p className="text-sm text-muted-foreground line-clamp-2">{author.bio || '-'}</p>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="outline" size="sm" onClick={() => openEdit(author)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir autor?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Os posts deste autor não serão excluídos, apenas a vinculação será removida.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteAuthor.mutate(author.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
