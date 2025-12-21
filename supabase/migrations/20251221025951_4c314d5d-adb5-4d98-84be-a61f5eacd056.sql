-- 1) Adicionar política RLS para admins verem todos os profiles
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  id = auth.uid() 
  OR 
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.is_admin = true
  )
);

-- 2) Corrigir política RLS para event_form_fields - garantir que admins podem gerenciar
DROP POLICY IF EXISTS "Admins can manage form fields" ON event_form_fields;

CREATE POLICY "Admins can manage form fields"
ON event_form_fields FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);