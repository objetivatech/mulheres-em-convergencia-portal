-- Create business messages table for contact forms
CREATE TABLE IF NOT EXISTS public.business_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread'::text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create business message replies table
CREATE TABLE IF NOT EXISTS public.business_message_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.business_messages(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  reply_text TEXT NOT NULL,
  is_business_owner BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_message_replies ENABLE ROW LEVEL SECURITY;

-- RLS policies for business messages
CREATE POLICY "Business owners can view their messages" 
ON public.business_messages 
FOR SELECT 
USING (business_id IN (
  SELECT id FROM public.businesses WHERE owner_id = auth.uid()
));

CREATE POLICY "Business owners can update their messages" 
ON public.business_messages 
FOR UPDATE 
USING (business_id IN (
  SELECT id FROM public.businesses WHERE owner_id = auth.uid()
));

CREATE POLICY "Anyone can create business messages" 
ON public.business_messages 
FOR INSERT 
WITH CHECK (true);

-- RLS policies for message replies  
CREATE POLICY "Business owners and message senders can view replies" 
ON public.business_message_replies 
FOR SELECT 
USING (
  message_id IN (
    SELECT id FROM public.business_messages 
    WHERE business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  )
);

CREATE POLICY "Business owners can create replies" 
ON public.business_message_replies 
FOR INSERT 
WITH CHECK (
  message_id IN (
    SELECT id FROM public.business_messages 
    WHERE business_id IN (
      SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_messages_business_id ON public.business_messages(business_id);
CREATE INDEX IF NOT EXISTS idx_business_messages_status ON public.business_messages(status);
CREATE INDEX IF NOT EXISTS idx_business_message_replies_message_id ON public.business_message_replies(message_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_business_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_business_messages_updated_at
  BEFORE UPDATE ON public.business_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_business_messages_updated_at();