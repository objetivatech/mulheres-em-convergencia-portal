export function contagemEvento(iso: string, agora = Date.now()) {
  const segundos = Math.max(0, Math.floor((new Date(iso).getTime() - agora) / 1000)) || 0;
  return { total: segundos, dias: Math.floor(segundos / 86400), horas: Math.floor(segundos % 86400 / 3600), minutos: Math.floor(segundos % 3600 / 60), segundos: segundos % 60 };
}

export function faseConvite(iso: string, agora = Date.now()) {
  const restante = new Date(iso).getTime() - agora;
  if (restante <= 0) return 'encerrado';
  const data = new Date(iso);
  const hoje = new Date(agora);
  if (data.toDateString() === hoje.toDateString()) return 'hoje';
  if (restante <= 48 * 3600000) return 'reta_final';
  return 'planejar';
}

export function ocupacaoEvento(base: number, confirmadas: number, vagas: number | null) {
  const ocupadas = base + confirmadas;
  return { ocupadas, disponiveis: vagas === null ? null : Math.max(0, vagas - ocupadas), percentual: vagas === null || vagas <= 0 ? null : Math.min(100, Math.round(ocupadas * 100 / vagas)) };
}

export function priorizarEventos<T extends { destaque: boolean; inicio_em: string }>(eventos: T[]) {
  return [...eventos].sort((a, b) => Number(b.destaque) - Number(a.destaque) || new Date(a.inicio_em).getTime() - new Date(b.inicio_em).getTime());
}