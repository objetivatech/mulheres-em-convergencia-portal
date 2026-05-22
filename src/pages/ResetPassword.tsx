
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { scorePassword, MIN_PASSWORD_SCORE } from '@/lib/passwordStrength';

const ResetPassword = () => {
  const { session, updatePassword } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  useEffect(() => {
    // Aguarda hidratar o auth
    setReady(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirm) {
      alert('As senhas não coincidem.');
      return;
    }
    if (!scorePassword(password).isStrong) {
      alert(`Senha não atende ao mínimo de segurança (${MIN_PASSWORD_SCORE}/100).`);
      return;
    }
    setIsSubmitting(true);
    const { error } = await updatePassword(password);
    setIsSubmitting(false);
    if (!error) {
      setDone(true);
    }
  };

  if (done) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Redefinir senha</CardTitle>
              <CardDescription>
                {ready && !session
                  ? 'O link de redefinição é inválido ou expirou. Solicite um novo.'
                  : 'Informe sua nova senha abaixo.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ready && !session ? (
                <a href="/forgot-password" className="text-primary underline">
                  Solicitar novo link
                </a>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Nova senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        required
                        minLength={8}
                        className="pl-10"
                        placeholder="Crie uma senha forte"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    <PasswordStrengthMeter password={password} confirmPassword={confirm} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm">Confirme a nova senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirm"
                        name="confirm"
                        type="password"
                        required
                        minLength={8}
                        className="pl-10"
                        placeholder="Repita a senha"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting || !scorePassword(password).isStrong || password !== confirm}>
                    {isSubmitting ? 'Salvando...' : 'Salvar nova senha'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ResetPassword;
