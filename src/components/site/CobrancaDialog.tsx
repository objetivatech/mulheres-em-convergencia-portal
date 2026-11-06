import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BadgePercent } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMeuPerfil } from '@/hooks/useMinhaArea';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

type Props = {
  aberto: boolean;
  aoFechar: () => void;
  tipo: 'plano' | 'evento';
  slug: string;
  titulo: string;
  valorTexto: string;
  permiteCupom?: boolean;
  /** Código de convite, quando a oferta é privada. */
  codigo?: string;
  tipoIngressoId?: string | null;
  aoConcluir?: () => void;
};

export default function CobrancaDialog({
  aberto, aoFechar, tipo, slug, titulo, valorTexto, permiteCupom, codigo, tipoIngressoId, aoConcluir,
}: Props) {
  const { user, signUp, signIn, requestPasswordReset } = useAuth();
  const { data: perfil } = useMeuPerfil();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cupom, setCupom] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [limite, setLimite] = useState(false);
  const { data: descontoAssinante = 0 } = useQuery({
    queryKey: ['meu-desconto-evento', user?.id],
    enabled: !!user && tipo === 'evento' && aberto,
    queryFn: async () => {
      const { data } = await (supabase as any).rpc('meu_desconto_evento');
      return Number(data ?? 0);
    },
  });
  const mostrarDesconto = tipo === 'evento' && descontoAssinante > 0 && valorTexto !== 'Gratuito';

  // Sem conta: identificação dentro do próprio modal (cadastro ou entrada), sem sair da página.
  const [modo, setModo] = useState<'cadastro' | 'entrar'>('cadastro');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [emailMascarado, setEmailMascarado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const visitante = !user;

  const verificarCpf = async (valor: string) => {
    const d = valor.replace(/\D/g, '');
    if (d.length !== 11) { setEmailMascarado(null); return; }
    const { data } = await supabase.functions.invoke('cadastrar-conta', { body: { acao: 'verificar_cpf', cpf: d } });
    if ((data as any)?.existe) {
      setEmailMascarado((data as any).email_mascarado);
      setModo('entrar');
    } else setEmailMascarado(null);
  };

  // Já logada: reconhece os dados que já temos.
  useEffect(() => {
    if (!perfil) return;
    setNome((v) => v || perfil.nome_social || perfil.nome || '');
    setCpf((v) => v || perfil.cpf || '');
    setTelefone((v) => v || perfil.telefone_principal || '');
  }, [perfil]);

  const confirmar = async () => {
    setErro(null);
    let n = nome, c = cpf;
    if (visitante && modo === 'entrar') {
      if (!email.trim() || !senha) { setErro('Informe seu e-mail e sua senha.'); return; }
      setEnviando(true);
      const { error } = await signIn(email.trim(), senha);
      if (error) { setEnviando(false); setErro('E-mail ou senha não conferem. Tente de novo ou use "Esqueci minha senha".'); return; }
      const { data: s } = await supabase.auth.getUser();
      const { data: p } = await (supabase as any).from('pessoas')
        .select('nome, nome_social, cpf').eq('auth_user_id', s.user?.id).maybeSingle();
      n = p?.nome_social || p?.nome || nome; c = p?.cpf || cpf;
      if (n.trim().length < 2 || c.replace(/\D/g, '').length !== 11) {
        setEnviando(false); setNome(n); setCpf(c);
        setErro('Você entrou! Confira seu nome e CPF abaixo e clique novamente para continuar.');
        return;
      }
    } else {
      if (nome.trim().length < 2 || cpf.replace(/\D/g, '').length !== 11) {
        setErro('Precisamos do seu nome completo e do CPF.');
        return;
      }
      if (visitante) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setErro('Confira seu e-mail.'); return; }
        if (senha.length < 8) { setErro('A senha precisa ter ao menos 8 caracteres.'); return; }
        setEnviando(true);
        const { error } = await signUp(email.trim().toLowerCase(), senha, nome.trim(), cpf.replace(/\D/g, ''));
        if (error) { setEnviando(false); setErro((error as any).message ?? 'Não foi possível criar sua conta.'); return; }
        const { data: s } = await supabase.auth.getSession();
        if (!s.session) { setEnviando(false); setErro('Conta criada! Entre com seu e-mail e senha para continuar.'); setModo('entrar'); return; }
      }
    }
    setEnviando(true);
    try {
      const { data, error } = await supabase.functions.invoke('criar-cobranca', {
        body: { tipo, slug, nome: n, cpf: c, telefone, cupom: cupom || undefined, codigo: codigo || undefined, tipo_ingresso_id: tipoIngressoId || undefined },
      });
      if (error) throw error;
      if ((data as any)?.codigo === 'limite_gratuito') {
        setLimite(true);
        return;
      }
      if ((data as any)?.error) throw new Error((data as any).error);

      if ((data as any)?.gratuito) {
        toast({ title: 'Inscrição confirmada!', description: 'Você já está na lista deste encontro. O ingresso fica em Minha área → Meus encontros.' });
        aoConcluir?.();
        aoFechar();
        return;
      }
      const link = (data as any)?.link;
      if (link) {
        window.location.href = link;
        return;
      }
      toast({ title: 'Quase lá', description: 'A cobrança foi criada, mas o link não veio. Fale com a equipe.' });
    } catch (e: any) {
      let msg = e?.message;
      try { msg = (await e?.context?.json?.())?.error ?? msg; } catch { /* ignora */ }
      setErro(msg ?? 'Tente novamente em instantes.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={(v) => { if (!v) { setLimite(false); aoFechar(); } }}>
      <DialogContent className="sm:max-w-md">
        {limite ? (
          <>
            <DialogHeader>
              <DialogTitle>Que bom ter você de volta! 💜</DialogTitle>
              <DialogDescription className="pt-2 leading-relaxed">
                Você já participou de um encontro gratuito da comunidade. Para continuar
                participando dos nossos eventos, escolha um plano — assinantes têm acesso
                a todos os encontros, sem limite.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setLimite(false); aoFechar(); }}>Agora não</Button>
              <Button onClick={() => navigate('/planos')}>Conhecer os planos</Button>
            </DialogFooter>
          </>
        ) : (<>
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>
            {valorTexto} — {visitante
              ? (modo === 'entrar' ? 'entre com sua conta para continuar.' : 'preencha seus dados; sua conta é criada na hora.')
              : (valorTexto === 'Gratuito' ? 'confirme seus dados para garantir sua vaga.' : 'confirme seus dados para gerar o pagamento.')}
          </DialogDescription>
        </DialogHeader>

        {mostrarDesconto && (
          <div className="flex gap-3 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm">
            <BadgePercent className="h-5 w-5 shrink-0 text-primary" />
            <p>
              <strong>Você ganhou {descontoAssinante}% de desconto por ser assinante!</strong>{' '}
              O valor com desconto já aparece na hora do pagamento.
            </p>
          </div>
        )}

        {visitante && (
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-sm">
            {(['cadastro', 'entrar'] as const).map((m) => (
              <button key={m} type="button" onClick={() => { setModo(m); setErro(null); }}
                className={`rounded-md py-1.5 font-medium ${modo === m ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}>
                {m === 'cadastro' ? 'Sou nova por aqui' : 'Já tenho conta'}
              </button>
            ))}
          </div>
        )}

        {visitante && modo === 'entrar' ? (
        <div className="space-y-4">
          {emailMascarado && (
            <p className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm">
              Encontramos seu cadastro pelo CPF (e-mail <strong>{emailMascarado}</strong>). Digite esse e-mail e sua senha para continuar.
            </p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="cob-email">E-mail</Label>
            <Input id="cob-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" autoComplete="email" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cob-senha">Senha</Label>
            <Input id="cob-senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" />
          </div>
          <button type="button" className="text-sm text-primary underline"
            onClick={async () => {
              if (!email.trim()) { setErro('Digite seu e-mail acima para receber o link.'); return; }
              await requestPasswordReset(email.trim());
            }}>
            Esqueci minha senha
          </button>
          {permiteCupom && (
            <div className="space-y-1.5">
              <Label htmlFor="cob-cupom2">Cupom de desconto (opcional)</Label>
              <Input id="cob-cupom2" value={cupom} onChange={(e) => setCupom(e.target.value)} placeholder="Código" />
            </div>
          )}
        </div>
        ) : (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cob-nome">Nome completo</Label>
            <Input id="cob-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cob-cpf">CPF</Label>
            <Input id="cob-cpf" value={cpf} onChange={(e) => { setCpf(e.target.value); if (visitante) verificarCpf(e.target.value); }} placeholder="000.000.000-00" inputMode="numeric" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cob-tel">WhatsApp (opcional)</Label>
            <Input id="cob-tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" inputMode="tel" />
          </div>
          {visitante && (<>
            <div className="space-y-1.5">
              <Label htmlFor="cob-email-novo">E-mail</Label>
              <Input id="cob-email-novo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" autoComplete="email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cob-senha-nova">Crie uma senha (mín. 8 caracteres)</Label>
              <Input id="cob-senha-nova" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" />
              <p className="text-xs text-muted-foreground">Com ela você acessa seu ingresso e sua área no portal.</p>
            </div>
          </>)}
          {permiteCupom && (
            <div className="space-y-1.5">
              <Label htmlFor="cob-cupom">Cupom de desconto (opcional)</Label>
              <Input id="cob-cupom" value={cupom} onChange={(e) => setCupom(e.target.value)} placeholder="Código" />
            </div>
          )}
        </div>
        )}

        {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={aoFechar} disabled={enviando}>Cancelar</Button>
          <Button onClick={confirmar} disabled={enviando}>
            {enviando ? 'Aguarde…' : valorTexto === 'Gratuito' ? 'Confirmar inscrição' : 'Continuar para o pagamento'}
          </Button>
        </DialogFooter>
        </>)}
      </DialogContent>
    </Dialog>
  );
}
