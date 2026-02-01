-- Create notifications table for real-time in-app notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- Admins and system can insert notifications
CREATE POLICY "Admins can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = user_id);

-- Enable realtime for instant notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Add deal columns to products table
ALTER TABLE public.products
ADD COLUMN deal_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN is_deal_active BOOLEAN NOT NULL DEFAULT false;

-- Create index for active deals query performance
CREATE INDEX idx_products_active_deals ON public.products (is_deal_active, deal_expires_at) WHERE is_deal_active = true;