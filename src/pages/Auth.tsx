
import { useState, useRef } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Mail, Lock, User, CreditCard } from 'lucide-react';

const Auth = () => {
  const { user, loading, signIn, signUp } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const formStartRef = useRef<number>(Date.now());
  const [error, setError] = useState<string | null>(null);

  const MIN_SUBMIT_TIME_MS = 1200;
  const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutos
  const MAX_SIGNIN_ATTEMPTS = 10;
  const MAX_SIGNUP_ATTEMPTS = 5;

  const getAttempts = (key: string): number[] => {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
  };
  const saveAttempts = (key: string, attempts: number[]) => {
    try { localStorage.setItem(key, JSON.stringify(attempts)); } catch {}
  };
  const recordAttempt = (key: string) => {
    const now = Date.now();
    const attempts = getAttempts(key).filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
    attempts.push(now);
    saveAttempts(key, attempts);
  };
  const canAttempt = (key: string, max: number) => {
    const now = Date.now();
    const attempts = getAttempts(key).filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
    if (attempts.length >= max) {
      const oldest = Math.min(...attempts);
      const retryAfterMs = RATE_LIMIT_WINDOW_MS - (now - oldest);
      return { ok: false, retryAfterMs };
    }
    return { ok: true, retryAfterMs: 0 };
  };

  // Redirect if already authenticated
  if (user && !loading) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = (formData.get('email') as string)?.trim();
    const password = (formData.get('password') as string) || '';
    const honeypot = (formData.get('website') as string) || '';

    // Honeypot
    if (honeypot) {
      setError('Ação bloqueada.');
      setIsSubmitting(false);
      return;
    }
    // Tempo mínimo de preenchimento
    if (Date.now() - formStartRef.current < MIN_SUBMIT_TIME_MS) {
      setError('Envio muito rápido. Tente novamente.');
      setIsSubmitting(false);
      return;
    }
    // Rate limiting por dispositivo
    const rl = canAttempt('auth:signin', MAX_SIGNIN_ATTEMPTS);
    if (!rl.ok) {
      setError(`Muitas tentativas. Tente novamente em ${Math.ceil(rl.retryAfterMs / 1000)}s.`);
      setIsSubmitting(false);
      return;
    }

    recordAttempt('auth:signin');

    try {
      await signIn(email, password);
      // Sucesso: zera tentativas
      saveAttempts('auth:signin', []);
    } catch (err: any) {
      setError(err?.message || 'Falha ao entrar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const email = (formData.get('email') as string)?.trim();
    const password = (formData.get('password') as string) || '';
    const fullName = (formData.get('fullName') as string)?.trim();
    const cpf = (formData.get('cpf') as string)?.trim();
    const honeypot = (formData.get('website') as string) || '';

    // Honeypot
    if (honeypot) {
      setError('Ação bloqueada.');
      setIsSubmitting(false);
      return;
    }
    // Tempo mínimo de preenchimento
    if (Date.now() - formStartRef.current < MIN_SUBMIT_TIME_MS) {
      setError('Envio muito rápido. Tente novamente.');
      setIsSubmitting(false);
      return;
    }
    // Regras simples
    if (password.length < 6) {
      setError('A senha deve ter ao menos 6 caracteres.');
      setIsSubmitting(false);
      return;
    }
    if (!cpf || cpf.length < 11) {
      setError('CPF é obrigatório e deve ter 11 dígitos.');
      setIsSubmitting(false);
      return;
    }
    // Rate limiting
    const rl = canAttempt('auth:signup', MAX_SIGNUP_ATTEMPTS);
    if (!rl.ok) {
      setError(`Muitas tentativas. Tente novamente em ${Math.ceil(rl.retryAfterMs / 1000)}s.`);
      setIsSubmitting(false);
      return;
    }

    recordAttempt('auth:signup');

    try {
      await signUp(email, password, fullName, cpf);
      saveAttempts('auth:signup', []);
    } catch (err: any) {
      setError(err?.message || 'Falha ao cadastrar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
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
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-secondary mb-2">
              Mulheres em Convergência
            </h1>
            <p className="text-muted-foreground">
              Entre na sua conta ou crie uma nova
            </p>
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <Card>
                <CardHeader>
                  <CardTitle>Entrar na sua conta</CardTitle>
                  <CardDescription>
                    Digite seu email e senha para acessar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signin-email"
                          name="email"
                          type="email"
                          required
                          className="pl-10"
                          placeholder="seu@email.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signin-password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          required
                          autoComplete="current-password"
                          className="pl-10 pr-10"
                          placeholder="Sua senha"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="text-right">
                      <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                        Esqueceu a senha?
                      </Link>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Entrando...' : 'Entrar'}
                    </Button>
                    {error && <p className="text-sm text-destructive mt-2">{error}</p>}
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signup">
              <Card>
                <CardHeader>
                  <CardTitle>Criar nova conta</CardTitle>
                  <CardDescription>
                    Preencha os dados para se cadastrar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Nome completo</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-name"
                          name="fullName"
                          type="text"
                          required
                          className="pl-10"
                          placeholder="Seu nome completo"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-cpf">CPF *</Label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-cpf"
                          name="cpf"
                          type="text"
                          required
                          className="pl-10"
                          placeholder="000.000.000-00"
                          maxLength={14}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            const formatted = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                            e.target.value = formatted;
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          name="email"
                          type="email"
                          required
                          className="pl-10"
                          placeholder="seu@email.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          required
                          minLength={6}
                          autoComplete="new-password"
                          className="pl-10 pr-10"
                          placeholder="Mínimo 6 caracteres"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
                    </Button>
                    {error && <p className="text-sm text-destructive mt-2">{error}</p>}
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Auth;
