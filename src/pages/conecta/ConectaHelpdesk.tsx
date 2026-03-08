import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ConectaLayout } from '@/components/conecta/ConectaLayout';
import { useConectaHelpdesk, useConectaHelpdeskReplies, HELPDESK_CATEGORIES, HelpdeskPost } from '@/hooks/useConectaHelpdesk';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Plus, LayoutGrid, List, MessageCircle, CheckCircle2, Send, ArrowLeft, Trash2, Lightbulb } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; color: string }> = {
  aberto: { label: 'Aberto', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  em_discussao: { label: 'Em Discussão', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  resolvido: { label: 'Resolvido', color: 'bg-green-100 text-green-700 border-green-300' },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  baixa: { label: 'Baixa', color: 'text-muted-foreground' },
  media: { label: 'Média', color: 'text-amber-600' },
  alta: { label: 'Alta', color: 'text-red-600' },
};

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

function PostCard({ post, onClick }: { post: HelpdeskPost; onClick: () => void }) {
  const status = statusConfig[post.status] || statusConfig.aberto;
  const priority = priorityConfig[post.priority] || priorityConfig.media;
  const category = HELPDESK_CATEGORIES.find(c => c.value === post.category);

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-medium text-sm line-clamp-2">{post.title}</h3>
          <Badge variant="outline" className={cn('text-[10px] shrink-0 border', status.color)}>{status.label}</Badge>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{post.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={post.user?.avatar_url || ''} />
              <AvatarFallback className="text-[8px]">{getInitials(post.user?.full_name || 'M')}</AvatarFallback>
            </Avatar>
            <span className="text-[11px] text-muted-foreground truncate max-w-[100px]">{post.user?.full_name}</span>
          </div>
          <div className="flex items-center gap-2">
            {category && <Badge variant="secondary" className="text-[10px]">{category.label}</Badge>}
            <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
              <MessageCircle className="h-3 w-3" />{post.reply_count}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PostDetail({ post, onBack }: { post: HelpdeskPost; onBack: () => void }) {
  const { user } = useAuth();
  const { replies, isLoading, createReply, markAsSolution } = useConectaHelpdeskReplies(post.id);
  const { updatePostStatus, deletePost } = useConectaHelpdesk();
  const [replyContent, setReplyContent] = useState('');
  const isAuthor = user?.id === post.user_id;
  const status = statusConfig[post.status] || statusConfig.aberto;

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    await createReply.mutateAsync({ post_id: post.id, content: replyContent });
    setReplyContent('');
  };

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
        <ArrowLeft className="h-4 w-4" />Voltar
      </Button>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg">{post.title}</CardTitle>
            <Badge variant="outline" className={cn('border', status.color)}>{status.label}</Badge>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={post.user?.avatar_url || ''} />
              <AvatarFallback className="text-[9px]">{getInitials(post.user?.full_name || 'M')}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">{post.user?.full_name}</span>
            <span className="text-xs text-muted-foreground">• {format(new Date(post.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{post.description}</p>
          {isAuthor && (
            <div className="flex gap-2 mt-4 pt-4 border-t border-border">
              {post.status !== 'resolvido' && (
                <Button size="sm" variant="outline" onClick={() => updatePostStatus.mutate({ id: post.id, status: 'resolvido' })} className="gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />Marcar Resolvido
                </Button>
              )}
              <Button size="sm" variant="ghost" className="text-destructive gap-1" onClick={() => { deletePost.mutate(post.id); onBack(); }}>
                <Trash2 className="h-3.5 w-3.5" />Excluir
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <h3 className="font-semibold text-sm flex items-center gap-2">
        <MessageCircle className="h-4 w-4" />Respostas ({replies?.length || 0})
      </h3>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-3">
          {replies?.map(reply => (
            <Card key={reply.id} className={cn(reply.is_solution && 'border-green-400 bg-green-50/50')}>
              <CardContent className="p-3">
                {reply.is_solution && (
                  <div className="flex items-center gap-1 text-green-700 text-xs font-medium mb-2">
                    <CheckCircle2 className="h-3.5 w-3.5" />Solução aceita
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={reply.user?.avatar_url || ''} />
                    <AvatarFallback className="text-[8px]">{getInitials(reply.user?.full_name || 'M')}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium">{reply.user?.full_name}</span>
                  <span className="text-[10px] text-muted-foreground">{format(new Date(reply.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
                {isAuthor && !reply.is_solution && post.status !== 'resolvido' && (
                  <Button size="sm" variant="ghost" className="mt-2 text-xs gap-1 text-green-700" onClick={() => markAsSolution.mutate(reply.id)}>
                    <Lightbulb className="h-3 w-3" />Marcar como solução
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {post.status !== 'resolvido' && (
        <form onSubmit={handleReply} className="flex gap-2">
          <Input
            value={replyContent}
            onChange={e => setReplyContent(e.target.value)}
            placeholder="Sua contribuição..."
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={createReply.isPending || !replyContent.trim()}>
            {createReply.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      )}
    </div>
  );
}

export default function ConectaHelpdesk() {
  const { posts, isLoading, createPost } = useConectaHelpdesk();
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [selectedPost, setSelectedPost] = useState<HelpdeskPost | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'geral', priority: 'media' });
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    await createPost.mutateAsync(form);
    setCreateOpen(false);
    setForm({ title: '', description: '', category: 'geral', priority: 'media' });
  };

  const filtered = filterCategory === 'all' ? posts : posts?.filter(p => p.category === filterCategory);

  if (selectedPost) {
    const freshPost = posts?.find(p => p.id === selectedPost.id) || selectedPost;
    return (
      <ConectaLayout requireMember>
        <Helmet><title>Conselho 24/7 | CONECTA+</title></Helmet>
        <PostDetail post={freshPost} onBack={() => setSelectedPost(null)} />
      </ConectaLayout>
    );
  }

  const kanbanColumns = [
    { key: 'aberto', label: 'Aberto', icon: '🔵' },
    { key: 'em_discussao', label: 'Em Discussão', icon: '🟡' },
    { key: 'resolvido', label: 'Resolvido', icon: '🟢' },
  ];

  return (
    <ConectaLayout requireMember>
      <Helmet><title>Conselho 24/7 | CONECTA+</title></Helmet>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-primary" />Conselho 24/7
            </h1>
            <p className="text-muted-foreground text-sm">Compartilhe desafios e receba ajuda da comunidade</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {HELPDESK_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex border border-border rounded-md">
              <Button variant={view === 'kanban' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setView('kanban')}>
                <LayoutGrid className="h-3.5 w-3.5" />
              </Button>
              <Button variant={view === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setView('list')}>
                <List className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Novo Desafio</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Publicar Desafio</DialogTitle></DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2"><Label>Título</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required maxLength={120} /></div>
                  <div className="space-y-2"><Label>Descrição do desafio</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} required maxLength={2000} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{HELPDESK_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Prioridade</Label>
                      <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="baixa">Baixa</SelectItem>
                          <SelectItem value="media">Média</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={createPost.isPending}>
                    {createPost.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Publicar
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : view === 'kanban' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {kanbanColumns.map(col => {
              const colPosts = filtered?.filter(p => p.status === col.key) || [];
              return (
                <div key={col.key} className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <span>{col.icon}</span>
                    <h3 className="text-sm font-semibold">{col.label}</h3>
                    <Badge variant="secondary" className="text-[10px]">{colPosts.length}</Badge>
                  </div>
                  <ScrollArea className="max-h-[60vh]">
                    <div className="space-y-2 pr-1">
                      {colPosts.map(post => (
                        <PostCard key={post.id} post={post} onClick={() => setSelectedPost(post)} />
                      ))}
                      {!colPosts.length && (
                        <div className="text-center py-6 text-xs text-muted-foreground border border-dashed rounded-lg">
                          Nenhum desafio
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {!filtered?.length ? (
              <div className="text-center py-12 text-muted-foreground">
                <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum desafio publicado</p>
              </div>
            ) : filtered.map(post => (
              <PostCard key={post.id} post={post} onClick={() => setSelectedPost(post)} />
            ))}
          </div>
        )}
      </div>
    </ConectaLayout>
  );
}
