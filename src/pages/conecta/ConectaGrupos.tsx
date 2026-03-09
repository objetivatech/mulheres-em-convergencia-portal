import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ConectaLayout } from '@/components/conecta/ConectaLayout';
import { useConectaGroups, useConectaGroupDetail, GroupType } from '@/hooks/useConectaGroups';
import { useConectaAccess } from '@/hooks/useConectaAccess';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Plus, Users, MessageSquare, Calendar, ExternalLink, ArrowLeft,
  Loader2, Trash2, Network, Video, GraduationCap, MessageCircle, Send, MapPin, Link2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TYPE_CONFIG: Record<GroupType, { label: string; icon: typeof Network; color: string }> = {
  networking: { label: 'Networking', icon: Network, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  encontro: { label: 'Encontro', icon: Video, color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  mentoria: { label: 'Mentoria', icon: GraduationCap, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
  whatsapp: { label: 'WhatsApp', icon: MessageCircle, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' },
};

export default function ConectaGrupos() {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  if (selectedGroupId) {
    return <GroupDetailView groupId={selectedGroupId} onBack={() => setSelectedGroupId(null)} />;
  }

  return <GroupListView onSelectGroup={setSelectedGroupId} />;
}

// === GROUP LIST VIEW ===
function GroupListView({ onSelectGroup }: { onSelectGroup: (id: string) => void }) {
  const { groups, isLoading, createGroup, joinGroup, leaveGroup, deleteGroup } = useConectaGroups();
  const { isMemberOrAbove, isAdmin } = useConectaAccess();
  const [showCreate, setShowCreate] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Create form state
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<GroupType>('networking');
  const [newCategory, setNewCategory] = useState('');
  const [newLink, setNewLink] = useState('');
  const [newMaxMembers, setNewMaxMembers] = useState('');
  const [newPrivate, setNewPrivate] = useState(false);

  const handleCreate = () => {
    createGroup.mutate({
      name: newName,
      description: newDesc || undefined,
      group_type: newType,
      category: newCategory || undefined,
      external_link: newLink || undefined,
      max_members: newMaxMembers ? parseInt(newMaxMembers) : undefined,
      is_private: newPrivate,
    }, {
      onSuccess: () => {
        setShowCreate(false);
        setNewName(''); setNewDesc(''); setNewCategory(''); setNewLink(''); setNewMaxMembers('');
      },
    });
  };

  const filtered = (groups || []).filter(g => {
    if (filterType !== 'all' && g.group_type !== filterType) return false;
    if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <ConectaLayout>
      <Helmet><title>Grupos | CONECTA+</title></Helmet>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Grupos</h1>
            <p className="text-sm text-muted-foreground">Participe de grupos temáticos para networking, mentoria e mais.</p>
          </div>
          {isMemberOrAbove && (
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" /> Criar Grupo</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Novo Grupo</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Nome *</Label>
                    <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome do grupo" />
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Descreva o grupo..." rows={3} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tipo</Label>
                      <Select value={newType} onValueChange={v => setNewType(v as GroupType)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Categoria</Label>
                      <Input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Ex: Marketing" />
                    </div>
                  </div>
                  {newType === 'whatsapp' && (
                    <div>
                      <Label>Link externo (WhatsApp/Telegram)</Label>
                      <Input value={newLink} onChange={e => setNewLink(e.target.value)} placeholder="https://chat.whatsapp.com/..." />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Máximo de membros</Label>
                      <Input type="number" value={newMaxMembers} onChange={e => setNewMaxMembers(e.target.value)} placeholder="Ilimitado" />
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <Switch checked={newPrivate} onCheckedChange={setNewPrivate} />
                      <Label>Grupo privado</Label>
                    </div>
                  </div>
                  <Button onClick={handleCreate} disabled={!newName || createGroup.isPending} className="w-full">
                    {createGroup.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Criar Grupo
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Buscar grupo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Group Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="text-center py-12 text-muted-foreground">Nenhum grupo encontrado.</CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map(group => {
              const config = TYPE_CONFIG[group.group_type];
              const Icon = config.icon;
              return (
                <Card key={group.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onSelectGroup(group.id)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${config.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{group.name}</CardTitle>
                          {group.category && <span className="text-xs text-muted-foreground">{group.category}</span>}
                        </div>
                      </div>
                      <Badge variant={group.is_private ? 'secondary' : 'outline'} className="text-xs">
                        {group.is_private ? 'Privado' : 'Aberto'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {group.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{group.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{group.member_count} {group.member_count === 1 ? 'membro' : 'membros'}</span>
                      </div>
                      {group.is_member ? (
                        <Badge variant="default" className="text-xs">Membro</Badge>
                      ) : (
                        <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); joinGroup.mutate(group.id); }}>
                          Participar
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </ConectaLayout>
  );
}

// === GROUP DETAIL VIEW ===
function GroupDetailView({ groupId, onBack }: { groupId: string; onBack: () => void }) {
  const { group, groupLoading, members, posts, meetings, createPost, createMeeting, deletePost } = useConectaGroupDetail(groupId);
  const { joinGroup, leaveGroup, deleteGroup } = useConectaGroups();
  const { user, isMemberOrAbove, isAdmin } = useConectaAccess();
  const [newPostContent, setNewPostContent] = useState('');
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDesc, setMeetingDesc] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [meetingLocation, setMeetingLocation] = useState('');

  const isMember = members?.some(m => m.user_id === user?.id);
  const isGroupAdmin = members?.some(m => m.user_id === user?.id && m.role === 'admin');

  if (groupLoading) {
    return (
      <ConectaLayout>
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      </ConectaLayout>
    );
  }

  if (!group) {
    return (
      <ConectaLayout>
        <div className="text-center py-12 text-muted-foreground">Grupo não encontrado.</div>
      </ConectaLayout>
    );
  }

  const config = TYPE_CONFIG[group.group_type as GroupType] || TYPE_CONFIG.networking;
  const Icon = config.icon;

  const handleCreateMeeting = () => {
    createMeeting.mutate({
      title: meetingTitle,
      description: meetingDesc || undefined,
      meeting_date: new Date(meetingDate).toISOString(),
      meeting_link: meetingLink || undefined,
      location: meetingLocation || undefined,
    }, {
      onSuccess: () => {
        setShowMeetingForm(false);
        setMeetingTitle(''); setMeetingDesc(''); setMeetingDate(''); setMeetingLink(''); setMeetingLocation('');
      },
    });
  };

  return (
    <ConectaLayout>
      <Helmet><title>{group.name} | Grupos | CONECTA+</title></Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <div className={`p-2 rounded-lg ${config.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">{group.name}</h1>
              <Badge variant={group.is_private ? 'secondary' : 'outline'}>{group.is_private ? 'Privado' : 'Aberto'}</Badge>
            </div>
            {group.description && <p className="text-sm text-muted-foreground ml-12">{group.description}</p>}
            {group.external_link && (
              <a href={group.external_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline ml-12 mt-1">
                <Link2 className="h-3 w-3" /> Link externo
              </a>
            )}
          </div>
          <div className="flex gap-2">
            {isMember ? (
              <Button variant="outline" size="sm" onClick={() => leaveGroup.mutate(groupId)}>Sair do Grupo</Button>
            ) : (
              <Button size="sm" onClick={() => joinGroup.mutate(groupId)}>Participar</Button>
            )}
            {(isGroupAdmin || isAdmin) && (
              <Button variant="destructive" size="sm" onClick={() => { deleteGroup.mutate(groupId); onBack(); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="feed">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="feed"><MessageSquare className="h-4 w-4 mr-1" /> Mural</TabsTrigger>
            <TabsTrigger value="members"><Users className="h-4 w-4 mr-1" /> Membros ({members?.length || 0})</TabsTrigger>
            <TabsTrigger value="meetings"><Calendar className="h-4 w-4 mr-1" /> Reuniões</TabsTrigger>
          </TabsList>

          {/* FEED TAB */}
          <TabsContent value="feed" className="space-y-4">
            {isMember && (
              <Card>
                <CardContent className="pt-4">
                  <Textarea
                    placeholder="Compartilhe algo com o grupo..."
                    value={newPostContent}
                    onChange={e => setNewPostContent(e.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-end mt-2">
                    <Button size="sm" disabled={!newPostContent.trim() || createPost.isPending}
                      onClick={() => { createPost.mutate(newPostContent.trim()); setNewPostContent(''); }}>
                      <Send className="h-4 w-4 mr-1" /> Publicar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {(posts || []).length === 0 ? (
              <Card><CardContent className="text-center py-8 text-muted-foreground">Nenhuma publicação ainda. Seja o primeiro!</CardContent></Card>
            ) : (
              (posts || []).map(post => (
                <Card key={post.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={post.author_avatar || undefined} />
                        <AvatarFallback>{(post.author_name || 'M')[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">{post.author_name}</span>
                          <div className="flex items-center gap-2">
                            {post.pinned && <Badge variant="secondary" className="text-xs">Fixado</Badge>}
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(post.created_at), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                            {(post.author_id === user?.id || isAdmin) && (
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deletePost.mutate(post.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">{post.content}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* MEMBERS TAB */}
          <TabsContent value="members">
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {(members || []).map(member => (
                    <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.profile?.avatar_url || undefined} />
                        <AvatarFallback>{(member.profile?.full_name || 'M')[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{member.profile?.full_name || 'Membro'}</p>
                        <p className="text-xs text-muted-foreground">
                          Desde {format(new Date(member.joined_at), 'dd/MM/yyyy')}
                        </p>
                      </div>
                      {member.role !== 'member' && (
                        <Badge variant="secondary" className="text-xs capitalize">{member.role}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MEETINGS TAB */}
          <TabsContent value="meetings" className="space-y-4">
            {isMember && (
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setShowMeetingForm(!showMeetingForm)}>
                  <Plus className="h-4 w-4 mr-1" /> Agendar Reunião
                </Button>
              </div>
            )}

            {showMeetingForm && (
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <div><Label>Título *</Label><Input value={meetingTitle} onChange={e => setMeetingTitle(e.target.value)} /></div>
                  <div><Label>Descrição</Label><Textarea value={meetingDesc} onChange={e => setMeetingDesc(e.target.value)} rows={2} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Data/Hora *</Label><Input type="datetime-local" value={meetingDate} onChange={e => setMeetingDate(e.target.value)} /></div>
                    <div><Label>Link da reunião</Label><Input value={meetingLink} onChange={e => setMeetingLink(e.target.value)} placeholder="https://meet.google.com/..." /></div>
                  </div>
                  <div><Label>Local</Label><Input value={meetingLocation} onChange={e => setMeetingLocation(e.target.value)} placeholder="Presencial ou online" /></div>
                  <Button onClick={handleCreateMeeting} disabled={!meetingTitle || !meetingDate || createMeeting.isPending}>
                    {createMeeting.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                    Agendar
                  </Button>
                </CardContent>
              </Card>
            )}

            {(meetings || []).length === 0 ? (
              <Card><CardContent className="text-center py-8 text-muted-foreground">Nenhuma reunião agendada.</CardContent></Card>
            ) : (
              (meetings || []).map(meeting => (
                <Card key={meeting.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{meeting.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(meeting.meeting_date), "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </p>
                        {meeting.description && <p className="text-sm text-muted-foreground mt-1">{meeting.description}</p>}
                        <div className="flex gap-3 mt-2">
                          {meeting.meeting_link && (
                            <a href={meeting.meeting_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                              <ExternalLink className="h-3 w-3" /> Entrar na reunião
                            </a>
                          )}
                          {meeting.location && (
                            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" /> {meeting.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ConectaLayout>
  );
}
