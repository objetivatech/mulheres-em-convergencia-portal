import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, AlertTriangle, Loader2, Mail } from 'lucide-react';

type State = 'idle' | 'loading' | 'success' | 'error';

const ConfirmarTrocaEmailPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');

  const [state, setState] = useState<State>('idle');
  const [message, setMessage] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');

  const confirm = async () => {
    if (!token) return;
    setState('loading');
    try {
      const { data, error } = await supabase.functions.invoke('confirm-email-change', {
        body: { token },
      });
      if (error) throw error;
      const payload = data as any;
      if (payload?.error) throw new Error(payload.error);

      setNewEmail(payload?.new_email || '');
      setMessage(payload?.message || 'Email atualizado com sucesso.');
      setState('success');
      // Force logout to require re-login with new email
      await supabase.auth.signOut();
    } catch (err: any) {
      setMessage(err?.message || 'Não foi possível confirmar a troca.');
      setState('error');
    }
  };

  return (
    <Layout>
      <Helmet>
        <title>Confirmar troca de email - Mulheres em Convergência</title>
      </Helmet>
      <div className="container mx-auto px-4 py-12 max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" /> Confirmar troca de email
            </CardTitle>
            <CardDescription>
              Confirme abaixo para concluir a alteração do email da sua conta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!token && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>Link inválido. Solicite uma nova troca de email pelo seu painel.</AlertDescription>
              </Alert>
            )}

            {token && state === 'idle' && (
              <>
                <p className="text-sm text-muted-foreground">
                  Ao confirmar, seu email de acesso será alterado e você precisará fazer login novamente com o novo endereço.
                </p>
                <Button onClick={confirm} className="w-full">Confirmar nova alteração</Button>
              </>
            )}

            {state === 'loading' && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {state === 'success' && (
              <>
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
                {newEmail && (
                  <p className="text-sm text-muted-foreground">
                    Novo email: <strong>{newEmail}</strong>
                  </p>
                )}
                <Button onClick={() => navigate('/auth')} className="w-full">Ir para o login</Button>
              </>
            )}

            {state === 'error' && (
              <>
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/painel">Voltar ao painel</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ConfirmarTrocaEmailPage;