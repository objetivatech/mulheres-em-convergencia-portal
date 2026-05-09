-- Allow user_socioeconomic_data to be linked to event_registrations
-- even when the participant doesn't have a user account
ALTER TABLE public.user_socioeconomic_data
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.user_socioeconomic_data
  ADD COLUMN IF NOT EXISTS registration_id uuid REFERENCES public.event_registrations(id) ON DELETE CASCADE;

ALTER TABLE public.user_socioeconomic_data
  ADD CONSTRAINT socioeconomic_anchor_required
  CHECK (user_id IS NOT NULL OR registration_id IS NOT NULL);

CREATE UNIQUE INDEX IF NOT EXISTS usd_user_id_unique
  ON public.user_socioeconomic_data(user_id) WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS usd_registration_id_unique
  ON public.user_socioeconomic_data(registration_id) WHERE registration_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_socioeconomic_data' AND policyname = 'admin_full_access_socioeconomic'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY admin_full_access_socioeconomic ON public.user_socioeconomic_data
        FOR ALL TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
          )
        );
    $policy$;
  END IF;
END $$;
