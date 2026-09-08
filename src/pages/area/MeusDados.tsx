import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import AreaLayout from '@/components/area/AreaLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  useMeuPerfil, useSalvarMeuPerfil, useRegistrarContato, useVincularCpf,
} from '@/hooks/useMinhaArea';

export default function MeusDados() {
  const { data: perfil, isLoading } = useMeuPerfil();
  const salvar = useSalvarMeuPerfil();
  const contato = useRegistrarContato();
  const cpfMut = useVincularCpf();
  const { toast } = useToast();

  const [form, setForm] = useState({
    nome: '', nome_social: '', data_nascimento: '', bio: '',
    instagram: '', linkedin: '', site: '', foto_url: '',
  });
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');

  useEffect(() => {
    if (!perfil) return;
    setForm({
      nome: perfil.nome ?? '',
      nome_social: perfil.nome_social ?? '',
      data_nascimento: perfil.data_nascimento ?? '',
      bio: perfil.bio ?? '',
      instagram: perfil.instagram ?? '',
      linkedin: perfil.linkedin ?? '',
      site: perfil.site ?? '',
      foto_url: perfil.foto_url ?? '',
    });
    setTelefone(perfil.telefone_principal ?? '');
  }, [perfil]);

  const enviar = async () => {
    try {
      await salvar.mutateAsync({
        nome: form.nome.trim(),
        nome_social: form.nome_social.trim() || null,
        data_nascimento: form.data_nascimento || null,
        bio: form.bio.trim() || null,
        instagram: form.instagram.trim() || null,
        linkedin: form.linkedin.trim() || null,
        site: form.site.trim() || null,
        foto_url: form.foto_url.trim() || null,
      });
      if (telefone.trim() && telefone !== perfil?.telefone_principal) {
        await contato.mutateAsync({ tipo: 'whatsapp', valor: telefone });
      }
      if (cpf.trim() && !perfil?.cpf) {
        await cpfMut.mutateAsync(cpf);
      }
      toast({ title: 'Dados salvos', description: 'Suas informações foram atualizadas.' });
    } catch (e: any) {
      toast({ title: 'Não foi possível salvar', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <AreaLayout titulo="Meus dados" descricao="Suas informações de cadastro e contato.">
      <Helmet>
        <title>Meus dados | Mulheres em Convergência</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      {isLoading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : (
        <div className="rounded-xl border border-border bg-card p-6 max-w-2xl space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome completo</Label>
              <Input id="nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nome_social">Como quer ser chamada</Label>
              <Input id="nome_social" value={form.nome_social} onChange={(e) => setForm({ ...form, nome_social: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" value={perfil?.email_principal ?? ''} disabled />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telefone">WhatsApp</Label>
              <Input id="telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 99999-9999" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={perfil?.cpf ?? cpf}
                disabled={!!perfil?.cpf}
                onChange={(e) => setCpf(e.target.value)}
                placeholder="Somente números"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nascimento">Data de nascimento</Label>
              <Input id="nascimento" type="date" value={form.data_nascimento ?? ''} onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio">Sobre você</Label>
            <Textarea id="bio" rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="instagram">Instagram</Label>
              <Input id="instagram" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input id="linkedin" value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="site">Site</Label>
              <Input id="site" value={form.site} onChange={(e) => setForm({ ...form, site: e.target.value })} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="foto">Link da sua foto</Label>
            <Input id="foto" value={form.foto_url} onChange={(e) => setForm({ ...form, foto_url: e.target.value })} />
          </div>

          <Button onClick={enviar} disabled={salvar.isPending}>
            {salvar.isPending ? 'Salvando…' : 'Salvar alterações'}
          </Button>
        </div>
      )}
    </AreaLayout>
  );
}
