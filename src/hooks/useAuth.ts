
import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string, captchaToken?: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string, cpf?: string, captchaToken?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  canEditBlog: boolean;
  hasBusiness: boolean;
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [canEditBlog, setCanEditBlog] = useState(false);
  const [hasBusiness, setHasBusiness] = useState(false);
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
          setTimeout(async () => {
            try {
              const { data: adminStatus } = await supabase.rpc('get_current_user_admin_status');
              const { data: blogEditStatus } = await supabase.rpc('get_current_user_blog_edit_status');
              const { data: businessStatus } = await supabase.rpc('user_has_business', { 
                user_uuid: session.user.id 
              });
              
              setIsAdmin(adminStatus || false);
              setCanEditBlog(blogEditStatus || false);
              setHasBusiness(businessStatus || false);
            } catch (error) {
              console.error('Error checking user permissions:', error);
            }
          }, 0);
        } else {
          setIsAdmin(false);
          setCanEditBlog(false);
          setHasBusiness(false);
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
      const redirectUrl = `https://mulheresemconvergencia.com.br/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            cpf: cpf,
          },
          captchaToken,
        },
      });

      if (error) {
        toast({
          title: "Erro no cadastro",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Cadastro realizado!",
          description: "Verifique seu email para confirmar a conta.",
        });
      }
      
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      const redirectTo = `https://mulheresemconvergencia.com.br/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        toast({
          title: "Erro ao enviar link",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Verifique seu email",
          description: "Enviamos um link para redefinir sua senha.",
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
    requestPasswordReset,
    updatePassword,
  };
};

export { AuthContext };
