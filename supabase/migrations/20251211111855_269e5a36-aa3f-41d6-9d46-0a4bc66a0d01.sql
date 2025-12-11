-- Create coupons table
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL,
  min_order_amount NUMERIC DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Everyone can read active coupons (for validation)
CREATE POLICY "Active coupons are viewable by everyone" 
ON public.coupons 
FOR SELECT 
USING (is_active = true);

-- Admins can manage coupons
CREATE POLICY "Admins can insert coupons" 
ON public.coupons 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update coupons" 
ON public.coupons 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete coupons" 
ON public.coupons 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert sample coupons
INSERT INTO public.coupons (code, discount_type, discount_value, min_order_amount) VALUES
('WELCOME10', 'percentage', 10, 0),
('SAVE20', 'fixed', 20, 50),
('SUMMER25', 'percentage', 25, 100);