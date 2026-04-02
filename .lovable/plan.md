

# Premium eCommerce + AI Platform Upgrade

## Overview
Comprehensive UI/UX overhaul across homepage, chatbot, search, dashboard orders, and mobile responsiveness to achieve a production-grade SaaS aesthetic.

## 1. Homepage Hero Redesign
**File: `src/components/HeroChatInterface.tsx`**
- Replace static `ai-hero-bg.jpg` with a pure CSS animated gradient background (dark blue to purple with mesh-style radial overlays)
- Add CSS-animated floating geometric shapes (circles, blurred blobs) instead of static pulse orbs
- Increase headline size and improve typography hierarchy
- Add subtle grid/dot pattern overlay for depth
- Improve CTA button contrast and add glow effect
- Tighten spacing between badge, headline, chat box, and CTAs

**File: `src/index.css`**
- Add keyframes for gradient animation (`@keyframes gradient-shift`) and floating shapes
- Add utility classes: `.bg-hero-gradient`, `.floating-shape`

## 2. Search Bar Polish
**File: `src/components/SearchAutocomplete.tsx`**
- Already well-implemented with live search, keyboard nav, debounce, discount badges
- Minor polish: add subtle `backdrop-blur` to dropdown, improve focus ring styling, add search icon animation on focus
- Ensure dropdown has `max-h` with smooth scroll and proper z-index layering

## 3. Chatbot Widget Upgrade
**File: `src/components/ChatWidget.tsx`**
- Adjust button position: `bottom-24 lg:bottom-10 right-6` to prevent overlap with mobile nav
- Add chat window max-height constraint with `max-h-[min(500px,70vh)]`
- Improve header gradient (use primary-to-accent instead of pink-to-orange to match brand)
- Add message entrance animations (fade-in per message)
- Ensure proper spacing from screen edges on all devices

## 4. Dashboard Orders Section
**File: `src/pages/DashboardOrders.tsx`**
- Verify product thumbnails render correctly (join with products table for `image_url`)
- Add zebra-striped rows with `even:bg-muted/30`
- Add hover effect on rows `hover:bg-muted/50`
- Improve status badge styling with proper pill design
- Add responsive horizontal scroll wrapper for mobile (`overflow-x-auto`)
- Ensure sort indicators are visible and functional

## 5. Mobile Responsiveness
**Files: `src/components/MobileBottomNav.tsx`, `src/components/ChatWidget.tsx`, `src/pages/Home.tsx`**
- ChatWidget button: ensure it sits above mobile nav bar (already at `bottom-20 lg:bottom-8`)
- Chat window: add `max-h-[70vh]` and proper bottom offset on mobile
- Homepage sections: verify padding and spacing on small screens
- Dashboard orders table: wrap in `overflow-x-auto` with min-width on table

## 6. Global UI Polish
**File: `src/index.css`**
- Refine glassmorphism utility: `.glass { backdrop-blur: 16px; background: hsl(var(--card) / 0.7) }`
- Add hover-lift utility with smooth transform
- Add `btn-glow` animation for primary CTAs
- Ensure dark mode gradients and overlays look correct

## Technical Notes
- No new dependencies needed (framer-motion and all UI libs already installed)
- No database changes required
- All changes are CSS/component-level styling improvements
- The hero background will use pure CSS gradients (no external images needed), keeping bundle size small

## Files to Modify
1. `src/components/HeroChatInterface.tsx` - Hero redesign with animated gradient
2. `src/components/ChatWidget.tsx` - Position and style fixes
3. `src/components/SearchAutocomplete.tsx` - Minor dropdown polish
4. `src/pages/DashboardOrders.tsx` - Table styling improvements
5. `src/index.css` - New animations and utility classes

