DELETE FROM public.evento_inscricoes a USING public.evento_inscricoes b
 WHERE a.pessoa_id IS NOT NULL AND a.evento_id = b.evento_id AND a.pessoa_id = b.pessoa_id AND a.criado_em < b.criado_em;
ALTER TABLE public.evento_inscricoes ADD CONSTRAINT evento_inscricoes_evento_pessoa_key UNIQUE (evento_id, pessoa_id);