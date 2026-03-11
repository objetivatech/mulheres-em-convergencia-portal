
-- Add columns for 3-day and 1-day reminder tracking
ALTER TABLE public.event_registrations 
  ADD COLUMN IF NOT EXISTS reminder_3d_sent_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reminder_1d_sent_at timestamptz DEFAULT NULL;
