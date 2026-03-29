-- Activate limited-time deals for more products with variety
UPDATE products SET is_deal_active = true, deal_expires_at = NOW() + INTERVAL '8 hours'
WHERE id = 'efa1825c-f836-430e-97ca-0a94298007a9'; -- Breville Barista Express

UPDATE products SET is_deal_active = true, deal_expires_at = NOW() + INTERVAL '14 hours'
WHERE id = '00a312be-5bd1-4256-b989-4170543143b1'; -- Marshall Stanmore III

UPDATE products SET is_deal_active = true, deal_expires_at = NOW() + INTERVAL '20 hours'
WHERE id = '1239a826-b8ab-4c55-b33d-e80ba01a4b57'; -- Ninja Foodi Air Fryer

UPDATE products SET is_deal_active = true, deal_expires_at = NOW() + INTERVAL '30 hours'
WHERE id = 'b3589d30-bd2a-43b0-8a5e-af919db34b0c'; -- Razer Blade 15

UPDATE products SET is_deal_active = true, deal_expires_at = NOW() + INTERVAL '40 hours'
WHERE id = '6e5da7d5-5885-4686-8c37-f762850c3ba1'; -- Reformation Dress

UPDATE products SET is_deal_active = true, deal_expires_at = NOW() + INTERVAL '52 hours'
WHERE id = 'ad3ce80e-c80a-4327-8128-6980250f23a2'; -- Osprey Atmos 65 Pack

-- Refresh existing deals that may have expired
UPDATE products SET deal_expires_at = NOW() + INTERVAL '12 hours'
WHERE id = '093f12d7-83fd-488e-9642-44a5c52fd975' AND is_deal_active = true;

UPDATE products SET deal_expires_at = NOW() + INTERVAL '18 hours'
WHERE id = 'ba7fae13-01e9-4e3f-80e4-bdec071ec22f' AND is_deal_active = true;

UPDATE products SET deal_expires_at = NOW() + INTERVAL '24 hours'
WHERE id = '9870cf77-4f73-461e-a718-e5e8de875862' AND is_deal_active = true;

UPDATE products SET deal_expires_at = NOW() + INTERVAL '36 hours'
WHERE id = '4bae369a-d8f8-40dd-b7bf-bd00d06c43a2' AND is_deal_active = true;

UPDATE products SET deal_expires_at = NOW() + INTERVAL '48 hours'
WHERE id = '3128c499-c3f1-405d-b54f-1b02e15447ca' AND is_deal_active = true;

UPDATE products SET deal_expires_at = NOW() + INTERVAL '42 hours'
WHERE id = '5ab87ae8-6226-4261-a0d5-1b32f06caf54' AND is_deal_active = true;