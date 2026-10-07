import AreaLayout from '@/components/area/AreaLayout';
import CentralTutoriais from '@/components/tutoriais/CentralTutoriais';
import { TUTORIAIS_ASSOCIADA } from '@/lib/tutoriais';

export default function MeusTutoriais() {
  return (
    <AreaLayout titulo="Tutoriais" descricao="Aprenda a usar cada parte do portal, passo a passo.">
      <CentralTutoriais tutoriais={TUTORIAIS_ASSOCIADA} />
    </AreaLayout>
  );
}
