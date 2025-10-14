-- FASE 1: Criar Bucket de Storage para Logos de Parceiros

-- Criar bucket público para logos de parceiros
INSERT INTO storage.buckets (id, name, public)
VALUES ('partner-logos', 'partner-logos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Admins podem fazer upload de logos
CREATE POLICY "Admins can upload partner logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'partner-logos' 
  AND get_current_user_admin_status()
);

-- RLS Policy: Qualquer um pode visualizar logos (público)
CREATE POLICY "Anyone can view partner logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'partner-logos');

-- RLS Policy: Admins podem atualizar logos
CREATE POLICY "Admins can update partner logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'partner-logos' 
  AND get_current_user_admin_status()
);

-- RLS Policy: Admins podem deletar logos
CREATE POLICY "Admins can delete partner logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'partner-logos' 
  AND get_current_user_admin_status()
);