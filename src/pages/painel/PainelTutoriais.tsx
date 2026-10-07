import PainelLayout from '@/components/painel/PainelLayout';
import CentralTutoriais from '@/components/tutoriais/CentralTutoriais';
import { TUTORIAIS_EQUIPE } from '@/lib/tutoriais';

export default function PainelTutoriais() {
  return (
    <PainelLayout titulo="Tutoriais da equipe" descricao="Passo a passo das tarefas de administração do portal.">
      <CentralTutoriais tutoriais={TUTORIAIS_EQUIPE} />
    </PainelLayout>
  );
}
