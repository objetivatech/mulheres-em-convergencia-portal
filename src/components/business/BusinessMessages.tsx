import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Mail, MessageCircle, Reply, Clock, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Message {
  id: string;
  sender_name: string;
  sender_email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  business_message_replies: Reply[];
}

interface Reply {
  id: string;
  sender_name: string;
  sender_email: string;
  reply_text: string;
  is_business_owner: boolean;
  created_at: string;
}

interface BusinessMessagesProps {
  businessId: string;
}

const BusinessMessages: React.FC<BusinessMessagesProps> = ({ businessId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState<{ [key: string]: boolean }>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
  }, [businessId]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('business_messages')
        .select(`
          *,
          business_message_replies (
            id,
            sender_name,
            sender_email,
            reply_text,
            is_business_owner,
            created_at
          )
        `)
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar mensagens',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('business_messages')
        .update({ status: 'read' })
        .eq('id', messageId);

      if (error) throw error;
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, status: 'read' } : msg
        )
      );
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const handleReply = async (messageId: string) => {
    if (!replyText[messageId]?.trim()) return;

    setSubmitting(prev => ({ ...prev, [messageId]: true }));

    try {
      const { error } = await supabase
        .from('business_message_replies')
        .insert({
          message_id: messageId,
          sender_name: 'Proprietário da Empresa',
          sender_email: 'business@owner.com', // This should come from user profile
          reply_text: replyText[messageId].trim(),
          is_business_owner: true
        });

      if (error) throw error;

      toast({
        title: 'Resposta enviada!',
        description: 'Sua resposta foi enviada com sucesso.'
      });

      setReplyText(prev => ({ ...prev, [messageId]: '' }));
      fetchMessages(); // Refresh messages

    } catch (error: any) {
      console.error('Erro ao enviar resposta:', error);
      toast({
        title: 'Erro ao enviar resposta',
        description: error.message || 'Tente novamente em alguns instantes.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(prev => ({ ...prev, [messageId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando mensagens...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma mensagem ainda</h3>
          <p className="text-muted-foreground">
            Quando clientes enviarem mensagens para sua empresa, elas aparecerão aqui.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {messages.map((message) => (
        <Card key={message.id} className={message.status === 'unread' ? 'border-primary/20 bg-primary/5' : ''}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-4 w-4" />
                  {message.sender_name}
                  {message.status === 'unread' && (
                    <Badge variant="secondary" className="ml-2">Nova</Badge>
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{message.sender_email}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(message.created_at), { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}
                </div>
              </div>
              {message.status === 'unread' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => markAsRead(message.id)}
                >
                  Marcar como lida
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Assunto: {message.subject}</h4>
              <p className="text-muted-foreground whitespace-pre-wrap">{message.message}</p>
            </div>

            {/* Replies */}
            {message.business_message_replies && message.business_message_replies.length > 0 && (
              <div className="space-y-3">
                <Separator />
                <h5 className="font-medium flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Conversação
                </h5>
                
                {message.business_message_replies
                  .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                  .map((reply) => (
                    <div 
                      key={reply.id} 
                      className={`p-3 rounded-lg ${
                        reply.is_business_owner 
                          ? 'bg-primary/10 border border-primary/20' 
                          : 'bg-muted'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          {reply.is_business_owner ? 'Você' : reply.sender_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(reply.created_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{reply.reply_text}</p>
                    </div>
                  ))}
              </div>
            )}

            {/* Reply Form */}
            <div className="space-y-3">
              <Separator />
              <div>
                <label className="block text-sm font-medium mb-2">
                  Sua resposta
                </label>
                <Textarea
                  value={replyText[message.id] || ''}
                  onChange={(e) => setReplyText(prev => ({ 
                    ...prev, 
                    [message.id]: e.target.value 
                  }))}
                  placeholder="Digite sua resposta..."
                  rows={3}
                />
              </div>
              <Button 
                onClick={() => handleReply(message.id)}
                disabled={!replyText[message.id]?.trim() || submitting[message.id]}
                size="sm"
              >
                <Reply className="h-4 w-4 mr-2" />
                {submitting[message.id] ? 'Enviando...' : 'Responder'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default BusinessMessages;