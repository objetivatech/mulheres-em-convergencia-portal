-- Create contact_messages table
CREATE TABLE public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view all contact messages" 
ON public.contact_messages 
FOR SELECT 
USING (get_current_user_admin_status());

CREATE POLICY "Admins can update contact messages" 
ON public.contact_messages 
FOR UPDATE 
USING (get_current_user_admin_status());

CREATE POLICY "Anyone can create contact messages" 
ON public.contact_messages 
FOR INSERT 
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_contact_messages_updated_at
BEFORE UPDATE ON public.contact_messages
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();