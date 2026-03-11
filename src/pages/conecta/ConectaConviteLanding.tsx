import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ConectaConviteLanding() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invitation, setInvitation] = useState<any>(null);
  const [inviterName, setInviterName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    const fetchInvitation = async () => {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('conecta_invitations')
        .select('*')
        .eq('code', code)
        .maybeSingle();

      if (fetchError || !data) {
        setError('Convite não encontrado ou inválido.');
        setLoading(false);
        return;
      }

      if (data.status === 'accepted') {
        setError('Este convite já foi aceito.');
        setLoading(false);
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        setError('Este convite expirou.');
        setLoading(false);
        return;
      }

      setInvitation(data);

      // Fetch inviter name
      const { data: inviter } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', data.invited_by)
        .single();
      if (inviter) setInviterName(inviter.full_name || 'Uma membro');

      setLoading(false);
    };
    fetchInvitation();
  }, [code]);

  const handleAccept = async () => {
    if (!user || !invitation) return;
    setAccepting(true);
    try {
      const { error: updateError } = await supabase
        .from('conecta_invitations')
        .update({
          accepted_by: user.id,
          accepted_at: new Date().toISOString(),
          status: 'accepted',
        })
        .eq('id', invitation.id);

      if (updateError) throw updateError;

      // Notify inviter
      try {
        await supabase.functions.invoke('send-conecta-email', {
          body: {
            action: 'guest_registered',
            inviter_id: invitation.invited_by,
            guest_name: user.user_metadata?.full_name || user.email,
          },
        });
      } catch {}

      toast.success('Convite aceito! Bem-vinda ao CONECTA+');
      navigate('/conecta');
    } catch {
      toast.error('Erro ao aceitar convite');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Helmet><title>Convite CONECTA+ | Mulheres em Convergência</title></Helmet>
        <div className="container mx-auto px-4 py-16 max-w-lg text-center">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold mb-2">Convite Indisponível</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => navigate('/')}>Ir para o Portal</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Helmet>
        <title>Convite CONECTA+ | Mulheres em Convergência</title>
        <meta name="description" content="Você foi convidada para o CONECTA+, a comunidade de networking do Mulheres em Convergência." />
      </Helmet>

      <div className="container mx-auto px-4 py-12 max-w-lg">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 p-8 text-center text-primary-foreground">
            <Users className="h-12 w-12 mx-auto mb-3" />
            <h1 className="text-2xl font-bold mb-1">CONECTA+</h1>
            <p className="text-primary-foreground/80 text-sm">Comunidade de Networking</p>
          </div>

          <CardContent className="p-6 space-y-6">
            <div className="text-center">
              <Sparkles className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h2 className="text-xl font-semibold mb-2">Você foi convidada!</h2>
              <p className="text-muted-foreground">
                <strong className="text-foreground">{inviterName}</strong> convidou{' '}
                {invitation.name ? <strong className="text-foreground">{invitation.name}</strong> : 'você'}{' '}
                para conhecer o CONECTA+.
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
              <h3 className="font-semibold text-foreground">Como convidada, você terá acesso a:</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>✅ Perfil na comunidade de networking</li>
                <li>✅ Diretório de membros</li>
                <li>✅ Conteúdos gratuitos e aulas selecionadas</li>
                <li>✅ Participação em 1 evento online</li>
              </ul>
            </div>

            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Código do convite</p>
              <Badge variant="outline" className="text-lg font-mono px-4 py-1">{invitation.code}</Badge>
            </div>

            {user ? (
              <Button className="w-full" size="lg" onClick={handleAccept} disabled={accepting}>
                {accepting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Aceitando...</>
                ) : (
                  <><CheckCircle className="h-4 w-4 mr-2" /> Aceitar Convite e Entrar</>
                )}
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-center text-muted-foreground">
                  Para aceitar o convite, faça login ou cadastre-se:
                </p>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => navigate(`/entrar?redirect=/conecta/convite/${code}`)}
                >
                  Entrar ou Cadastrar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
