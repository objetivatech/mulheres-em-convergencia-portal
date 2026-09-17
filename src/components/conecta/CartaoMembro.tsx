import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ConectaMembro } from '@/hooks/useConectaNovo';

type Situacao = 'nenhuma' | 'pendente_enviada' | 'pendente_recebida' | 'conectada' | 'recusada';

interface Props {
  membro: ConectaMembro;
  situacao: Situacao;
  ocupado?: boolean;
  desabilitado?: boolean;
  onConectar: () => void;
  onAceitar?: () => void;
  onRecusar?: () => void;
  onMensagem?: () => void;
}

export default function CartaoMembro({
  membro: m,
  situacao,
  ocupado,
  desabilitado,
  onConectar,
  onAceitar,
  onRecusar,
  onMensagem,
}: Props) {
  return (
    <li className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-3">
        {m.foto_url ? (
          <img src={m.foto_url} alt={`Foto de ${m.nome}`} className="h-12 w-12 rounded-full object-cover" loading="lazy" />
        ) : (
          <div className="h-12 w-12 rounded-full bg-muted" aria-hidden />
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{m.nome}</p>
          <p className="text-xs text-muted-foreground truncate">
            {[m.cargo, m.empresa].filter(Boolean).join(' · ') || 'Associada'}
          </p>
        </div>
        {situacao === 'conectada' && <Badge variant="secondary" className="ml-auto text-[11px]">Conectada</Badge>}
      </div>

      {m.apresentacao && <p className="text-xs text-muted-foreground line-clamp-3">{m.apresentacao}</p>}

      {!!(m.interesses ?? []).length && (
        <div className="flex flex-wrap gap-1">
          {(m.interesses ?? []).slice(0, 4).map((i) => (
            <Badge key={i} variant="outline" className="text-[11px]">{i}</Badge>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-xs">
        {m.instagram && <a href={m.instagram} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">Instagram</a>}
        {m.linkedin && <a href={m.linkedin} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">LinkedIn</a>}
        {m.site && <a href={m.site} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">Site</a>}
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {situacao === 'nenhuma' || situacao === 'recusada' ? (
          <Button size="sm" disabled={desabilitado || ocupado} onClick={onConectar}>
            {ocupado ? 'Enviando…' : 'Conectar'}
          </Button>
        ) : situacao === 'pendente_enviada' ? (
          <Button size="sm" variant="outline" disabled>Convite enviado</Button>
        ) : situacao === 'pendente_recebida' ? (
          <>
            <Button size="sm" onClick={onAceitar} disabled={ocupado}>Aceitar convite</Button>
            <Button size="sm" variant="ghost" onClick={onRecusar} disabled={ocupado}>Recusar</Button>
          </>
        ) : (
          <Button size="sm" variant="outline" onClick={onMensagem}>Enviar mensagem</Button>
        )}
      </div>
    </li>
  );
}
