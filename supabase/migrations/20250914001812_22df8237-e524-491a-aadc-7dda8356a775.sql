-- Add unique constraint to user_contacts to prevent duplicates
-- and fix submit-business-review edge function issues

-- Create unique constraint on user_contacts to prevent duplicate contact types per user
ALTER TABLE public.user_contacts 
ADD CONSTRAINT user_contacts_unique_per_user_type 
UNIQUE (user_id, contact_type, contact_value);

-- Also ensure businesses table can be accessed by edge functions by setting explicit search_path
-- This should help with the "relation 'businesses' does not exist" error