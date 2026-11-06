
import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { registerReferralSignup } from '@/hooks/useAmbassadorCRMIntegration';

// Helper function to get referral code from cookie (outside hook to avoid circular dependency)
const getReferralCodeFromCookie = (): string | null => {
  const match = document.cookie.match(/mec_referral=([^;]+)/);
  return match ? match[1] : null;
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string, captchaToken?: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string, cpf?: string, captchaToken?: string, newsletterOptIn?: boolean) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  // null = not yet checked, false = checked and not admin, true = is admin
  isAdmin: boolean | null;
  canEditBlog: boolean | null;
  hasBusiness: boolean | null;
  isAmbassador: boolean | null;
  requestPasswordReset: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthProvider = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // Use null for permission states to distinguish "not checked" from "checked and false"
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [canEditBlog, setCanEditBlog] = useState<boolean | null>(null);
  const [hasBusiness, setHasBusiness] = useState<boolean | null>(null);
  const [isAmbassador, setIsAmbassador] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'PASSWORD_RECOVERY') {
          toast({
            title: "Recuperação de senha",
            description: "Defina sua nova senha na página de redefinição.",
          });
        }

        // Permissões no banco novo (MeC-v6): papéis em `papeis`, negócio em `negocios`.
        if (session?.user) {
          (async () => {
            try {
              const cliente = supabase as any;
              // Garante o registro da pessoa no banco novo já no primeiro acesso
              // (CPF é o identificador central; contatos são aditivos).
              const meta = (session.user.user_metadata ?? {}) as Record<string, any>;
              await cliente.rpc('garantir_pessoa', {
                _nome: meta.full_name ?? meta.nome ?? null,
                _cpf: meta.cpf ?? null,
                _email: session.user.email ?? null,
              });

              const [{ data: pessoaId }, { data: admin }] = await Promise.all([
                cliente.rpc('pessoa_atual'),
                cliente.rpc('e_admin'),
              ]);

              setIsAdmin(admin === true);

              if (!pessoaId) {
                setCanEditBlog(admin === true);
                setHasBusiness(false);
                setIsAmbassador(false);
                return;
              }

              const [editora, embaixadora, negocio] = await Promise.all([
                cliente.rpc('tem_papel', { _pessoa_id: pessoaId, _papel: 'editora' }),
                cliente.rpc('tem_papel', { _pessoa_id: pessoaId, _papel: 'embaixadora' }),
                cliente.from('negocios').select('id').eq('pessoa_id', pessoaId).limit(1),
              ]);

              setCanEditBlog(admin === true || editora.data === true);
              setIsAmbassador(embaixadora.data === true);
              setHasBusiness(((negocio.data as any[]) ?? []).length > 0);
            } catch (error) {
              console.error('Error checking user permissions:', error);
              // On error, default to no permissions for security
              setIsAdmin(false);
              setCanEditBlog(false);
              setHasBusiness(false);
              setIsAmbassador(false);
            }
          })();
        } else {

          setIsAdmin(false);
          setCanEditBlog(false);
          setHasBusiness(false);
          setIsAmbassador(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string, captchaToken?: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: captchaToken ? {
          captchaToken,
        } : undefined,
      });
      
      if (error) {
        toast({
          title: "Erro no login",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vinda de volta!",
        });
      }
      
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string, cpf?: string, captchaToken?: string, newsletterOptIn?: boolean) => {
    try {
      // Check for referral code before signup
      const referralCode = getReferralCodeFromCookie();
      
      // Cria a conta já confirmada (sem depender do e-mail cair na caixa certa)
      // e entra em seguida. CPF já com login é barrado no servidor.
      const { data: resp, error: fnError } = await supabase.functions.invoke('cadastrar-conta', {
        body: { acao: 'cadastrar', email, senha: password, nome: fullName, cpf, newsletter: !!newsletterOptIn },
      });
      let mensagemErro: string | null = (resp as any)?.error ?? null;
      if (fnError && !mensagemErro) {
        try {
          const ctx = await (fnError as any).context?.json?.();
          mensagemErro = ctx?.error ?? null;
        } catch { /* ignora */ }
        mensagemErro = mensagemErro || 'Não foi possível criar a conta. Tente novamente.';
      }
      if (mensagemErro) {
        const authError = new Error(mensagemErro);
        toast({ title: "Não foi possível cadastrar", description: mensagemErro, variant: "destructive" });
        return { error: authError };
      }

      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError || !loginData.user) {
        toast({ title: "Conta criada", description: "Agora entre com seu e-mail e senha na aba Entrar." });
        return { error: null };
      }
      const authData = loginData;

      // Register in CRM if user signed up via referral
      if (referralCode) {
        try {
          console.log('[Auth] User signed up via referral, registering in CRM:', referralCode);
          await registerReferralSignup({
            referralCode,
            referredUserEmail: email,
            referredUserName: fullName || email,
            referredUserCpf: cpf,
            referredUserId: authData.user.id,
          });
        } catch (crmError) {
          console.error('[Auth] Error registering referral in CRM:', crmError);
          // Don't fail signup if CRM fails
        }
      }

      toast({
        title: "Cadastro realizado!",
        description: "Bem-vinda! Sua conta já está ativa.",
      });
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      // Usa a função própria de e-mail do portal
      const { error } = await supabase.functions.invoke('send-password-reset', {
        body: { email, origem: window.location.origin }
      });

      if (error) {
        toast({
          title: "Erro ao enviar link",
          description: error.message || "Falha ao enviar email de recuperação.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Verifique seu email",
          description: "Se o email existir em nossa base, você receberá instruções para redefinir sua senha.",
        });
      }
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast({
          title: "Erro ao redefinir senha",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Senha atualizada",
          description: "Você já pode entrar com sua nova senha.",
        });
      }
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logout realizado",
        description: "Até logo!",
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin,
    canEditBlog,
    hasBusiness,
    isAmbassador,
    requestPasswordReset,
    updatePassword,
  };
};

export { AuthContext };
