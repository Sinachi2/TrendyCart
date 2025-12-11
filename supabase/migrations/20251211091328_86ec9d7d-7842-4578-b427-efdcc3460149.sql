-- Add tracking columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS tracking_number text,
ADD COLUMN IF NOT EXISTS carrier text,
ADD COLUMN IF NOT EXISTS estimated_delivery timestamp with time zone,
ADD COLUMN IF NOT EXISTS tracking_url text;

-- Create payment_methods table for saved cards
CREATE TABLE public.payment_methods (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  card_last_four text NOT NULL,
  card_brand text NOT NULL,
  exp_month integer NOT NULL,
  exp_year integer NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  stripe_payment_method_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS policies for payment_methods
CREATE POLICY "Users can view their own payment methods" 
ON public.payment_methods FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment methods" 
ON public.payment_methods FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment methods" 
ON public.payment_methods FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment methods" 
ON public.payment_methods FOR DELETE 
USING (auth.uid() = user_id);

-- Enable realtime for orders (for tracking updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;