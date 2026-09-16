import { useParceiros } from '@/hooks/useConteudosSite';

export default function VitrineParceiros({
  titulo = 'Parceiros e apoiadores',
  subtitulo = 'Quem caminha com a gente nessa jornada.',
}: {
  titulo?: string;
  subtitulo?: string;
}) {
  const { data: parceiros } = useParceiros();

  if (!parceiros || parceiros.length === 0) return null;

  return (
    <section className="border-t border-border bg-surface-quente py-14">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">{titulo}</h2>
          <p className="text-muted-foreground text-sm">{subtitulo}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6">
          {parceiros.map((p) => {
            const conteudo = p.logo_url ? (
              <img
                src={p.logo_url}
                alt={p.nome}
                loading="lazy"
                className="h-14 w-auto object-contain opacity-80 transition-opacity hover:opacity-100"
              />
            ) : (
              <span className="text-sm font-medium">{p.nome}</span>
            );
            return p.site ? (
              <a
                key={p.id}
                href={p.site}
                target="_blank"
                rel="noopener noreferrer"
                title={p.nome}
                className="rounded-[var(--radius)] border border-border bg-card px-5 py-4"
              >
                {conteudo}
              </a>
            ) : (
              <div key={p.id} title={p.nome} className="rounded-[var(--radius)] border border-border bg-card px-5 py-4">
                {conteudo}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
