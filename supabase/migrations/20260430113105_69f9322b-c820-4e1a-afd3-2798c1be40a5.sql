-- Reduce product prices by ~25%, preserving original_price as the pre-discount price
UPDATE public.products
SET
  original_price = COALESCE(original_price, price),
  price = ROUND((price * 0.75)::numeric, 2)
WHERE price IS NOT NULL;