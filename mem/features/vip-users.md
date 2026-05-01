---
name: VIP Free Orders
description: VIP emails get 100% off and free shipping at checkout
type: feature
---
VIP_EMAILS in src/lib/vip.ts: `ezeonyekasinachi@gmail.com`, `ezeonyekasinachifranklin@gmail.com`.
- When the logged-in user's email matches, both Cart and Checkout force shipping=0, total=0, ignore coupon math.
- Sole site admin: `ezeonyekasinachi@gmail.com` (assigned 'admin' role in user_roles).
- UI shows "VIP — 100% off" badge in totals.
