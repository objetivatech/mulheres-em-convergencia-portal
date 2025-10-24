import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const ConfirmEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    const confirmEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Token de confirmação não encontrado na URL.');
        return;
      }

      try {
        console.log('Confirming email with token:', token.substring(0, 10) + '...');

        const { data, error } = await supabase.functions.invoke('confirm-email-token', {
          body: { token }
        });

        if (error) {
          console.error('Error confirming email:', error);
          setStatus('error');
          setMessage(error.message || 'Falha ao confirmar email. Tente novamente.');
          return;
        }

        if (data?.success) {
          setStatus('success');
          setMessage(data.message || 'Email confirmado com sucesso!');
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/entrar');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data?.error || 'Falha ao confirmar email.');
        }
      } catch (error: any) {
        console.error('Unexpected error:', error);
        setStatus('error');
        setMessage('Erro ao processar confirmação. Tente novamente.');
      }
    };

    confirmEmail();
  }, [token, navigate]);

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                {status === 'loading' && (
                  <Loader2 className="h-16 w-16 text-primary animate-spin mx-auto" />
                )}
                {status === 'success' && (
                  <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
                )}
                {status === 'error' && (
                  <XCircle className="h-16 w-16 text-destructive mx-auto" />
                )}
              </div>
              <CardTitle className="text-2xl">
                {status === 'loading' && 'Confirmando seu email...'}
                {status === 'success' && 'Email Confirmado!'}
                {status === 'error' && 'Erro na Confirmação'}
              </CardTitle>
              <CardDescription>
                {status === 'loading' && 'Por favor, aguarde enquanto confirmamos seu email.'}
                {status === 'success' && 'Você será redirecionado para a página de login.'}
                {status === 'error' && 'Não foi possível confirmar seu email.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  {message}
                </p>

                {status === 'success' && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Sua conta está ativa! Você já pode fazer login.
                    </p>
                    <Button 
                      onClick={() => navigate('/auth')} 
                      className="w-full"
                    >
                      Ir para Login
                    </Button>
                  </div>
                )}

                {status === 'error' && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Possíveis causas:
                    </p>
                    <ul className="text-sm text-muted-foreground text-left list-disc list-inside space-y-1">
                      <li>O link expirou (válido por 24 horas)</li>
                      <li>O link já foi usado anteriormente</li>
                      <li>O token está incorreto ou inválido</li>
                    </ul>
                    <div className="pt-4 space-y-2">
                      <Button 
                        onClick={() => navigate('/auth')} 
                        className="w-full"
                        variant="outline"
                      >
                        Voltar para Login
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Se precisar de um novo link, entre em contato com o suporte.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ConfirmEmail;

