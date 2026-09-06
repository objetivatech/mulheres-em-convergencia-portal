/**
 * Tour guiado persistente — ligação com o banco novo (migration 0003).
 *
 * Ainda NÃO é usado por `src/`: só passa a valer quando a conexão Supabase
 * apontar para o projeto novo (tysvpeprhokdijquprkd). Até lá este arquivo é
 * a referência revisável da Fase 3.
 *
 * Regras do produto:
 * - o botão de reabrir o tour NUNCA some;
 * - o tour abre sozinho apenas uma vez por (pessoa, módulo, versão);
 * - conclusão nunca é desfeita; subir a versão reexibe.
 */
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type TourPasso = {
  /** seletor CSS do elemento destacado; ausente = passo centralizado */
  alvo?: string;
  titulo: string;
  texto: string;
};

type Opcoes = {
  modulo: string;
  versao?: number;
  passos: TourPasso[];
  /** false desliga a abertura automática (o botão continua funcionando) */
  automatico?: boolean;
};

export function useTour({ modulo, versao = 1, passos, automatico = true }: Opcoes) {
  const [aberto, setAberto] = useState(false);
  const [passo, setPasso] = useState(0);
  const [pronto, setPronto] = useState(false);

  // Decide apenas a abertura automática.
  useEffect(() => {
    let cancelado = false;

    (async () => {
      const { data: sessao } = await supabase.auth.getSession();
      if (!sessao.session) {
        if (!cancelado) setPronto(true);
        return; // tour é só para usuária logada
      }

      if (!automatico) {
        if (!cancelado) setPronto(true);
        return;
      }

      const { data, error } = await supabase.rpc('tour_pendente', {
        _modulo: modulo,
        _versao: versao,
      });

      if (cancelado) return;
      if (!error && data === true) {
        setPasso(0);
        setAberto(true);
      }
      setPronto(true);
    })();

    return () => {
      cancelado = true;
    };
  }, [modulo, versao, automatico]);

  const registrar = useCallback(
    async (novoPasso: number, concluido = false, pulado = false) => {
      const { data: sessao } = await supabase.auth.getSession();
      if (!sessao.session) return;
      await supabase.rpc('registrar_tour', {
        _modulo: modulo,
        _passo: novoPasso,
        _versao: versao,
        _concluido: concluido,
        _pulado: pulado,
      });
    },
    [modulo, versao],
  );

  const abrir = useCallback(() => {
    setPasso(0);
    setAberto(true);
  }, []);

  const avancar = useCallback(() => {
    setPasso((atual) => {
      const proximo = atual + 1;
      if (proximo >= passos.length) {
        void registrar(passos.length, true, false);
        setAberto(false);
        return atual;
      }
      void registrar(proximo);
      return proximo;
    });
  }, [passos.length, registrar]);

  const voltar = useCallback(() => {
    setPasso((atual) => Math.max(0, atual - 1));
  }, []);

  const pular = useCallback(() => {
    void registrar(passo, false, true);
    setAberto(false);
  }, [passo, registrar]);

  return { aberto, passo, passos, pronto, abrir, avancar, voltar, pular, fechar: pular };
}
