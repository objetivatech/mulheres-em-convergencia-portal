import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AdminBackButton } from '@/components/admin/AdminBackButton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Mail,
  MailOpen,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Calendar,
  User,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  created_at: string;
  updated_at: string;
}

const AdminContactMessages = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sending, setSending] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (!user || !isAdmin) {
      navigate('/');
    }
  }, [user, isAdmin, navigate]);

  // Load messages
  const loadMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMessages((data || []) as ContactMessage[]);
      setFilteredMessages((data || []) as ContactMessage[]);
    } catch (error: any) {
      console.error('Error loading messages:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  // Filter messages
  useEffect(() => {
    let filtered = messages;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((msg) => msg.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (msg) =>
          msg.name.toLowerCase().includes(query) ||
          msg.email.toLowerCase().includes(query) ||
          msg.subject.toLowerCase().includes(query) ||
          msg.message.toLowerCase().includes(query)
      );
    }

    setFilteredMessages(filtered);
  }, [messages, statusFilter, searchQuery]);

  // Mark as read
  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ status: 'read', updated_at: new Date().toISOString() })
        .eq('id', messageId);

      if (error) throw error;

      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, status: 'read' } : msg))
      );
      toast.success('Mensagem marcada como lida');
    } catch (error: any) {
      console.error('Error marking as read:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  // Update status
  const updateStatus = async (messageId: string, newStatus: ContactMessage['status']) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', messageId);

      if (error) throw error;

      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, status: newStatus } : msg))
      );
      toast.success('Status atualizado');
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  // Delete message
  const deleteMessage = async (messageId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta mensagem?')) return;

    try {
      const { error } = await supabase.from('contact_messages').delete().eq('id', messageId);

      if (error) throw error;

      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      toast.success('Mensagem excluída');
      setShowDetailDialog(false);
    } catch (error: any) {
      console.error('Error deleting message:', error);
      toast.error('Erro ao excluir mensagem');
    }
  };

  // Open detail dialog
  const openDetailDialog = (message: ContactMessage) => {
    setSelectedMessage(message);
    setShowDetailDialog(true);
    if (message.status === 'new') {
      markAsRead(message.id);
    }
  };

  // Open reply dialog
  const openReplyDialog = (message: ContactMessage) => {
    setSelectedMessage(message);
    setReplyText(`Olá ${message.name},\n\nObrigada por entrar em contato!\n\n`);
    setShowReplyDialog(true);
  };

  // Send reply via MailRelay
  const sendReply = async () => {
    if (!selectedMessage) return;

    try {
      setSending(true);

      const { data, error } = await supabase.functions.invoke('reply-contact-message', {
        body: {
          message_id: selectedMessage.id,
          reply_text: replyText,
        }
      });

      if (error) {
        console.error('Error sending reply:', error);
        toast.error('Erro ao enviar resposta. Tente novamente.');
        return;
      }

      if (data?.success) {
        toast.success('Resposta enviada com sucesso!');
        setShowReplyDialog(false);
        setReplyText('');
        setSelectedMessage(null);
        // Refresh messages list
        loadMessages();
      } else {
        toast.error(data?.error || 'Falha ao enviar resposta.');
      }
    } catch (error: any) {
      console.error('Unexpected error:', error);
      toast.error('Erro ao processar resposta. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status: ContactMessage['status']) => {
    const statusConfig = {
      new: { label: 'Nova', variant: 'default' as const, icon: AlertCircle },
      read: { label: 'Lida', variant: 'secondary' as const, icon: MailOpen },
      replied: { label: 'Respondida', variant: 'default' as const, icon: CheckCircle2 },
      archived: { label: 'Arquivada', variant: 'outline' as const, icon: Mail },
    };

    const config = statusConfig[status] || statusConfig.new;
    const Icon = config?.icon || AlertCircle;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Get stats
  const stats = {
    total: messages.length,
    new: messages.filter((m) => m.status === 'new').length,
    read: messages.filter((m) => m.status === 'read').length,
    replied: messages.filter((m) => m.status === 'replied').length,
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <AdminBackButton label="Voltar ao Admin" />
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Mensagens de Contato</h1>
          <p className="text-muted-foreground">
            Visualize e responda as mensagens recebidas pelo formulário de contato
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Novas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.new}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Lidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.read}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Respondidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.replied}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, email, assunto ou mensagem..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="new">Novas</SelectItem>
                    <SelectItem value="read">Lidas</SelectItem>
                    <SelectItem value="replied">Respondidas</SelectItem>
                    <SelectItem value="archived">Arquivadas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={loadMessages}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Messages List */}
        {filteredMessages.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all'
                  ? 'Nenhuma mensagem encontrada com os filtros aplicados'
                  : 'Nenhuma mensagem recebida ainda'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredMessages.map((message) => (
              <Card
                key={message.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  message.status === 'new' ? 'border-primary border-2' : ''
                }`}
                onClick={() => openDetailDialog(message)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg truncate">{message.subject}</h3>
                        {getStatusBadge(message.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{message.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          <span>{message.email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(message.created_at).toLocaleString('pt-BR')}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {message.message}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openReplyDialog(message);
                      }}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Responder
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {selectedMessage && (
              <>
                <DialogHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <DialogTitle className="text-xl mb-2">
                        {selectedMessage.subject}
                      </DialogTitle>
                      <div className="flex items-center gap-2 mb-4">
                        {getStatusBadge(selectedMessage.status)}
                      </div>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{selectedMessage.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`mailto:${selectedMessage.email}`}
                        className="text-primary hover:underline"
                      >
                        {selectedMessage.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(selectedMessage.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Mensagem
                    </h4>
                    <div className="bg-background border rounded-lg p-4">
                      <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
                    </div>
                  </div>

                  <div>
                    <label className="font-medium mb-2 block">Status</label>
                    <Select
                      value={selectedMessage.status}
                      onValueChange={(value) =>
                        updateStatus(selectedMessage.id, value as ContactMessage['status'])
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Nova</SelectItem>
                        <SelectItem value="read">Lida</SelectItem>
                        <SelectItem value="replied">Respondida</SelectItem>
                        <SelectItem value="archived">Arquivada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    onClick={() => deleteMessage(selectedMessage.id)}
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                  <Button
                    onClick={() => {
                      setShowDetailDialog(false);
                      openReplyDialog(selectedMessage);
                    }}
                    className="w-full sm:w-auto"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Responder
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Reply Dialog */}
        <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
          <DialogContent className="max-w-2xl">
            {selectedMessage && (
              <>
                <DialogHeader>
                  <DialogTitle>Responder Mensagem</DialogTitle>
                  <DialogDescription>
                    Responder para {selectedMessage.name} ({selectedMessage.email})
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <label className="font-medium mb-2 block">Sua resposta</label>
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={10}
                      placeholder="Digite sua resposta aqui..."
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowReplyDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={sendReply}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir no Cliente de Email
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default AdminContactMessages;

