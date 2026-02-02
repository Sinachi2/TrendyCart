

# Improved Step-Based Checkout Flow

This plan redesigns the checkout experience with a modern, step-based flow that gives users full control over what they pay for and how they pay.

---

## Overview

The new checkout flow will guide users through 4 clear steps:

```text
Step 1: Select Items → Step 2: Shipping Address → Step 3: Payment Method → Step 4: Confirm & Pay
```

---

## Current State

The existing checkout:
- Redirects to `/checkout` with ALL cart items pre-selected
- Shipping and payment options are shown simultaneously
- Users cannot choose which specific items to checkout
- No step-based progression

---

## New User Experience

### Step 1: Select Items to Purchase
- Display all cart items with checkboxes
- "Select All" toggle at the top
- Real-time price updates as items are selected/deselected
- Show item images, names, quantities, and individual prices
- Minimum 1 item required to proceed
- "Continue" button to move to next step

### Step 2: Shipping Address
- Show saved addresses (if any) as selectable cards
- Option to enter a new address
- Form validation before proceeding
- Summary of selected items shown on the side
- "Back" button to return to item selection

### Step 3: Choose Payment Method
- Clear cards for Bank Transfer and Cryptocurrency
- Show payment details only after selection
- Copy-to-clipboard buttons for account/wallet info
- Transaction reference input (optional)
- Visual confirmation of selected method

### Step 4: Review & Submit Payment Proof
- Full order summary (items, shipping, payment method)
- Upload payment proof (image/PDF)
- Preview uploaded file
- Clear "Submit Order" button
- Success confirmation with order ID

---

## Component Architecture

### New Component: `CheckoutStepper.tsx`
A visual step indicator showing progress through the checkout:
- Step numbers with labels
- Active/completed/upcoming states
- Smooth transitions between steps

### Modified Component: `Checkout.tsx`
Complete refactor with:
- `checkoutStep` state (1-4)
- `selectedItems` state (Set of cart item IDs)
- `paymentMethod` state
- Conditional rendering based on current step
- Step navigation functions

---

## Step-by-Step Implementation

### 1. Create Checkout Stepper Component
New file: `src/components/CheckoutStepper.tsx`
- Props: `currentStep`, `steps` array
- Visual progress indicator
- Clickable steps to go back (not forward)

### 2. Refactor Checkout Page
Modify: `src/pages/Checkout.tsx`

**New State Variables:**
```
checkoutStep: number (1-4)
selectedItemIds: Set<string>
paymentMethod: "bank_transfer" | "crypto" | null
```

**Step 1 Component - Item Selection:**
- Checkbox list of cart items
- "Select All" / "Deselect All" toggle
- Dynamic total calculation
- Disabled continue if no items selected

**Step 2 Component - Shipping (existing logic):**
- Saved address selection
- New address form
- Form validation

**Step 3 Component - Payment Selection:**
- Two large selection cards
- Bank Transfer card with details
- Crypto card with wallet info
- Copy buttons for details
- Selection required to continue

**Step 4 Component - Review & Upload:**
- Order summary recap
- Payment proof upload (reuse PaymentProofUpload component logic)
- Final submission

### 3. Update Cart Integration
- "Checkout" from cart now goes to step 1 (not directly to shipping)
- Selected items persist in checkout state
- Unselected items remain in cart

---

## UI/UX Details

### Step Progress Indicator
```text
┌─────────────────────────────────────────────────────────┐
│  (1)        (2)         (3)          (4)               │
│   ●────────○──────────○────────────○                   │
│ Select   Shipping    Payment     Confirm               │
│ Items    Address     Method                            │
└─────────────────────────────────────────────────────────┘
```

### Mobile Responsiveness
- Steps stack vertically on small screens
- Full-width buttons
- Collapsible order summary
- Touch-friendly checkboxes

### Animations
- Smooth slide transitions between steps
- Fade in/out for content changes
- Progress bar animation

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| No items selected | Disable "Continue", show helper text |
| Invalid address | Show field errors, prevent progression |
| No payment method selected | Disable "Continue" button |
| No proof uploaded | Show error toast, prevent submission |
| Network error | Toast notification, retain form state |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Checkout.tsx` | Complete refactor with step-based flow |
| `src/components/CheckoutStepper.tsx` | **New file** - Step indicator |

---

## Technical Details

### State Management
- All checkout state managed in `Checkout.tsx`
- No need for context - single page flow
- Local storage backup for recovery (optional enhancement)

### Order Creation Flow
1. User completes all 4 steps
2. Create order with only SELECTED items
3. Create order_items for selected items only
4. Remove ONLY selected items from cart (unselected stay)
5. Upload payment proof to storage
6. Create payment_proof record
7. Redirect to order confirmation

### Price Calculations
```
selectedSubtotal = sum of (price × quantity) for selected items
shipping = selectedSubtotal > 50 ? 0 : 9.99
discount = applied coupon discount
total = selectedSubtotal + shipping - discount
```

---

## Implementation Order

1. Create `CheckoutStepper.tsx` component
2. Refactor `Checkout.tsx` with step state and navigation
3. Implement Step 1 (Item Selection)
4. Update Step 2 (Shipping - mostly existing code)
5. Implement Step 3 (Payment Method Selection)
6. Implement Step 4 (Review & Upload Proof)
7. Update order creation logic for partial cart checkout
8. Test complete flow on desktop and mobile

