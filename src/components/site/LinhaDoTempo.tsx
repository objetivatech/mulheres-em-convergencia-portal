import { useMarcos } from '@/hooks/useConteudosSite';

export default function LinhaDoTempo({ titulo = 'Nossa linha do tempo' }: { titulo?: string }) {
  const { data: marcos } = useMarcos();

  if (!marcos || marcos.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-14">
      <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight mb-8">{titulo}</h2>
      <ol className="relative border-l border-border pl-6 space-y-8">
        {marcos.map((m) => (
          <li key={m.id} className="relative">
            <span className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-primary" aria-hidden />
            <p className="text-sm text-muted-foreground">{m.rotulo || m.ano}</p>
            <h3 className="font-medium">{m.titulo}</h3>
            {m.descricao && <p className="text-sm text-muted-foreground mt-1">{m.descricao}</p>}
            {m.imagem_url && (
              <img
                src={m.imagem_url}
                alt={m.titulo}
                loading="lazy"
                className="mt-3 rounded-[var(--radius)] max-h-56 w-auto object-cover"
              />
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
