import { describe, it as test } from 'node:test';
import assert from 'node:assert/strict';
const expect = (actual) => ({ toEqual: (expected) => assert.deepEqual(actual, expected), toBe: (expected) => assert.equal(actual, expected), toBeNull: () => assert.equal(actual, null) });
import { contagemEvento, faseConvite, ocupacaoEvento, priorizarEventos } from './eventosConversao';

describe('Regras dos encontros', () => {
  test('50 vagas com 20 ingressos externos deixam 30 disponíveis', () => {
    expect(ocupacaoEvento(20, 0, 50)).toEqual({ ocupadas: 20, disponiveis: 30, percentual: 40 });
  });
  test('Novas confirmações são somadas à base, sem alterar a base', () => {
    expect(ocupacaoEvento(20, 3, 50)).toEqual({ ocupadas: 23, disponiveis: 27, percentual: 46 });
  });
  test('Esgotamento não mostra vagas negativas', () => {
    expect(ocupacaoEvento(20, 30, 50).disponiveis).toBe(0);
    expect(ocupacaoEvento(20, 31, 50).percentual).toBe(100);
  });
  test('Vagas ilimitadas não têm percentual de escassez', () => {
    expect(ocupacaoEvento(20, 3, null).percentual).toBeNull();
  });
  test('Cronômetro separa dias horas minutos segundos e para em zero', () => {
    expect(contagemEvento('2026-10-24T17:46:05Z', Date.parse('2026-10-22T15:45:00Z'))).toEqual({ total: 180065, dias: 2, horas: 2, minutos: 1, segundos: 5 });
    expect(contagemEvento('2026-10-22T15:45:00Z', Date.parse('2026-10-22T15:45:00Z')).total).toBe(0);
  });
  test('Reta final começa em 48 horas', () => {
    expect(faseConvite('2026-10-24T15:45:00Z', Date.parse('2026-10-22T15:45:00Z'))).toBe('reta_final');
    expect(faseConvite('2026-10-30T15:45:00Z', Date.parse('2026-10-22T15:45:00Z'))).toBe('planejar');
  });
  test('Destaques têm prioridade, mantendo ordem de datas no grupo', () => {
    expect(priorizarEventos([{ destaque: false, inicio_em: '2026-10-23', id: 1 }, { destaque: true, inicio_em: '2026-10-25', id: 2 }, { destaque: true, inicio_em: '2026-10-24', id: 3 }]).map(e => e.id)).toEqual([3, 2, 1]);
  });
});