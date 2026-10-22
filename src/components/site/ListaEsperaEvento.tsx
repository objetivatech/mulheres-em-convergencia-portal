import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTexto } from '@/hooks/useTextosSite';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ListaEsperaEvento({ eventoId, aberto, aoFechar }: { eventoId: string; aberto: boolean; aoFechar: () => void }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');
  const titulo = useTexto('eventos.espera.titulo');
  const descricao = useTexto('eventos.espera.texto');
  const botao = useTexto('eventos.espera.botao');
  const concluido = useTexto('eventos.espera.sucesso');
  const falha = useTexto('eventos.espera.erro');
  return <Dialog open={aberto} onOpenChange={(v) => { if (!v) aoFechar(); }}><DialogContent>
    <DialogHeader><DialogTitle>{titulo}</DialogTitle><DialogDescription>{descricao}</DialogDescription></DialogHeader>
    {sucesso ? <p role="status" className="text-sm text-primary">{concluido}</p> : <form className="space-y-4" onSubmit={async (e) => {
      e.preventDefault(); setEnviando(true); setErro('');
      try {
        const { error } = await supabase.rpc('entrar_espera_evento', { _evento_id: eventoId, _nome: nome.trim(), _email: email.trim() });
        if (error) throw error;
        setSucesso(true);
      } catch { setErro(falha); } finally { setEnviando(false); }
    }}>
      <div><Label htmlFor="espera-nome">Nome</Label><Input id="espera-nome" required minLength={2} maxLength={160} autoComplete="name" value={nome} onChange={e => setNome(e.target.value)} /></div>
      <div><Label htmlFor="espera-email">E-mail</Label><Input id="espera-email" required type="email" maxLength={254} autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
      {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
      <Button type="submit" disabled={enviando} className="w-full">{botao}</Button>
    </form>}
  </DialogContent></Dialog>;
}