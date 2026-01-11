-- Add confirmation fields to event_registrations
ALTER TABLE public.event_registrations
ADD COLUMN IF NOT EXISTS confirmation_email_1_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS confirmation_email_2_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS confirmation_email_3_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS presence_confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS confirmation_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS reminder_2h_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS welcome_email_sent_at TIMESTAMP WITH TIME ZONE;

-- Create index for confirmation token lookups
CREATE INDEX IF NOT EXISTS idx_event_registrations_confirmation_token 
ON public.event_registrations(confirmation_token) 
WHERE confirmation_token IS NOT NULL;

-- Create index for scheduler queries
CREATE INDEX IF NOT EXISTS idx_event_registrations_presence_confirmed 
ON public.event_registrations(event_id, presence_confirmed_at) 
WHERE presence_confirmed_at IS NULL;