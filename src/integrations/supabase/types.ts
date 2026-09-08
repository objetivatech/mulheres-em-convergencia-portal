export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      autores: {
        Row: {
          bio: string | null
          criado_em: string
          foto_url: string | null
          id: string
          nome: string
          pessoa_id: string | null
          slug: string
        }
        Insert: {
          bio?: string | null
          criado_em?: string
          foto_url?: string | null
          id?: string
          nome: string
          pessoa_id?: string | null
          slug: string
        }
        Update: {
          bio?: string | null
          criado_em?: string
          foto_url?: string | null
          id?: string
          nome?: string
          pessoa_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "autores_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "autores_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "v_acesso_operacao"
            referencedColumns: ["pessoa_id"]
          },
          {
            foreignKeyName: "autores_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "v_meu_perfil"
            referencedColumns: ["pessoa_id"]
          },
        ]
      }
      blocos_site: {
        Row: {
          ativo: boolean
          atualizado_em: string
          chave: string
          conteudo: Json
          id: string
          ordem: number
          tipo: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          chave: string
          conteudo?: Json
          id?: string
          ordem?: number
          tipo: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          chave?: string
          conteudo?: Json
          id?: string
          ordem?: number
          tipo?: string
        }
        Relationships: []
      }
      campanha_envios: {
        Row: {
          campanha_id: string
          criado_em: string
          email: string
          enviado_em: string | null
          erro: string | null
          id: string
          pessoa_id: string | null
          situacao: string
        }
        Insert: {
          campanha_id: string
          criado_em?: string
          email: string
          enviado_em?: string | null
          erro?: string | null
          id?: string
          pessoa_id?: string | null
          situacao?: string
        }
        Update: {
          campanha_id?: string
          criado_em?: string
          email?: string
          enviado_em?: string | null
          erro?: string | null
          id?: string
          pessoa_id?: string | null
          situacao?: string
        }
        Relationships: [
          {
            foreignKeyName: "campanha_envios_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas_email"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campanha_envios_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campanha_envios_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "v_acesso_operacao"
            referencedColumns: ["pessoa_id"]
          },
          {
            foreignKeyName: "campanha_envios_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "v_meu_perfil"
            referencedColumns: ["pessoa_id"]
          },
        ]
      }
      campanhas_email: {
        Row: {
          assunto: string
          atualizado_em: string
          chave: string
          corpo: string
          criado_em: string
          cta_rotulo: string
          disparado_em: string | null
          id: string
          situacao: string
          titulo: string
        }
        Insert: {
          assunto: string
          atualizado_em?: string
          chave: string
          corpo: string
          criado_em?: string
          cta_rotulo?: string
          disparado_em?: string | null
          id?: string
          situacao?: string
          titulo: string
        }
        Update: {
          assunto?: string
          atualizado_em?: string
          chave?: string
          corpo?: string
          criado_em?: string
          cta_rotulo?: string
          disparado_em?: string | null
          id?: string
          situacao?: string
          titulo?: string
        }
        Relationships: []
      }
      concessoes_acesso: {
        Row: {
          criado_em: string
          criado_por: string | null
          fim_em: string | null
          id: string
          inicio_em: string
          motivo: string | null
          origem: Database["public"]["Enums"]["acesso_origem"]
          pagamento_id: string | null
          pessoa_id: string
          revogado_em: string | null
          revogado_motivo: string | null
          tipo: Database["public"]["Enums"]["acesso_tipo"]
        }
        Insert: {
          criado_em?: string
          criado_por?: string | null
          fim_em?: string | null
          id?: string
          inicio_em?: string
          motivo?: string | null
          origem: Database["public"]["Enums"]["acesso_origem"]
          pagamento_id?: string | null
          pessoa_id: string
          revogado_em?: string | null
          revogado_motivo?: string | null
          tipo: Database["public"]["Enums"]["acesso_tipo"]
        }
        Update: {
          criado_em?: string
          criado_por?: string | null
          fim_em?: string | null
          id?: string
          inicio_em?: string
          motivo?: string | null
          origem?: Database["public"]["Enums"]["acesso_origem"]
          pagamento_id?: string | null
          pessoa_id?: string
          revogado_em?: string | null
          revogado_motivo?: string | null
          tipo?: Database["public"]["Enums"]["acesso_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "concessoes_acesso_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concessoes_acesso_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "v_acesso_operacao"
            referencedColumns: ["pessoa_id"]
          },
          {
            foreignKeyName: "concessoes_acesso_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "v_meu_perfil"
            referencedColumns: ["pessoa_id"]
          },
          {
            foreignKeyName: "concessoes_acesso_pagamento_id_fkey"
            columns: ["pagamento_id"]
            isOneToOne: false
            referencedRelation: "pagamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concessoes_acesso_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concessoes_acesso_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "v_acesso_operacao"
            referencedColumns: ["pessoa_id"]
          },
          {
            foreignKeyName: "concessoes_acesso_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "v_meu_perfil"
            referencedColumns: ["pessoa_id"]
          },
        ]
      }
      contato_eventos: {
        Row: {
          criado_em: string
          dados: Json
          detalhe: string | null
          email: string | null
          id: string
          ocorrido_em: string
          pessoa_id: string | null
          tipo: string
          titulo: string
        }
        Insert: {
          criado_em?: string
          dados?: Json
          detalhe?: string | null
          email?: string | null
          id?: string
          ocorrido_em?: string
          pessoa_id?: string | null
          tipo: string
          titulo: string
        }
        Update: {
          criado_em?: string
          dados?: Json
          detalhe?: string | null
          email?: string | null
          id?: string
          ocorrido_em?: string
          pessoa_id?: string | null
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "contato_eventos_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contato_eventos_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "v_acesso_operacao"
            referencedColumns: ["pessoa_id"]
          },
          {
            foreignKeyName: "contato_eventos_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "v_meu_perfil"
            referencedColumns: ["pessoa_id"]
          },
        ]
      }
      curso_aulas: {
        Row: {
          criado_em: string
          curso_id: string
          descricao: string | null
          duracao_min: number | null
          gratuita: boolean
          id: string
          material_url: string | null
          ordem: number
          titulo: string
          video_url: string | null
        }
        Insert: {
          criado_em?: string
          curso_id: string
          descricao?: string | null
          duracao_min?: number | null
          gratuita?: boolean
          id?: string
          material_url?: string | null
          ordem?: number
          titulo: string
          video_url?: string | null
        }
        Update: {
          criado_em?: string
          curso_id?: string
          descricao?: string | null
          duracao_min?: number | null
          gratuita?: boolean
          id?: string
          material_url?: string | null
          ordem?: number
          titulo?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "curso_aulas_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      curso_categorias: {
        Row: {
          id: string
          nome: string
          ordem: number
          slug: string
        }
        Insert: {
          id?: string
          nome: string
          ordem?: number
          slug: string
        }
        Update: {
          id?: string
          nome?: string
          ordem?: number
          slug?: string
        }
        Relationships: []
      }
      cursos: {
        Row: {
          atualizado_em: string
          capa_url: string | null
          carga_horaria_min: number | null
          categoria_id: string | null
          criado_em: string
          descricao: string | null
          destaque: boolean
          gratuito: boolean
          id: string
          nivel: string
          publicado: boolean
          resumo: string | null
          slug: string
          titulo: string
        }
        Insert: {
          atualizado_em?: string
          capa_url?: string | null
          carga_horaria_min?: number | null
          categoria_id?: string | null
          criado_em?: string
          descricao?: string | null
          destaque?: boolean
          gratuito?: boolean
          id?: string
          nivel?: string
          publicado?: boolean
          resumo?: string | null
          slug: string
          titulo: string
        }
        Update: {
          atualizado_em?: string
          capa_url?: string | null
          carga_horaria_min?: number | null
          categoria_id?: string | null
          criado_em?: string
          descricao?: string | null
          destaque?: boolean
          gratuito?: boolean
          id?: string
          nivel?: string
          publicado?: boolean
          resumo?: string | null
          slug?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "cursos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "curso_categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_cupons: {
        Row: {
          ativo: boolean
          codigo: string
          criado_em: string
          desconto_tipo: string
          desconto_valor: number
          evento_id: string | null
          id: string
          limite_uso: number | null
          valido_ate: string | null
        }
        Insert: {
          ativo?: boolean
          codigo: string
          criado_em?: string
          desconto_tipo?: string
          desconto_valor?: number
          evento_id?: string | null
          id?: string
          limite_uso?: number | null
          valido_ate?: string | null
        }
        Update: {
          ativo?: boolean
          codigo?: string
          criado_em?: string
          desconto_tipo?: string
          desconto_valor?: number
          evento_id?: string | null
          id?: string
          limite_uso?: number | null
          valido_ate?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evento_cupons_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_cupons_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "v_evento_vagas"
            referencedColumns: ["evento_id"]
          },
        ]
      }
      evento_inscricoes: {
        Row: {
          criado_em: string
          cupom_id: string | null
          email: string
          evento_id: string
          id: string
          lote_id: string | null
          nome: string
          pagamento_id: string | null
          pessoa_id: string | null
          situacao: string
          telefone: string | null
          valor_centavos: number
        }
        Insert: {
          criado_em?: string
          cupom_id?: string | null
          email: string
          evento_id: string
          id?: string
          lote_id?: string | null
          nome: string
          pagamento_id?: string | null
          pessoa_id?: string | null
          situacao?: string
          telefone?: string | null
          valor_centavos?: number
        }
        Update: {
          criado_em?: string
          cupom_id?: string | null
          email?: string
          evento_id?: string
          id?: string
          lote_id?: string | null
          nome?: string
          pagamento_id?: string | null
          pessoa_id?: string | null
          situacao?: string
          telefone?: string | null
          valor_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "evento_inscricoes_cupom_id_fkey"
            columns: ["cupom_id"]
            isOneToOne: false
            referencedRelation: "evento_cupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_inscricoes_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_inscricoes_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "v_evento_vagas"
            referencedColumns: ["evento_id"]
          },
          {
            foreignKeyName: "evento_inscricoes_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "evento_lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_inscricoes_pagamento_id_fkey"
            columns: ["pagamento_id"]
            isOneToOne: false
            referencedRelation: "pagamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_inscricoes_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_inscricoes_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "v_acesso_operacao"
            referencedColumns: ["pessoa_id"]
          },
          {
            foreignKeyName: "evento_inscricoes_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "v_meu_perfil"
            referencedColumns: ["pessoa_id"]
          },
        ]
      }
      evento_lotes: {
        Row: {
          ativo: boolean
          criado_em: string
          evento_id: string
          fim_em: string | null
          id: string
          inicio_em: string | null
          nome: string
          ordem: number
          vagas: number | null
          valor_centavos: number
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          evento_id: string
          fim_em?: string | null
          id?: string
          inicio_em?: string | null
          nome: string
          ordem?: number
          vagas?: number | null
          valor_centavos?: number
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          evento_id?: string
          fim_em?: string | null
          id?: string
          inicio_em?: string | null
          nome?: string
          ordem?: number
          vagas?: number | null
          valor_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "evento_lotes_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_lotes_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "v_evento_vagas"
            referencedColumns: ["evento_id"]
          },
        ]
      }
      evento_palestrantes: {
        Row: {
          evento_id: string
          foto_url: string | null
          id: string
          minibio: string | null
          nome: string
          ordem: number
        }
        Insert: {
          evento_id: string
          foto_url?: string | null
          id?: string
          minibio?: string | null
          nome: string
          ordem?: number
        }
        Update: {
          evento_id?: string
          foto_url?: string | null
          id?: string
          minibio?: string | null
          nome?: string
          ordem?: number
        }
        Relationships: [
          {
            foreignKeyName: "evento_palestrantes_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_palestrantes_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "v_evento_vagas"
            referencedColumns: ["evento_id"]
          },
        ]
      }
      evento_presencas: {
        Row: {
          id: string
          inscricao_id: string
          registrado_em: string
          registrado_por: string | null
        }
        Insert: {
          id?: string
          inscricao_id: string
          registrado_em?: string
          registrado_por?: string | null
        }
        Update: {
          id?: string
          inscricao_id?: string
          registrado_em?: string
          registrado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evento_presencas_inscricao_id_fkey"
            columns: ["inscricao_id"]
            isOneToOne: true
            referencedRelation: "evento_inscricoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_presencas_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_presencas_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "v_acesso_operacao"
            referencedColumns: ["pessoa_id"]
          },
          {
            foreignKeyName: "evento_presencas_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "v_meu_perfil"
            referencedColumns: ["pessoa_id"]
          },
        ]
      }
      eventos: {
        Row: {
          atualizado_em: string
          capa_url: string | null
          cidade: string | null
          criado_em: string
          descricao: string | null
          destaque: boolean
          endereco: string | null
          fim_em: string | null
          gratuito: boolean
          id: string
          inicio_em: string
          link_online: string | null
          local_nome: string | null
          online: boolean
          publicado: boolean
          resumo: string | null
          slug: string
          titulo: string
          uf: string | null
          vagas: number | null
        }
        Insert: {
          atualizado_em?: string
          capa_url?: string | null
          cidade?: string | null
          criado_em?: string
          descricao?: string | null
          destaque?: boolean
          endereco?: string | null
          fim_em?: string | null
          gratuito?: boolean
          id?: string
          inicio_em: string
          link_online?: string | null
          local_nome?: string | null
          online?: boolean
          publicado?: boolean
          resumo?: string | null
          slug: string
          titulo: string
          uf?: string | null
          vagas?: number | null
        }
        Update: {
          atualizado_em?: string
          capa_url?: string | null
          cidade?: string | null
          criado_em?: string
          descricao?: string | null
          destaque?: boolean
          endereco?: string | null
          fim_em?: string | null
          gratuito?: boolean
          id?: string
          inicio_em?: string
          link_online?: string | null
          local_nome?: string | null
          online?: boolean
          publicado?: boolean
          resumo?: string | null
          slug?: string
          titulo?: string
          uf?: string | null
          vagas?: number | null
        }
        Relationships: []
      }
      funil_estagios: {
        Row: {
          criado_em: string
          funil_id: string
          ganho: boolean
          id: string
          nome: string
          ordem: number
          perdido: boolean
        }
        Insert: {
          criado_em?: string
          funil_id: string
          ganho?: boolean
          id?: string
          nome: string
          ordem?: number
          perdido?: boolean
        }
        Update: {
          criado_em?: string
          funil_id?: string
          ganho?: boolean
          id?: string
          nome?: string
          ordem?: number
          perdido?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "funil_estagios_funil_id_fkey"
            columns: ["funil_id"]
            isOneToOne: false
            referencedRelation: "funis"
            referencedColumns: ["id"]
          },
        ]
      }
      funis: {
        Row: {
          ativo: boolean
          criado_em: string
          id: string
          nome: string
          ordem: number
          slug: string
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          id?: string
          nome: string
          ordem?: number
          slug: string
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          id?: string
          nome?: string
          ordem?: number
          slug?: string
        }
        Relationships: []
      }
      matriculas: {
        Row: {
          concluido_em: string | null
          criado_em: string
          curso_id: string
          id: string
          pessoa_id: string
        }
        Insert: {
          concluido_em?: string | null
          criado_em?: string
          curso_id: string
          id?: string
          pessoa_id: string
        }
        Update: {
          concluido_em?: string | null
          criado_em?: string
          curso_id?: string
          id?: string
          pessoa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matriculas_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matriculas_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matriculas_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "v_acesso_operacao"
            referencedColumns: ["pessoa_id"]
          },
          {
            foreignKeyName: "matriculas_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "v_meu_perfil"
            referencedColumns: ["pessoa_id"]
          },
        ]
      }
      negociacoes: {
        Row: {
          atualizado_em: string
          contato_email: string | null
          contato_nome: string | null
          contato_telefone: string | null
          criado_em: string
          estagio_id: string | null
          fechado_em: string | null
          funil_id: string
          id: string
          negocio_id: string | null
          observacoes: string | null
          pessoa_id: string | null
          responsavel_id: string | null
          resultado: string | null
          titulo: string
          valor_centavos: number
        }
        Insert: {
          atualizado_em?: string
          contato_email?: string | null
          contato_nome?: string | null
          contato_telefone?: string | null
          criado_em?: string
          estagio_id?: string | null
          fechado_em?: string | null
          funil_id: string
          id?: string
          negocio_id?: string | null
          observacoes?: string | null
          pessoa_id?: string | null
          responsavel_id?: string | null
          resultado?: string | null
          titulo: string
          valor_centavos?: number
        }
        Update: {
          atualizado_em?: string
          contato_email?: string | null
          contato_nome?: string | null
          contato_telefone?: string | null
          criado_em?: string
          estagio_id?: string | null
          fechado_em?: string | null
          funil_id?: string
          id?: string
          negocio_id?: string | null
          observacoes?: string | null
          pessoa_id?: string | null
          responsavel_id?: string | null
          resultado?: string | null
          titulo?: string
          valor_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "negociacoes_estagio_id_fkey"
            columns: ["estagio_id"]
            isOneToOne: false
            referencedRelation: "funil_estagios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negociacoes_funil_id_fkey"
            columns: ["funil_id"]
            isOneToOne: false
            referencedRelation: "funis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negociacoes_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negociacoes_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negociacoes_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "v_acesso_operacao"
            referencedColumns: ["pessoa_id"]
          },
          {
            foreignKeyName: "negociacoes_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "v_meu_perfil"
            referencedColumns: ["pessoa_id"]
          },
          {
            foreignKeyName: "negociacoes_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negociacoes_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "v_acesso_operacao"
            referencedColumns: ["pessoa_id"]
          },
          {
            foreignKeyName: "negociacoes_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "v_meu_perfil"
            referencedColumns: ["pessoa_id"]
          },
        ]
      }
      negocio_areas_atendimento: {
        Row: {
          bairro: string | null
          cidade: string | null
          id: string
          negocio_id: string
          uf: string | null
        }
        Insert: {
          bairro?: string | null
          cidade?: string | null
          id?: string
          negocio_id: string
          uf?: string | null
        }
        Update: {
          bairro?: string | null
          cidade?: string | null
          id?: string
          negocio_id?: string
          uf?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "negocio_areas_atendimento_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      negocio_comodidades: {
        Row: {
          id: string
          negocio_id: string
          nome: string
        }
        Insert: {
          id?: string
          negocio_id: string
          nome: string
        }
        Update: {
          id?: string
          negocio_id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "negocio_comodidades_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      negocio_midias: {
        Row: {
          criado_em: string
          id: string
          legenda: string | null
          negocio_id: string
          ordem: number
          tipo: Database["public"]["Enums"]["midia_tipo"]
          url: string
        }
        Insert: {
          criado_em?: string
          id?: string
          legenda?: string | null
          negocio_id: string
          ordem?: number
          tipo?: Database["public"]["Enums"]["midia_tipo"]
          url: string
        }
        Update: {
          criado_em?: string
          id?: string
          legenda?: string | null
          negocio_id?: string
          ordem?: number
          tipo?: Database["public"]["Enums"]["midia_tipo"]
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "negocio_midias_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      negocios: {
        Row: {
          atualizado_em: string
          bairro: string | null
          capa_url: string | null
          categoria: string | null
          cidade: string | null
          criado_em: string
          descricao: string | null
          destaque: boolean
          email: string | null
          id: string
          instagram: string | null
          logo_url: string | null
          nome: string
          pessoa_id: string | null
          publicado: boolean
          site: string | null
          slug: string
          telefone: string | null
          uf: string | null
          whatsapp: string | null
        }
        Insert: {
          atualizado_em?: string
          bairro?: string | null
          capa_url?: string | null
          categoria?: string | null
          cidade?: string | null
          criado_em?: string
          descricao?: string | null
          destaque?: boolean
          email?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          nome: string
          pessoa_id?: string | null
          publicado?: boolean
          site?: string | null
          slug: string
          telefone?: string | null
          uf?: string | null
          whatsapp?: string | null
        }
        Update: {
          atualizado_em?: string
          bairro?: string | null
          capa_url?: string | null
          categoria?: string | null
          cidade?: string | null
          criado_em?: string
          descricao?: string | null
          destaque?: boolean
          email?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          nome?: string
          pessoa_id?: string | null
          publicado?: boolean
          site?: string | null
          slug?: string
          telefone?: string | null
          uf?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "negocios_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negocios_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "v_acesso_operacao"
            referencedColumns: ["pessoa_id"]
          },
          {
            foreignKeyName: "negocios_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "v_meu_perfil"
            referencedColumns: ["pessoa_id"]
          },
        ]
      }
      pagamentos: {
        Row: {
          assinatura_externa_id: string | null
          atualizado_em: string
          cliente_externo_id: string | null
          cobranca_externa_id: string | null
          confirmado_em: string | null
          criado_em: string
          dados_brutos: Json
          descricao: string | null
          id: string
          pessoa_id: string | null
          provedor: string
          referencia_externa: string | null
          situacao: Database["public"]["Enums"]["pagamento_situacao"]
          valor_centavos: number
          vencimento_em: string | null
        }
        Insert: {
          assinatura_externa_id?: string | null
          atualizado_em?: string
          cliente_externo_id?: string | null
          cobranca_externa_id?: string | null
          confirmado_em?: string | null
          criado_em?: string
          dados_brutos?: Json
          descricao?: string | null
          id?: string
          pessoa_id?: string | null
          provedor?: string
          referencia_externa?: string | null
          situacao?: Database["public"]["Enums"]["pagamento_situacao"]
          valor_centavos: number
          vencimento_em?: string | null
        }
        Update: {
          assinatura_externa_id?: string | null
          atualizado_em?: string
          cliente_externo_id?: string | null
          cobranca_externa_id?: string | null
          confirmado_em?: string | null
          criado_em?: string
          dados_brutos?: Json
          descricao?: string | null
          id?: string
          pessoa_id?: string | null
          provedor?: string
          referencia_externa?: string | null
          situacao?: Database["public"]["Enums"]["pagamento_situacao"]
          valor_centavos?: number
          vencimento_em?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "v_acesso_operacao"
            referencedColumns: ["pessoa_id"]
          },
          {
            foreignKeyName: "pagamentos_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "v_meu_perfil"
            referencedColumns: ["pessoa_id"]
          },
        ]
      }
      paginas: {
        Row: {
          atualizado_em: string
          conteudo: string | null
          criado_em: string
          id: string
          publicado_em: string | null
          seo_descricao: string | null
          seo_titulo: string | null
          situacao: Database["public"]["Enums"]["publicacao_situacao"]
          slug: string
          titulo: string
        }
        Insert: {
          atualizado_em?: string
          conteudo?: string | null
          criado_em?: string
          id?: string
          publicado_em?: string | null
          seo_descricao?: string | null
          seo_titulo?: string | null
          situacao?: Database["public"]["Enums"]["publicacao_situacao"]
          slug: string
          titulo: string
        }
        Update: {
          atualizado_em?: string
          conteudo?: string | null
          criado_em?: string
          id?: string
          publicado_em?: string | null
          seo_descricao?: string | null
          seo_titulo?: string | null
          situacao?: Database["public"]["Enums"]["publicacao_situacao"]
          slug?: string
          titulo?: string
        }
        Relationships: []
      }
      papeis: {
        Row: {
          criado_em: string
          criado_por: string | null
          id: string
          papel: Database["public"]["Enums"]["papel_tipo"]
          pessoa_id: string
        }
        Insert: {
          criado_em?: string
          criado_por?: string | null
          id?: string
          papel: Database["public"]["Enums"]["papel_tipo"]
          pessoa_id: string
        }
        Update: {
          criado_em?: string
          criado_por?: string | null
          id?: string
          papel?: Database["public"]["Enums"]["papel_tipo"]
          pessoa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "papeis_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "papeis_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "v_acesso_operacao"
            referencedColumns: ["pessoa_id"]
          },
          {
            foreignKeyName: "papeis_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "v_meu_perfil"
            referencedColumns: ["pessoa_id"]
          },
          {
            foreignKeyName: "papeis_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "papeis_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "v_acesso_operacao"
            referencedColumns: ["pessoa_id"]
          },
          {
            foreignKeyName: "papeis_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "v_meu_perfil"
            referencedColumns: ["pessoa_id"]
          },
        ]
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pessoa_contatos: {
        Row: {
          criado_em: string
          id: string
          pessoa_id: string
          principal: boolean
          tipo: Database["public"]["Enums"]["contato_tipo"]
          valor: string
          verificado_em: string | null
        }
        Insert: {
          criado_em?: string
          id?: string
          pessoa_id: string
          principal?: boolean
          tipo: Database["public"]["Enums"]["contato_tipo"]
          valor: string
          verificado_em?: string | null
        }
        Update: {
          criado_em?: string
          id?: string
          pessoa_id?: string
          principal?: boolean
          tipo?: Database["public"]["Enums"]["contato_tipo"]
          valor?: string
          verificado_em?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pessoa_contatos_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pessoa_contatos_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "v_acesso_operacao"
            referencedColumns: ["pessoa_id"]
          },
          {
            foreignKeyName: "pessoa_contatos_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "v_meu_perfil"
            referencedColumns: ["pessoa_id"]
          },
        ]
      }
      pessoa_enderecos: {
        Row: {
          atualizado_em: string
          bairro: string | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          criado_em: string
          id: string
          logradouro: string | null
          numero: string | null
          pessoa_id: string
          principal: boolean
          uf: string | null
        }
        Insert: {
          atualizado_em?: string
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          criado_em?: string
          id?: string
          logradouro?: string | null
          numero?: string | null
          pessoa_id: string
          principal?: boolean
          uf?: string | null
        }
        Update: {
          atualizado_em?: string
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          criado_em?: string
          id?: string
          logradouro?: string | null
          numero?: string | null
          pessoa_id?: string
          principal?: boolean
          uf?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pessoa_enderecos_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pessoa_enderecos_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "v_acesso_operacao"
            referencedColumns: ["pessoa_id"]
          },
          {
            foreignKeyName: "pessoa_enderecos_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "v_meu_perfil"
            referencedColumns: ["pessoa_id"]
          },
        ]
      }
      pessoas: {
        Row: {
          aceite_termos_em: string | null
          atualizado_em: string
          auth_user_id: string | null
          bio: string | null
          como_conheceu: string | null
          cpf: string | null
          criado_em: string
          data_nascimento: string | null
          foto_url: string | null
          genero: string | null
          id: string
          instagram: string | null
          linkedin: string | null
          nome: string
          nome_social: string | null
          site: string | null
          ultimo_acesso_em: string | null
        }
        Insert: {
          aceite_termos_em?: string | null
          atualizado_em?: string
          auth_user_id?: string | null
          bio?: string | null
          como_conheceu?: string | null
          cpf?: string | null
          criado_em?: string
          data_nascimento?: string | null
          foto_url?: string | null
          genero?: string | null
          id?: string
          instagram?: string | null
          linkedin?: string | null
          nome: string
          nome_social?: string | null
          site?: string | null
          ultimo_acesso_em?: string | null
        }
        Update: {
          aceite_termos_em?: string | null
          atualizado_em?: string
          auth_user_id?: string | null
          bio?: string | null
          como_conheceu?: string | null
          cpf?: string | null
          criado_em?: string
          data_nascimento?: string | null
          foto_url?: string | null
          genero?: string | null
          id?: string
          instagram?: string | null
          linkedin?: string | null
          nome?: string
          nome_social?: string | null
          site?: string | null
          ultimo_acesso_em?: string | null
        }
        Relationships: []
      }
      planos: {
        Row: {
          ativo: boolean
          atualizado_em: string
          beneficios: Json
          criado_em: string
          descricao: string | null
          destaque: boolean
          dias_acesso: number
          id: string
          nome: string
          ordem: number
          periodicidade: string
          slug: string
          tipo: Database["public"]["Enums"]["acesso_tipo"]
          valor_centavos: number
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          beneficios?: Json
          criado_em?: string
          descricao?: string | null
          destaque?: boolean
          dias_acesso?: number
          id?: string
          nome: string
          ordem?: number
          periodicidade?: string
          slug: string
          tipo?: Database["public"]["Enums"]["acesso_tipo"]
          valor_centavos?: number
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          beneficios?: Json
          criado_em?: string
          descricao?: string | null
          destaque?: boolean
          dias_acesso?: number
          id?: string
          nome?: string
          ordem?: number
          periodicidade?: string
          slug?: string
          tipo?: Database["public"]["Enums"]["acesso_tipo"]
          valor_centavos?: number
        }
        Relationships: []
      }
      post_categoria_vinculo: {
        Row: {
          categoria_id: string
          post_id: string
        }
        Insert: {
          categoria_id: string
          post_id: string
        }
        Update: {
          categoria_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_categoria_vinculo_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "post_categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_categoria_vinculo_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_categorias: {
        Row: {
          descricao: string | null
          id: string
          nome: string
          ordem: number
          slug: string
        }
        Insert: {
          descricao?: string | null
          id?: string
          nome: string
          ordem?: number
          slug: string
        }
        Update: {
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number
          slug?: string
        }
        Relationships: []
      }
      post_comentarios: {
        Row: {
          aprovado_em: string | null
          conteudo: string
          criado_em: string
          email: string | null
          id: string
          nome: string
          pessoa_id: string | null
          post_id: string
        }
        Insert: {
          aprovado_em?: string | null
          conteudo: string
          criado_em?: string
          email?: string | null
          id?: string
          nome: string
          pessoa_id?: string | null
          post_id: string
        }
        Update: {
          aprovado_em?: string | null
          conteudo?: string
          criado_em?: string
          email?: string | null
          id?: string
          nome?: string
          pessoa_id?: string | null
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comentarios_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comentarios_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "v_acesso_operacao"
            referencedColumns: ["pessoa_id"]
          },
          {
            foreignKeyName: "post_comentarios_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "v_meu_perfil"
            referencedColumns: ["pessoa_id"]
          },
          {
            foreignKeyName: "post_comentarios_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_tag_vinculo: {
        Row: {
          post_id: string
          tag_id: string
        }
        Insert: {
          post_id: string
          tag_id: string
        }
        Update: {
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_tag_vinculo_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_tag_vinculo_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "post_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      post_tags: {
        Row: {
          id: string
          nome: string
          slug: string
        }
        Insert: {
          id?: string
          nome: string
          slug: string
        }
        Update: {
          id?: string
          nome?: string
          slug?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          atualizado_em: string
          autor_id: string | null
          capa_url: string | null
          conteudo: string | null
          criado_em: string
          destaque: boolean
          id: string
          publicado_em: string | null
          resumo: string | null
          seo_descricao: string | null
          seo_titulo: string | null
          situacao: Database["public"]["Enums"]["publicacao_situacao"]
          slug: string
          titulo: string
        }
        Insert: {
          atualizado_em?: string
          autor_id?: string | null
          capa_url?: string | null
          conteudo?: string | null
          criado_em?: string
          destaque?: boolean
          id?: string
          publicado_em?: string | null
          resumo?: string | null
          seo_descricao?: string | null
          seo_titulo?: string | null
          situacao?: Database["public"]["Enums"]["publicacao_situacao"]
          slug: string
          titulo: string
        }
        Update: {
          atualizado_em?: string
          autor_id?: string | null
          capa_url?: string | null
          conteudo?: string | null
          criado_em?: string
          destaque?: boolean
          id?: string
          publicado_em?: string | null
          resumo?: string | null
          seo_descricao?: string | null
          seo_titulo?: string | null
          situacao?: Database["public"]["Enums"]["publicacao_situacao"]
          slug?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "autores"
            referencedColumns: ["id"]
          },
        ]
      }
      progresso_aulas: {
        Row: {
          aula_id: string
          concluida_em: string
          id: string
          pessoa_id: string
        }
        Insert: {
          aula_id: string
          concluida_em?: string
          id?: string
          pessoa_id: string
        }
        Update: {
          aula_id?: string
          concluida_em?: string
          id?: string
          pessoa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progresso_aulas_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "curso_aulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progresso_aulas_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progresso_aulas_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "v_acesso_operacao"
            referencedColumns: ["pessoa_id"]
          },
          {
            foreignKeyName: "progresso_aulas_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "v_meu_perfil"
            referencedColumns: ["pessoa_id"]
          },
        ]
      }
      tour_progresso: {
        Row: {
          atualizado_em: string
          concluido_em: string | null
          criado_em: string
          id: string
          modulo: string
          passo_atual: number
          pessoa_id: string
          pulado_em: string | null
          versao: number
        }
        Insert: {
          atualizado_em?: string
          concluido_em?: string | null
          criado_em?: string
          id?: string
          modulo: string
          passo_atual?: number
          pessoa_id: string
          pulado_em?: string | null
          versao?: number
        }
        Update: {
          atualizado_em?: string
          concluido_em?: string | null
          criado_em?: string
          id?: string
          modulo?: string
          passo_atual?: number
          pessoa_id?: string
          pulado_em?: string | null
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "tour_progresso_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_progresso_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "v_acesso_operacao"
            referencedColumns: ["pessoa_id"]
          },
          {
            foreignKeyName: "tour_progresso_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "v_meu_perfil"
            referencedColumns: ["pessoa_id"]
          },
        ]
      }
      webhooks_recebidos: {
        Row: {
          carga: Json
          erro: string | null
          evento_externo_id: string
          id: string
          processado_em: string | null
          provedor: string
          recebido_em: string
          tentativas: number
          tipo_evento: string | null
        }
        Insert: {
          carga: Json
          erro?: string | null
          evento_externo_id: string
          id?: string
          processado_em?: string | null
          provedor?: string
          recebido_em?: string
          tentativas?: number
          tipo_evento?: string | null
        }
        Update: {
          carga?: Json
          erro?: string | null
          evento_externo_id?: string
          id?: string
          processado_em?: string | null
          provedor?: string
          recebido_em?: string
          tentativas?: number
          tipo_evento?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      v_acesso_operacao: {
        Row: {
          cobranca_externa_id: string | null
          confirmado_em: string | null
          cpf: string | null
          fim_em: string | null
          inicio_em: string | null
          nome: string | null
          origem: Database["public"]["Enums"]["acesso_origem"] | null
          pessoa_id: string | null
          tipo: Database["public"]["Enums"]["acesso_tipo"] | null
          valor_centavos: number | null
          vigente: boolean | null
        }
        Relationships: []
      }
      v_evento_vagas: {
        Row: {
          disponiveis: number | null
          evento_id: string | null
          ocupadas: number | null
          vagas: number | null
        }
        Relationships: []
      }
      v_financeiro_mensal: {
        Row: {
          mes: string | null
          quantidade: number | null
          situacao: Database["public"]["Enums"]["pagamento_situacao"] | null
          total_centavos: number | null
        }
        Relationships: []
      }
      v_linha_tempo: {
        Row: {
          detalhe: string | null
          ocorrido_em: string | null
          pessoa_id: string | null
          tipo: string | null
          titulo: string | null
        }
        Relationships: []
      }
      v_meu_perfil: {
        Row: {
          acesso_academy: boolean | null
          acesso_conecta: boolean | null
          acesso_diretorio: boolean | null
          acesso_embaixadora: boolean | null
          bio: string | null
          completude_percentual: number | null
          cpf: string | null
          data_nascimento: string | null
          email_principal: string | null
          foto_url: string | null
          genero: string | null
          instagram: string | null
          linkedin: string | null
          nome: string | null
          nome_social: string | null
          papeis: Database["public"]["Enums"]["papel_tipo"][] | null
          pessoa_id: string | null
          site: string | null
          telefone_principal: string | null
          ultimo_acesso_em: string | null
        }
        Insert: {
          acesso_academy?: never
          acesso_conecta?: never
          acesso_diretorio?: never
          acesso_embaixadora?: never
          bio?: string | null
          completude_percentual?: never
          cpf?: string | null
          data_nascimento?: string | null
          email_principal?: never
          foto_url?: string | null
          genero?: string | null
          instagram?: string | null
          linkedin?: string | null
          nome?: string | null
          nome_social?: string | null
          papeis?: never
          pessoa_id?: string | null
          site?: string | null
          telefone_principal?: never
          ultimo_acesso_em?: string | null
        }
        Update: {
          acesso_academy?: never
          acesso_conecta?: never
          acesso_diretorio?: never
          acesso_embaixadora?: never
          bio?: string | null
          completude_percentual?: never
          cpf?: string | null
          data_nascimento?: string | null
          email_principal?: never
          foto_url?: string | null
          genero?: string | null
          instagram?: string | null
          linkedin?: string | null
          nome?: string | null
          nome_social?: string | null
          papeis?: never
          pessoa_id?: string | null
          site?: string | null
          telefone_principal?: never
          ultimo_acesso_em?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      acesso_vigente: {
        Args: {
          _pessoa_id: string
          _tipo: Database["public"]["Enums"]["acesso_tipo"]
        }
        Returns: boolean
      }
      buscar_pessoas: {
        Args: { _limite?: number; _termo: string }
        Returns: {
          cpf: string
          email: string
          nome: string
          papeis: Database["public"]["Enums"]["papel_tipo"][]
          pessoa_id: string
        }[]
      }
      conceder_papel: {
        Args: {
          _papel: Database["public"]["Enums"]["papel_tipo"]
          _pessoa_id: string
        }
        Returns: string
      }
      conceder_por_pagamento: {
        Args: {
          _dias?: number
          _pagamento_id: string
          _tipo: Database["public"]["Enums"]["acesso_tipo"]
        }
        Returns: string
      }
      e_admin: { Args: never; Returns: boolean }
      garantir_pessoa: {
        Args: { _cpf?: string; _email?: string; _nome?: string }
        Returns: string
      }
      lote_vigente: { Args: { _evento_id: string }; Returns: string }
      pessoa_atual: { Args: never; Returns: string }
      registrar_contato: {
        Args: {
          _principal?: boolean
          _tipo: Database["public"]["Enums"]["contato_tipo"]
          _valor: string
        }
        Returns: string
      }
      registrar_tour: {
        Args: {
          _concluido?: boolean
          _modulo: string
          _passo?: number
          _pulado?: boolean
          _versao?: number
        }
        Returns: {
          atualizado_em: string
          concluido_em: string | null
          criado_em: string
          id: string
          modulo: string
          passo_atual: number
          pessoa_id: string
          pulado_em: string | null
          versao: number
        }
        SetofOptions: {
          from: "*"
          to: "tour_progresso"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      revogar_papel: {
        Args: {
          _papel: Database["public"]["Enums"]["papel_tipo"]
          _pessoa_id: string
        }
        Returns: boolean
      }
      situacao_acesso: {
        Args: {
          _pessoa_id: string
          _tipo: Database["public"]["Enums"]["acesso_tipo"]
        }
        Returns: {
          dias_desde_fim: number
          em_carencia: boolean
          origem: Database["public"]["Enums"]["acesso_origem"]
          vence_em: string
          vigente: boolean
        }[]
      }
      so_digitos: { Args: { txt: string }; Returns: string }
      tem_papel: {
        Args: {
          _papel: Database["public"]["Enums"]["papel_tipo"]
          _pessoa_id: string
        }
        Returns: boolean
      }
      tenho_acesso: {
        Args: { _tipo: Database["public"]["Enums"]["acesso_tipo"] }
        Returns: boolean
      }
      tour_pendente: {
        Args: { _modulo: string; _versao?: number }
        Returns: boolean
      }
      vincular_cpf: { Args: { _cpf: string }; Returns: string }
    }
    Enums: {
      acesso_origem: "pagamento" | "cortesia" | "administrativo" | "importacao"
      acesso_tipo:
        | "diretorio"
        | "conecta"
        | "academy"
        | "evento"
        | "area_embaixadora"
      contato_tipo: "email" | "telefone" | "whatsapp"
      midia_tipo: "logo" | "capa" | "galeria"
      pagamento_situacao: "pendente" | "confirmado" | "estornado" | "cancelado"
      papel_tipo:
        | "admin"
        | "editora"
        | "embaixadora"
        | "dona_negocio"
        | "assinante"
        | "aluna"
        | "facilitadora"
      publicacao_situacao: "rascunho" | "agendado" | "publicado" | "arquivado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      acesso_origem: ["pagamento", "cortesia", "administrativo", "importacao"],
      acesso_tipo: [
        "diretorio",
        "conecta",
        "academy",
        "evento",
        "area_embaixadora",
      ],
      contato_tipo: ["email", "telefone", "whatsapp"],
      midia_tipo: ["logo", "capa", "galeria"],
      pagamento_situacao: ["pendente", "confirmado", "estornado", "cancelado"],
      papel_tipo: [
        "admin",
        "editora",
        "embaixadora",
        "dona_negocio",
        "assinante",
        "aluna",
        "facilitadora",
      ],
      publicacao_situacao: ["rascunho", "agendado", "publicado", "arquivado"],
    },
  },
} as const
