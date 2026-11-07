import { describe, it, expect } from 'vitest';
import { sugerirMapeamento, dataPlanilha, montarLinhas, repetidasNaPlanilha, emLotes } from './crmImportacao';
import { linkWhatsAppModo } from './crm';

describe('Importador: colunas', () => {
  it('reconhece cabeçalhos comuns em português, com acento e maiúsculas', () => {
    const m = sugerirMapeamento(['Nome Completo', 'E-mail', 'WhatsApp', 'CPF', 'Empresa', 'Observações']);
    expect(m).toMatchObject({ nome: 0, email: 1, telefone: 2, cpf: 3, negocio: 4, observacao: 5 });
  });
  it('não usa a mesma coluna para dois campos', () => {
    const m = sugerirMapeamento(['Nome', 'Nome do negócio']);
    expect(m.nome).toBe(0);
    expect(m.negocio).toBe(1);
  });
});

describe('Importador: datas', () => {
  it('aceita dd/mm/aaaa', () => expect(dataPlanilha('05/03/2024')).toBe('2024-03-05'));
  it('aceita número de data do Excel', () => expect(dataPlanilha(45356)).toBe('2024-03-05'));
  it('recusa data impossível', () => expect(dataPlanilha('31/02/2024')).toBeNull());
});

describe('Importador: linhas', () => {
  const tabela = [
    ['Nome', 'Email', 'Telefone'],
    ['  Ana  Souza ', 'ANA@EXEMPLO.COM', '(54) 99999-0000'],
    ['', '', ''],
    ['Bia', 'bia@exemplo.com', '+55 54 99999-0000'],
  ];
  const linhas = montarLinhas(tabela, { nome: 0, email: 1, telefone: 2 });
  it('pula linhas vazias e guarda o número real da linha', () => {
    expect(linhas.map((l) => l.linha)).toEqual([2, 4]);
    expect(linhas[0]).toMatchObject({ nome: 'Ana Souza', email: 'ana@exemplo.com' });
  });
  it('aponta telefone repetido na mesma planilha (com ou sem 55)', () => {
    expect(repetidasNaPlanilha(linhas).get(4)).toBe(2);
  });
  it('divide em lotes para enviar ao banco', () => {
    expect(emLotes([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
});

describe('WhatsApp no computador', () => {
  it('abre direto no WhatsApp Web, sem a página intermediária', () => {
    expect(linkWhatsAppModo('54991105807', 'Oi', 'web', false)).toBe('https://web.whatsapp.com/send?phone=5554991105807&text=Oi');
  });
  it('pode abrir o aplicativo instalado, sem criar abas', () => {
    expect(linkWhatsAppModo('54991105807', 'Oi', 'app', false)).toBe('whatsapp://send?phone=5554991105807&text=Oi');
  });
  it('no celular usa o link universal', () => {
    expect(linkWhatsAppModo('54991105807', 'Oi', 'app', true)).toBe('https://wa.me/5554991105807?text=Oi');
  });
});
