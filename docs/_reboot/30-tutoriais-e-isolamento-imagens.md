# 30 — Tutoriais, isolamento de imagens e cortesias

## Técnico
- `r2-storage`: perfil (admin/editora) lido de `papeis` no servidor. Não-admin: pasta forçada `usuarias/<auth uid>/<perfil|negocio|galeria|conecta|geral>`; listagem restrita ao próprio prefixo; exclusão só na própria pasta. Editora lista tudo exceto `usuarias/` alheias. Admin sem restrição.
- Cortesias via RPC `conceder_cortesia(_pessoa_id,_tipo,_dias,_motivo)` e `revogar_concessao(_id,_motivo)`; a tabela `concessoes_acesso` segue sem escrita direta.
- Tutoriais: `src/lib/tutoriais.ts` + `CentralTutoriais.tsx`.

## Operacional
- Imagens antigas enviadas por associadas antes desta mudança estão na pasta da equipe e só a equipe vê.
- Novo tutorial: acrescentar item à lista correspondente em `src/lib/tutoriais.ts`.

## Manual (leigo)
- Associada: menu "Tutoriais" na Minha área. Suas imagens são só suas.
- Equipe: menu "Tutoriais" no painel. Para dar cortesia: Pessoas → Abrir ficha → Acessos → escolher área → dias → Dar cortesia.
