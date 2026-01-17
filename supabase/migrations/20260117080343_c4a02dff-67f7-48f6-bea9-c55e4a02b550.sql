-- Create payment_proofs table for storing payment verification requests
CREATE TABLE public.payment_proofs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('bank_transfer', 'cryptocurrency')),
  proof_url TEXT NOT NULL,
  transaction_reference TEXT,
  amount DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  admin_notes TEXT,
  verified_by UUID,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;

-- Users can view their own payment proofs
CREATE POLICY "Users can view their own payment proofs"
ON public.payment_proofs
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create payment proofs
CREATE POLICY "Users can create payment proofs"
ON public.payment_proofs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all payment proofs
CREATE POLICY "Admins can view all payment proofs"
ON public.payment_proofs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update payment proofs
CREATE POLICY "Admins can update payment proofs"
ON public.payment_proofs
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for payment proofs
CREATE POLICY "Users can upload their payment proofs"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own payment proofs"
ON storage.objects
FOR SELECT
USING (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all payment proofs"
ON storage.objects
FOR SELECT
USING (bucket_id = 'payment-proofs' AND public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_payment_proofs_updated_at
BEFORE UPDATE ON public.payment_proofs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();