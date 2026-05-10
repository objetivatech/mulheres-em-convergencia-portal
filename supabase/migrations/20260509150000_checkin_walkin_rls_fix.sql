-- Permite UPDATE em registros de walk-in (user_id IS NULL) por qualquer pessoa
-- Cobre o caso de reativação de inscrição existente no fluxo de check-in presencial
-- A política SELECT aberta foi intencionalmente omitida — expõe PII de todos os inscritos;
-- o check-in é feito por staff autenticado (admin), que já tem acesso total via "Admins can manage all registrations"
CREATE POLICY "Anyone can update walkin registrations"
  ON public.event_registrations
  FOR UPDATE
  TO public
  USING (user_id IS NULL)
  WITH CHECK (user_id IS NULL);
