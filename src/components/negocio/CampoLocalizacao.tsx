/**
 * Coloca o negócio no mapa sem a pessoa precisar entender coordenadas.
 * 1) Botão "Localizar pelo endereço" (OpenStreetMap, gratuito, sem chave).
 * 2) Ajuda passo a passo para copiar do Google Maps, se preferir.
 * 3) Campos numéricos ficam escondidos em "Preencher à mão".
 */
import { useState } from 'react';
import { MapPin, Loader2, CheckCircle2, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

type Props = {
  endereco: { rua?: string; bairro?: string; cidade?: string; uf?: string };
  latitude: number | string | null | undefined;
  longitude: number | string | null | undefined;
  onChange: (lat: number | null, lng: number | null) => void;
};

const num = (v: string) => {
  const t = v.trim().replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

export default function CampoLocalizacao({ endereco, latitude, longitude, onChange }: Props) {
  const { toast } = useToast();
  const [buscando, setBuscando] = useState(false);
  const [ajuda, setAjuda] = useState(false);
  const [manual, setManual] = useState(false);
  const [colado, setColado] = useState('');
  const temPonto = latitude !== null && latitude !== undefined && latitude !== '' && longitude !== null && longitude !== undefined && longitude !== '';

  async function localizar() {
    const partes = [endereco.rua, endereco.bairro, endereco.cidade, endereco.uf, 'Brasil'].filter((p) => p && String(p).trim());
    if (!endereco.cidade) {
      toast({ title: 'Preencha a cidade primeiro', description: 'Com bairro e cidade a gente acha o lugar no mapa.' });
      return;
    }
    setBuscando(true);
    try {
      const tentar = async (q: string) => {
        const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(q)}`, {
          headers: { 'Accept-Language': 'pt-BR' },
        });
        const j = await r.json();
        return j?.[0];
      };
      let achado = await tentar(partes.join(', '));
      if (!achado) achado = await tentar([endereco.cidade, endereco.uf, 'Brasil'].filter(Boolean).join(', '));
      if (!achado) {
        toast({ title: 'Não achamos esse endereço', description: 'Confira a cidade e o bairro, ou use a ajuda abaixo.', variant: 'destructive' });
        return;
      }
      onChange(Number(Number(achado.lat).toFixed(6)), Number(Number(achado.lon).toFixed(6)));
      toast({ title: 'Pronto! Seu negócio está no mapa', description: 'Não esqueça de salvar.' });
    } catch {
      toast({ title: 'Não foi possível buscar agora', description: 'Tente de novo em alguns segundos.', variant: 'destructive' });
    } finally {
      setBuscando(false);
    }
  }

  function aplicarColado(v: string) {
    setColado(v);
    const m = v.match(/(-?\d+[.,]\d+)\s*[,;\s]\s*(-?\d+[.,]\d+)/);
    if (m) {
      onChange(num(m[1]), num(m[2]));
      toast({ title: 'Localização preenchida', description: 'Não esqueça de salvar.' });
    }
  }

  return (
    <div className="sm:col-span-2 rounded-[var(--radius)] border border-border bg-muted/40 p-4 space-y-3" data-tour="negocio-mapa">
      <div className="flex items-start gap-3">
        <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="font-medium">Seu negócio no mapa do diretório</p>
          <p className="text-sm text-muted-foreground">
            Preencha bairro e cidade acima e clique no botão. A gente encontra o lugar para você.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={localizar} disabled={buscando}>
          {buscando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MapPin className="w-4 h-4 mr-2" />}
          Localizar pelo endereço
        </Button>
        {temPonto ? (
          <span className="text-sm flex items-center gap-1.5 text-primary">
            <CheckCircle2 className="w-4 h-4" /> Já aparece no mapa
            <a className="underline ml-1" target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${latitude},${longitude}`}>conferir</a>
            <button type="button" className="underline ml-2 text-muted-foreground" onClick={() => onChange(null, null)}>tirar do mapa</button>
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">Ainda não aparece no mapa.</span>
        )}
      </div>

      <button type="button" onClick={() => setAjuda((v) => !v)} className="text-sm flex items-center gap-1.5 text-primary underline">
        <HelpCircle className="w-4 h-4" /> O ponto ficou no lugar errado? Veja como acertar
      </button>
      {ajuda && (
        <div className="text-sm space-y-2 rounded-md bg-background p-3 border border-border">
          <ol className="list-decimal pl-5 space-y-1">
            <li>Abra o <a className="underline" href="https://maps.google.com" target="_blank" rel="noreferrer">Google Maps</a> e procure o seu endereço.</li>
            <li>No computador, clique com o botão direito em cima do lugar. No celular, segure o dedo no lugar.</li>
            <li>Aparecem dois números, por exemplo <em>-30.0346, -51.2177</em>. Clique neles para copiar.</li>
            <li>Cole aqui embaixo. Pronto!</li>
          </ol>
          <Input value={colado} onChange={(e) => aplicarColado(e.target.value)} placeholder="Cole aqui os números copiados do Google Maps" />
          <button type="button" onClick={() => setManual((v) => !v)} className="text-xs underline text-muted-foreground">
            {manual ? 'Esconder campos separados' : 'Preencher os números separadamente'}
          </button>
          {manual && (
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Primeiro número (latitude)</Label>
                <Input defaultValue={latitude ?? ''} onBlur={(e) => onChange(num(e.target.value), num(String(longitude ?? '')))} /></div>
              <div><Label>Segundo número (longitude)</Label>
                <Input defaultValue={longitude ?? ''} onBlur={(e) => onChange(num(String(latitude ?? '')), num(e.target.value))} /></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
