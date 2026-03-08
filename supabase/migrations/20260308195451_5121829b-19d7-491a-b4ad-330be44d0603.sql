-- Etapa 5: New pitch fields on conecta_profiles
ALTER TABLE public.conecta_profiles
  ADD COLUMN IF NOT EXISTS area_of_expertise text,
  ADD COLUMN IF NOT EXISTS skills_tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS pitch_what_i_do text,
  ADD COLUMN IF NOT EXISTS pitch_ideal_client text,
  ADD COLUMN IF NOT EXISTS pitch_how_to_refer text,
  ADD COLUMN IF NOT EXISTS contact_email text;

-- Etapa 4: Flag to sync events with Conecta+
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS conecta_sync boolean NOT NULL DEFAULT false;

-- Index for filtering synced events
CREATE INDEX IF NOT EXISTS idx_events_conecta_sync ON public.events(conecta_sync) WHERE conecta_sync = true;
