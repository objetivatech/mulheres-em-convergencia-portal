
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
  signUp: (email: string, password: string, fullName?: string, cpf?: string, captchaToken?: string) => Promise<{ error: any }>;
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

        // Check user permissions when session changes
        if (session?.user) {
          // Execute immediately without setTimeout to prevent race condition
          (async () => {
            try {
              const { data: adminStatus } = await supabase.rpc('get_current_user_admin_status');
              const { data: blogEditStatus } = await supabase.rpc('get_current_user_blog_edit_status');
              const { data: businessStatus } = await supabase.rpc('user_has_business', { 
                user_uuid: session.user.id 
              });
              const { data: ambassadorStatus } = await supabase.rpc('get_current_user_ambassador_status');
              
              setIsAdmin(adminStatus || false);
              setCanEditBlog(blogEditStatus || false);
              setHasBusiness(businessStatus || false);
              setIsAmbassador(ambassadorStatus || false);
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

  const signUp = async (email: string, password: string, fullName?: string, cpf?: string, captchaToken?: string) => {
    try {
      // Check for referral code before signup
      const referralCode = getReferralCodeFromCookie();
      
      // Create user with auto-confirm disabled
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            cpf: cpf,
          },
          captchaToken,
          emailRedirectTo: undefined, // Disable automatic email
        },
      });

      if (authError) {
        toast({
          title: "Erro no cadastro",
          description: authError.message,
          variant: "destructive",
        });
        return { error: authError };
      }

      if (!authData.user) {
        const error = new Error('Falha ao criar usuário');
        toast({
          title: "Erro no cadastro",
          description: "Falha ao criar usuário. Tente novamente.",
          variant: "destructive",
        });
        return { error };
      }

      // Send confirmation email via MailRelay
      try {
        const { error: emailError } = await supabase.functions.invoke('send-confirmation-email', {
          body: {
            user_id: authData.user.id,
            email: email,
            full_name: fullName || ''
          }
        });

        if (emailError) {
          console.error('Error sending confirmation email:', emailError);
          // Don't fail signup if email fails
        }
      } catch (emailError) {
        console.error('Error invoking send-confirmation-email:', emailError);
        // Don't fail signup if email fails
      }

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
        description: "Verifique seu email para confirmar a conta. O link expira em 24 horas.",
      });
      
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      // Use MailRelay edge function instead of Supabase Auth
      const { error } = await supabase.functions.invoke('send-password-reset', {
        body: { email }
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
