-- Add temperature to conecta_referrals
ALTER TABLE public.conecta_referrals 
  ADD COLUMN IF NOT EXISTS temperature text NOT NULL DEFAULT 'warm';

-- Add meeting_id to conecta_invitations for tracking which meeting guest attended
ALTER TABLE public.conecta_invitations 
  ADD COLUMN IF NOT EXISTS meeting_id uuid REFERENCES public.conecta_meetings(id) ON DELETE SET NULL;

-- Index for querying invitations by meeting
CREATE INDEX IF NOT EXISTS idx_conecta_invitations_meeting_id ON public.conecta_invitations(meeting_id) WHERE meeting_id IS NOT NULL;

-- RLS for send-conecta-email edge function access (service role handles it)
