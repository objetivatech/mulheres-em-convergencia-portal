import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { stripHtml } from '@/lib/stripHtml';
import { useDonasNegocios } from '@/hooks/useSite';

type Negocio = {
  id: string; slug: string; nome: string; descricao?: string | null; categoria?: string | null;
  cidade?: string | null; uf?: string | null; logo_url?: string | null; capa_url?: string | null;
};

function iniciais(nome?: string) {
  return (nome ?? '').split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

/** Card do diretório: capa ampla, logo e foto da empreendedora (vinda do perfil dela). */
export default function CardNegocio({ negocio: n }: { negocio: Negocio }) {
  const { data: donas } = useDonasNegocios();
  const dona = donas?.get(n.id);
  return (
    <Link
      to={`/diretorio/${n.slug}`}
      className="group rounded-[var(--radius)] border border-border bg-card overflow-hidden transition-transform hover:-translate-y-1 flex flex-col"
      style={{ boxShadow: 'var(--sombra-1)' }}
    >
      <div className="relative aspect-[16/9] bg-muted overflow-hidden">
        {(n.capa_url || n.logo_url) && (
          <img
            src={n.capa_url || n.logo_url!}
            alt={`Imagem de ${n.nome}`}
            loading="lazy"
            className={`h-full w-full ${n.capa_url ? 'object-cover' : 'object-contain p-6'} transition-transform group-hover:scale-105`}
          />
        )}
        {n.capa_url && n.logo_url && (
          <img
            src={n.logo_url}
            alt=""
            loading="lazy"
            className="absolute bottom-3 left-3 h-14 w-14 rounded-xl bg-card object-contain p-1 border border-border"
          />
        )}
      </div>
      <div className="p-5 space-y-2 flex-1">
        {n.categoria && <p className="text-xs uppercase tracking-wide text-primary">{n.categoria}</p>}
        <h3 className="font-semibold leading-snug">{n.nome}</h3>
        {(n.cidade || n.uf) && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" /> {[n.cidade, n.uf].filter(Boolean).join(' / ')}
          </p>
        )}
        <p className="text-sm text-muted-foreground line-clamp-2">{stripHtml(n.descricao, 160)}</p>
      </div>
      {dona && (
        <div className="flex items-center gap-3 border-t border-border px-5 py-3">
          {dona.foto_url ? (
            <img src={dona.foto_url} alt={dona.nome} className="h-10 w-10 rounded-full object-cover border-2 border-background" />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-medium">
              {iniciais(dona.nome)}
            </span>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{dona.nome}</p>
            <p className="text-xs text-muted-foreground">Empreendedora</p>
          </div>
        </div>
      )}
    </Link>
  );
}
