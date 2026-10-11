/** Faixa dos ODS da ONU que a rede atende (abaixo da abertura do diretório). Tudo editável no Editor de páginas. */
import TextoSite from '@/components/site/TextoSite';
import ImagemSite from '@/components/site/ImagemSite';
import ods4 from '@/assets/ods/ods4.png';
import ods5 from '@/assets/ods/ods5.webp';
import ods8 from '@/assets/ods/ods8.webp';
import ods10 from '@/assets/ods/ods10.webp';
import ods11 from '@/assets/ods/ods11.webp';

const ODS = [
  { n: 4, img: ods4 }, { n: 5, img: ods5 }, { n: 8, img: ods8 }, { n: 10, img: ods10 }, { n: 11, img: ods11 },
];

export default function FaixaODS() {
  return (
    <section className="border-b border-border bg-[hsl(var(--marca-areia))]">
      <div className="container mx-auto px-4 py-10">
        <TextoSite as="p" chave="diretorio.ods.titulo" className="mb-6 block text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-5 lg:gap-0 lg:divide-x lg:divide-border">
          {ODS.map(({ n, img }) => (
            <div key={n} className="flex flex-col items-center gap-3 px-2 text-center lg:px-5">
              <ImagemSite chave={`diretorio.ods${n}.imagem`} padrao={img} alt={`ODS ${n}`} className="h-16 w-16 rounded-lg object-cover sm:h-20 sm:w-20" />
              <TextoSite as="h3" chave={`diretorio.ods${n}.titulo`} className="text-sm font-bold leading-tight sm:text-base" />
              <TextoSite as="p" multilinha chave={`diretorio.ods${n}.texto`} className="text-xs leading-relaxed text-muted-foreground sm:text-sm" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
