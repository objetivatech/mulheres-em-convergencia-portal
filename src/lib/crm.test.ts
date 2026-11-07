import { describe, it, expect } from 'vitest';
import {
  telefoneWhatsApp, linkWhatsApp, preencherModelo, mascararCpf, situacaoTarefa,
  aniversario, consentimentoAtual, primeiroNome,
} from './crm';

describe('WhatsApp', () => {
  it('celular com DDD ganha o 55 do Brasil', () => {
    expect(telefoneWhatsApp('(54) 99110-5807')).toBe('5554991105807');
  });
  it('número que já tem 55 é mantido', () => {
    expect(telefoneWhatsApp('+55 54 99110-5807')).toBe('5554991105807');
  });
  it('número sem DDD não gera link', () => {
    expect(linkWhatsApp('99110-5807', 'oi')).toBeNull();
  });
  it('mensagem vai codificada no link, sem envio automático', () => {
    expect(linkWhatsApp('54991105807', 'Oi, Ana!')).toBe('https://wa.me/5554991105807?text=Oi%2C%20Ana!');
  });
});

describe('Modelos de mensagem', () => {
  it('usa o nome preferido no {primeiro_nome}', () => {
    expect(preencherModelo('Oi, {primeiro_nome}!', { nome: 'SANTA LAURENTINA SILVA', nome_social: 'laura' })).toBe('Oi, Laura!');
  });
  it('sem nome preferido usa o primeiro nome civil', () => {
    expect(primeiroNome('MÔNICA VIVIANE')).toBe('Mônica');
  });
});

describe('CPF', () => {
  it('fica mascarado na tela', () => {
    expect(mascararCpf('03425600001')).toBe('***.256.000-**');
  });
});

describe('Agenda', () => {
  const agora = new Date(2026, 10, 7, 10, 0);
  it('tarefa de ontem está atrasada', () => {
    expect(situacaoTarefa({ vence_em: new Date(2026, 10, 6, 18).toISOString() }, agora)).toBe('atrasada');
  });
  it('tarefa de hoje à noite é de hoje', () => {
    expect(situacaoTarefa({ vence_em: new Date(2026, 10, 7, 21).toISOString() }, agora)).toBe('hoje');
  });
  it('tarefa concluída sai da agenda', () => {
    expect(situacaoTarefa({ vence_em: new Date(2026, 10, 1).toISOString(), concluida_em: '2026-11-02' }, agora)).toBe('concluida');
  });
  it('aniversário só aparece quando há data de nascimento', () => {
    expect(aniversario(null, agora)).toBeNull();
    expect(aniversario('1990-11-07', agora)).toBe('hoje');
    expect(aniversario('1990-11-20', agora)).toBe('mes');
    expect(aniversario('1990-12-07', agora)).toBeNull();
  });
});

describe('Consentimento', () => {
  it('vale o registro mais recente: recusa depois de autorizar bloqueia', () => {
    const r = [
      { canal: 'whatsapp', situacao: 'autorizado', registrado_em: '2026-01-01T00:00:00Z' },
      { canal: 'whatsapp', situacao: 'recusado', registrado_em: '2026-05-01T00:00:00Z' },
    ];
    expect(consentimentoAtual(r, 'whatsapp')).toBe('recusado');
    expect(consentimentoAtual(r, 'email_comercial')).toBeNull();
  });
});
