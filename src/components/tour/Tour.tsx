/**
 * Tour guiado pronto para uso: basta informar o módulo.
 * O botão de reabrir fica sempre visível para quem está logada.
 */
import { useTour } from './useTour';
import { TourGuiado, BotaoTour } from './TourGuiado';
import { TOUR_PASSOS, TOUR_VERSAO } from './passos';

export default function Tour({ modulo }: { modulo: string }) {
  const passos = TOUR_PASSOS[modulo] ?? [];
  const tour = useTour({
    modulo,
    versao: TOUR_VERSAO[modulo] ?? 1,
    passos,
    automatico: passos.length > 0,
  });

  if (!passos.length) return null;

  return (
    <>
      <TourGuiado
        aberto={tour.aberto}
        passo={tour.passo}
        passos={tour.passos}
        onAvancar={tour.avancar}
        onVoltar={tour.voltar}
        onPular={tour.pular}
      />
      <BotaoTour onClick={tour.abrir} />
    </>
  );
}
