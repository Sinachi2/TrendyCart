---
name: Dashboard Redesign
description: Both dashboards use a clean modern e-commerce style (Shopify+Stripe inspired)
type: design
---
- Admin (/dashboard) and User (/user-dashboard) share a consistent style: bg-muted/30, border-border/60, rounded-lg cards, hover:shadow-md.
- Admin sidebar simplified to 4 items: Overview, Orders, Products, Customers.
- User sidebar simplified to: Overview, My Orders, Profile, Wishlist.
- Pages: greeting bar → 4 KPI cards (small accent icon, uppercase label, big number) → main content + side card → recent orders TABLE (not list).
- Status badges use semantic color tints (amber/blue/violet/emerald/rose) at /10 opacity with matching text + /20 border.
- Admin overview includes a 7-day revenue area chart (recharts) with gradient fill in primary color.
- Quick-action buttons use ghost variant + h-11 + justify-start + rounded-lg.
