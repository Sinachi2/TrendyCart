-- Activate limited-time deals for products that already have discounted prices
-- Set deal_expires_at to various times in the next 24-72 hours for urgency
UPDATE products SET is_deal_active = true, deal_expires_at = NOW() + INTERVAL '18 hours'
WHERE id = 'ba7fae13-01e9-4e3f-80e4-bdec071ec22f'; -- Ganni Recycled Dress ($295 from $355)

UPDATE products SET is_deal_active = true, deal_expires_at = NOW() + INTERVAL '36 hours'
WHERE id = '4bae369a-d8f8-40dd-b7bf-bd00d06c43a2'; -- DJI Mini 3 Pro ($759 from $849)

UPDATE products SET is_deal_active = true, deal_expires_at = NOW() + INTERVAL '48 hours'
WHERE id = '3128c499-c3f1-405d-b54f-1b02e15447ca'; -- Asus ROG Ally ($599 from $699)

UPDATE products SET is_deal_active = true, deal_expires_at = NOW() + INTERVAL '24 hours'
WHERE id = '9870cf77-4f73-461e-a718-e5e8de875862'; -- Sonos Arc ($899 from $999)

UPDATE products SET is_deal_active = true, deal_expires_at = NOW() + INTERVAL '12 hours'
WHERE id = '093f12d7-83fd-488e-9642-44a5c52fd975'; -- Carhartt WIP Jacket ($198 from $248)

UPDATE products SET is_deal_active = true, deal_expires_at = NOW() + INTERVAL '42 hours'
WHERE id = '5ab87ae8-6226-4261-a0d5-1b32f06caf54'; -- Dr. Martens 1460 Boots ($180 from $200)