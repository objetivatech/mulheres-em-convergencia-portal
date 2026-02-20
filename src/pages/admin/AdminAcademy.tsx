import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAcademyCourses, useAcademyCategories, useCreateCourse, useUpdateCourse, useDeleteCourse, useAcademyLessons, useCreateLesson, useUpdateLesson, useDeleteLesson } from '@/hooks/useAcademy';
import { useAllAcademySubscriptions, useAcademyStudents } from '@/hooks/useAcademySubscription';
import { useR2Storage } from '@/hooks/useR2Storage';
import { useNavigate } from 'react-router-dom';
import { PRODUCTION_DOMAIN } from '@/lib/constants';
import { Plus, Pencil, Trash2, BookOpen, ArrowLeft, Upload, GripVertical, Eye, Users, CreditCard, Clock, XCircle } from 'lucide-react';
import type { AcademyCourse, AcademyLesson } from '@/hooks/useAcademy';
import { format } from 'date-fns';

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Ativa', variant: 'default' },
  pending: { label: 'Pendente', variant: 'secondary' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
  expired: { label: 'Expirada', variant: 'outline' },
};

const AdminAcademy = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: courses, isLoading } = useAcademyCourses();
  const { data: categories } = useAcademyCategories();
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();
  const { uploadFile, uploading } = useR2Storage();

  const [editingCourse, setEditingCourse] = useState<Partial<AcademyCourse> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [lessonsPanel, setLessonsPanel] = useState<string | null>(null);
  const [subStatusFilter, setSubStatusFilter] = useState('all');

  const materialTypes = categories?.filter((c) => c.category_type === 'material_type') || [];
  const subjects = categories?.filter((c) => c.category_type === 'subject') || [];

  const handleSaveCourse = async () => {
    if (!editingCourse?.title) return;
    try {
      if (editingCourse.id) {
        await updateCourse.mutateAsync({ id: editingCourse.id, ...editingCourse } as any);
        toast({ title: 'Curso atualizado!' });
      } else {
        await createCourse.mutateAsync(editingCourse);
        toast({ title: 'Curso criado!' });
      }
      setIsDialogOpen(false);
      setEditingCourse(null);
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('Excluir este curso e todas as suas aulas?')) return;
    try {
      await deleteCourse.mutateAsync(id);
      toast({ title: 'Curso excluído' });
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file, 'academy-materials');
    if (url) {
      setEditingCourse((prev) => ({ ...prev, thumbnail_url: url }));
    }
  };

  const openNewCourse = () => {
    setEditingCourse({ title: '', status: 'draft', is_free: false, show_on_landing: false, featured: false, is_standalone_lesson: false });
    setIsDialogOpen(true);
  };

  return (
    <>
      <Helmet>
        <title>MeC Academy - Admin | Mulheres em Convergência</title>
        <link rel="canonical" href={`${PRODUCTION_DOMAIN}/admin/academy`} />
      </Helmet>

      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">MeC Academy</h1>
                  <p className="text-sm text-muted-foreground">Gestão de cursos, aulas e assinantes</p>
                </div>
              </div>
            </div>

            <Tabs defaultValue="courses">
              <TabsList className="mb-6">
                <TabsTrigger value="courses">
                  <BookOpen className="h-4 w-4 mr-2" /> Cursos
                </TabsTrigger>
                <TabsTrigger value="subscribers">
                  <Users className="h-4 w-4 mr-2" /> Alunos e Assinantes
                </TabsTrigger>
              </TabsList>

              <TabsContent value="courses">
                <div className="flex justify-end mb-4">
                  <Button onClick={openNewCourse}>
                    <Plus className="h-4 w-4 mr-2" /> Novo Curso
                  </Button>
                </div>

                {/* Courses List */}
                {isLoading ? (
                  <div className="text-center py-12 text-muted-foreground">Carregando...</div>
                ) : !courses?.length ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-40" />
                      <p>Nenhum curso cadastrado. Crie o primeiro!</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {courses.map((course) => (
                      <Card key={course.id}>
                        <CardContent className="p-4 flex items-center gap-4">
                          {course.thumbnail_url ? (
                            <img src={course.thumbnail_url} alt="" className="w-20 h-14 object-cover rounded" />
                          ) : (
                            <div className="w-20 h-14 bg-muted rounded flex items-center justify-center">
                              <BookOpen className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{course.title}</h3>
                            <div className="flex gap-2 mt-1">
                              <Badge variant={course.status === 'published' ? 'default' : 'secondary'} className="text-xs">
                                {course.status === 'published' ? 'Publicado' : course.status === 'archived' ? 'Arquivado' : 'Rascunho'}
                              </Badge>
                              {course.is_free && <Badge variant="outline" className="text-xs">Gratuito</Badge>}
                              {course.is_standalone_lesson && <Badge variant="outline" className="text-xs">Aula Avulsa</Badge>}
                              {course.show_on_landing && <Badge variant="outline" className="text-xs">Na Landing</Badge>}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setLessonsPanel(course.id)}>
                              Aulas
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => { setEditingCourse(course); setIsDialogOpen(true); }}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteCourse(course.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="subscribers">
                <SubscribersTab statusFilter={subStatusFilter} onStatusFilterChange={setSubStatusFilter} />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Course Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCourse?.id ? 'Editar Curso' : 'Novo Curso'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Título *</Label>
                <Input value={editingCourse?.title || ''} onChange={(e) => setEditingCourse((p) => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <Label>Descrição curta</Label>
                <Textarea value={editingCourse?.description || ''} onChange={(e) => setEditingCourse((p) => ({ ...p, description: e.target.value }))} rows={2} />
              </div>
              <div>
                <Label>Descrição detalhada (HTML)</Label>
                <Textarea value={editingCourse?.long_description || ''} onChange={(e) => setEditingCourse((p) => ({ ...p, long_description: e.target.value }))} rows={4} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Material</Label>
                  <Select value={editingCourse?.material_type_id || ''} onValueChange={(v) => setEditingCourse((p) => ({ ...p, material_type_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      {materialTypes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Assunto</Label>
                  <Select value={editingCourse?.subject_id || ''} onValueChange={(v) => setEditingCourse((p) => ({ ...p, subject_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      {subjects.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Thumbnail</Label>
                <div className="flex gap-2 items-center">
                  <Input type="file" accept="image/*" onChange={handleThumbnailUpload} disabled={uploading} />
                  {editingCourse?.thumbnail_url && <img src={editingCourse.thumbnail_url} alt="" className="w-16 h-10 object-cover rounded" />}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Instrutor(a)</Label>
                  <Input value={editingCourse?.instructor_name || ''} onChange={(e) => setEditingCourse((p) => ({ ...p, instructor_name: e.target.value }))} />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={editingCourse?.status || 'draft'} onValueChange={(v) => setEditingCourse((p) => ({ ...p, status: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="published">Publicado</SelectItem>
                      <SelectItem value="archived">Arquivado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Duração total (minutos)</Label>
                <Input type="number" value={editingCourse?.total_duration_minutes || 0} onChange={(e) => setEditingCourse((p) => ({ ...p, total_duration_minutes: Number(e.target.value) }))} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Switch checked={editingCourse?.is_free || false} onCheckedChange={(v) => setEditingCourse((p) => ({ ...p, is_free: v }))} />
                  <Label>Gratuito</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={editingCourse?.is_standalone_lesson || false} onCheckedChange={(v) => setEditingCourse((p) => ({ ...p, is_standalone_lesson: v }))} />
                  <Label>Aula Avulsa</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={editingCourse?.show_on_landing || false} onCheckedChange={(v) => setEditingCourse((p) => ({ ...p, show_on_landing: v }))} />
                  <Label>Exibir na Landing Page</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={editingCourse?.featured || false} onCheckedChange={(v) => setEditingCourse((p) => ({ ...p, featured: v }))} />
                  <Label>Destaque</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveCourse} disabled={createCourse.isPending || updateCourse.isPending}>
                {editingCourse?.id ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Lessons Panel */}
        {lessonsPanel && (
          <LessonsPanel courseId={lessonsPanel} onClose={() => setLessonsPanel(null)} />
        )}
      </Layout>
    </>
  );
};

// Subscribers Tab
const SubscribersTab = ({ statusFilter, onStatusFilterChange }: { statusFilter: string; onStatusFilterChange: (v: string) => void }) => {
  const { data: subscriptions, isLoading: subsLoading } = useAllAcademySubscriptions(statusFilter);
  const { data: students, isLoading: studentsLoading } = useAcademyStudents();

  const activeSubs = subscriptions?.filter(s => s.status === 'active').length || 0;
  const pendingSubs = subscriptions?.filter(s => s.status === 'pending').length || 0;
  const cancelledSubs = subscriptions?.filter(s => s.status === 'cancelled' || s.status === 'expired').length || 0;
  const totalStudents = students?.length || 0;

  // Determine which students are free (have role but no active subscription)
  const subUserIds = new Set(subscriptions?.filter(s => s.status === 'active').map(s => s.user_id) || []);

  return (
    <div className="space-y-6">
      {/* Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{totalStudents}</p>
              <p className="text-xs text-muted-foreground">Total Alunos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{activeSubs}</p>
              <p className="text-xs text-muted-foreground">Assinantes Ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-8 w-8 text-accent-foreground" />
            <div>
              <p className="text-2xl font-bold">{pendingSubs}</p>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <XCircle className="h-8 w-8 text-destructive" />
            <div>
              <p className="text-2xl font-bold">{cancelledSubs}</p>
              <p className="text-xs text-muted-foreground">Cancelados/Expirados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Assinaturas Academy</CardTitle>
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filtrar status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
                <SelectItem value="expired">Expiradas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {subsLoading ? (
            <p className="text-muted-foreground text-center py-8">Carregando...</p>
          ) : !subscriptions?.length ? (
            <p className="text-muted-foreground text-center py-8">Nenhuma assinatura encontrada.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ciclo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Asaas ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((sub) => {
                  const st = statusLabels[sub.status] || { label: sub.status, variant: 'outline' as const };
                  return (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">{sub.profiles?.full_name || '—'}</TableCell>
                      <TableCell>{sub.profiles?.email || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </TableCell>
                      <TableCell className="capitalize">{sub.billing_cycle || 'Mensal'}</TableCell>
                      <TableCell>R$ {(sub.price || 29.9).toFixed(2).replace('.', ',')}</TableCell>
                      <TableCell>{sub.started_at ? format(new Date(sub.started_at), 'dd/MM/yyyy') : '—'}</TableCell>
                      <TableCell>
                        {sub.asaas_subscription_id ? (
                          <a
                            href={`https://www.asaas.com/subscriptions/${sub.asaas_subscription_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline text-xs"
                          >
                            {sub.asaas_subscription_id.slice(0, 12)}...
                          </a>
                        ) : '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Alunos (role student)</CardTitle>
        </CardHeader>
        <CardContent>
          {studentsLoading ? (
            <p className="text-muted-foreground text-center py-8">Carregando...</p>
          ) : !students?.length ? (
            <p className="text-muted-foreground text-center py-8">Nenhum aluno registrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tipo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.user_id}>
                    <TableCell className="font-medium">{student.full_name || '—'}</TableCell>
                    <TableCell>{student.email || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={subUserIds.has(student.user_id) ? 'default' : 'outline'}>
                        {subUserIds.has(student.user_id) ? 'Assinante' : 'Gratuito'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Sub-component for managing lessons
const LessonsPanel = ({ courseId, onClose }: { courseId: string; onClose: () => void }) => {
  const { toast } = useToast();
  const { data: lessons, isLoading } = useAcademyLessons(courseId);
  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();
  const deleteLesson = useDeleteLesson();
  const { uploadFile, uploading } = useR2Storage();

  const [editing, setEditing] = useState<Partial<AcademyLesson> | null>(null);

  const handleSave = async () => {
    if (!editing?.title || !editing?.content_url) return;
    try {
      if (editing.id) {
        await updateLesson.mutateAsync({ id: editing.id, ...editing } as any);
      } else {
        await createLesson.mutateAsync({ ...editing, course_id: courseId } as any);
      }
      toast({ title: 'Aula salva!' });
      setEditing(null);
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file, 'academy-materials');
    if (url) {
      setEditing((p) => ({ ...p, content_url: url }));
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Aulas</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {isLoading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : !lessons?.length ? (
            <p className="text-muted-foreground text-center py-4">Nenhuma aula. Adicione a primeira!</p>
          ) : (
            lessons.map((lesson) => (
              <div key={lesson.id} className="flex items-center gap-3 p-3 border rounded-md">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{lesson.title}</p>
                  <p className="text-xs text-muted-foreground">{lesson.content_type} · {lesson.duration_minutes}min</p>
                </div>
                {lesson.is_free_preview && <Badge variant="outline" className="text-xs">Preview</Badge>}
                <Button variant="ghost" size="icon" onClick={() => setEditing(lesson)}><Pencil className="h-3 w-3" /></Button>
                <Button variant="ghost" size="icon" onClick={async () => {
                  if (confirm('Excluir esta aula?')) {
                    await deleteLesson.mutateAsync(lesson.id);
                    toast({ title: 'Aula excluída' });
                  }
                }}><Trash2 className="h-3 w-3 text-destructive" /></Button>
              </div>
            ))
          )}

          <Button variant="outline" className="w-full" onClick={() => setEditing({ title: '', content_type: 'youtube', content_url: '', display_order: (lessons?.length || 0) + 1 })}>
            <Plus className="h-4 w-4 mr-2" /> Adicionar Aula
          </Button>
        </div>

        {editing && (
          <div className="border-t pt-4 space-y-3">
            <h4 className="font-semibold">{editing.id ? 'Editar Aula' : 'Nova Aula'}</h4>
            <div>
              <Label>Título *</Label>
              <Input value={editing.title || ''} onChange={(e) => setEditing((p) => ({ ...p, title: e.target.value }))} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={editing.description || ''} onChange={(e) => setEditing((p) => ({ ...p, description: e.target.value }))} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Conteúdo</Label>
                <Select value={editing.content_type || 'youtube'} onValueChange={(v) => setEditing((p) => ({ ...p, content_type: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube">Vídeo YouTube</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="image">Imagem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Duração (min)</Label>
                <Input type="number" value={editing.duration_minutes || 0} onChange={(e) => setEditing((p) => ({ ...p, duration_minutes: Number(e.target.value) }))} />
              </div>
            </div>
            <div>
              <Label>{editing.content_type === 'youtube' ? 'URL ou ID do YouTube' : 'Arquivo'}</Label>
              {editing.content_type === 'youtube' ? (
                <Input value={editing.content_url || ''} onChange={(e) => setEditing((p) => ({ ...p, content_url: e.target.value }))} placeholder="https://youtube.com/watch?v=..." />
              ) : (
                <div className="space-y-2">
                  <Input type="file" accept={editing.content_type === 'pdf' ? '.pdf' : 'image/*'} onChange={handleFileUpload} disabled={uploading} />
                  {editing.content_url && <p className="text-xs text-muted-foreground truncate">{editing.content_url}</p>}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={editing.is_free_preview || false} onCheckedChange={(v) => setEditing((p) => ({ ...p, is_free_preview: v }))} />
              <Label>Preview gratuito</Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={createLesson.isPending || updateLesson.isPending}>Salvar Aula</Button>
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdminAcademy;
