-- Remover políticas que causam recursão infinita
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage form fields" ON event_form_fields;

-- Recriar política de profiles usando has_role() (SECURITY DEFINER - sem recursão)
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  id = auth.uid() 
  OR 
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- Recriar política de event_form_fields usando has_role()
CREATE POLICY "Admins can manage form fields"
ON event_form_fields FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
);