
import { useState, useRef } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';

const Auth = () => {
  const { user, loading, signIn, signUp } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>('');
  const signInCaptchaRef = useRef<HCaptcha>(null);
  const signUpCaptchaRef = useRef<HCaptcha>(null);
  
  // hCaptcha site key - production only
  const HCAPTCHA_SITE_KEY = '923efbe4-6b78-4ede-84c4-a830848abf32';

  // Redirect if already authenticated
  if (user && !loading) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!captchaToken) {
      return;
    }
    
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    await signIn(email, password, captchaToken);
    
    // Reset captcha após tentativa
    setCaptchaToken('');
    signInCaptchaRef.current?.resetCaptcha();
    setIsSubmitting(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!captchaToken) {
      return;
    }
    
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;

    await signUp(email, password, fullName, captchaToken);
    
    // Reset captcha após tentativa
    setCaptchaToken('');
    signUpCaptchaRef.current?.resetCaptcha();
    setIsSubmitting(false);
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

                    <div className="space-y-4">
                      <HCaptcha
                        ref={signInCaptchaRef}
                        sitekey={HCAPTCHA_SITE_KEY}
                        onVerify={(token) => setCaptchaToken(token)}
                        onExpire={() => setCaptchaToken('')}
                        onError={() => setCaptchaToken('')}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isSubmitting || !captchaToken}
                    >
                      {isSubmitting ? 'Entrando...' : 'Entrar'}
                    </Button>
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

                    <div className="space-y-4">
                      <HCaptcha
                        ref={signUpCaptchaRef}
                        sitekey={HCAPTCHA_SITE_KEY}
                        onVerify={(token) => setCaptchaToken(token)}
                        onExpire={() => setCaptchaToken('')}
                        onError={() => setCaptchaToken('')}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isSubmitting || !captchaToken}
                    >
                      {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
                    </Button>
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
