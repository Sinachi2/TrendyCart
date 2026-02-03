

# Multi-Step Sidebar Checkout Flow

This plan implements a premium, modern checkout experience using slide-in sidebars that flow seamlessly from the cart, eliminating full-page redirects and keeping users engaged.

---

## Overview

When users click "Checkout" from the cart sidebar, instead of navigating to `/checkout`, a new multi-step sidebar flow begins:

```text
Cart Sidebar → Item Selection Sidebar → Payment Method Sidebar → Confirmation
```

---

## Current State

The existing flow:
- Cart sidebar opens from the navbar
- "Checkout" button navigates to `/checkout` (full-page)
- Multi-step process happens on a separate page

## New Flow

- Cart sidebar opens from navbar
- "Checkout" button opens **Item Selection Sidebar** (cart sidebar closes)
- User selects items → opens **Payment Method Sidebar**
- User selects payment → shows payment details and confirms
- All within sidebars - no page navigation required

---

## Component Architecture

### New Components

**1. `CheckoutItemsSidebar.tsx`**
A sidebar for selecting which items to purchase:
- Displays all cart items with checkboxes
- "Select All" toggle
- Real-time price calculation
- "Continue" button to open payment sidebar

**2. `CheckoutPaymentSidebar.tsx`**
A sidebar for payment method selection:
- Two premium cards: Bank Transfer / Cryptocurrency
- Payment details with copy-to-clipboard
- Transaction reference input
- Payment proof upload
- "Submit Order" button

---

## Detailed Component Design

### CheckoutItemsSidebar

**Props:**
- `open: boolean`
- `onOpenChange: (open: boolean) => void`
- `cartItems: CartItem[]`
- `onContinue: (selectedItems: CartItem[], total: number) => void`

**Features:**
- Header: "Select Items to Pay For"
- Select All / Deselect All toggle with item count
- Scrollable list of items with:
  - Checkbox
  - Product image
  - Product name
  - Quantity
  - Individual price
- Dynamic total calculation at bottom
- "Continue to Payment" button (disabled if no items selected)
- Smooth slide-in animation from right

### CheckoutPaymentSidebar

**Props:**
- `open: boolean`
- `onOpenChange: (open: boolean) => void`
- `selectedItems: CartItem[]`
- `totalAmount: number`
- `onOrderComplete: (orderId: string) => void`

**Features:**
- Header: "Choose Payment Method"
- Back button to return to item selection
- Two payment method cards:
  - **Bank Transfer Card**
    - Icon and label
    - Bank details (Fidelity Bank)
    - Account name & number with copy buttons
  - **Cryptocurrency Card**
    - Icon and label  
    - Network: USDT (BEP20)
    - Wallet address with copy button
- Selected method highlighted with border
- Transaction reference input
- Payment proof upload section:
  - File input with preview
  - Supported formats: JPG, PNG, WebP, PDF
  - Max 5MB validation
- Order summary collapse/expand
- "Submit Order" button
- Success state with order ID

---

## Modified Components

### CartSidebar.tsx

Update the checkout flow:
- Remove `navigate("/checkout")`
- Add state: `showItemSelection: boolean`
- "Checkout" button now:
  - Closes cart sidebar
  - Opens CheckoutItemsSidebar
- Pass cart items to the new sidebar

---

## State Flow

```text
1. User opens cart → CartSidebar visible
2. User clicks "Checkout" → CartSidebar closes, CheckoutItemsSidebar opens
3. User selects items, clicks "Continue" → CheckoutItemsSidebar closes, CheckoutPaymentSidebar opens
4. User selects payment, uploads proof, clicks "Submit" → Order created
5. Success state shown → User can close or view order
```

---

## UI/UX Details

### Visual Design
- Sidebars slide in from the right
- Consistent width: `sm:max-w-lg` (same as cart)
- Overlay background with blur effect
- Smooth transitions between sidebars (300ms ease)

### Step Indicator
Inside each sidebar, show current position:
```text
┌─────────────────────────────┐
│  ● Select Items             │
│  ○ Payment Method           │
└─────────────────────────────┘
```

### Mobile Experience
- Full-width sidebars on mobile
- Touch-friendly checkboxes and buttons
- Sticky footer with action button
- Smooth gesture support for closing

### Premium Feel
- Subtle shadows and borders
- Glassmorphism effects on cards
- Animated checkmarks on selection
- Loading states with spinners
- Success celebration animation

---

## Payment Details Display

### Bank Transfer
```text
┌─────────────────────────────────────┐
│ 🏦 Bank Transfer                    │
├─────────────────────────────────────┤
│ Bank:           Fidelity Bank       │
│ Account Name:   SINACHI FRANKLIN... │ [📋]
│ Account Number: 6152779644          │ [📋]
└─────────────────────────────────────┘
```

### Cryptocurrency
```text
┌─────────────────────────────────────┐
│ ₿ Cryptocurrency                    │
├─────────────────────────────────────┤
│ Network: USDT (BEP20)               │
│ Wallet Address:                     │
│ 0x689dc021f5b7ed12883a...           │ [📋]
└─────────────────────────────────────┘
```

---

## Order Creation Flow

When user clicks "Submit Order":

1. Validate all required fields
2. Create order in `orders` table with selected items total
3. Create `order_items` for selected items only
4. Upload payment proof to `payment-proofs` storage bucket
5. Create `payment_proofs` record with pending status
6. Remove selected items from cart (keep unselected)
7. Trigger `cartUpdated` event
8. Send confirmation email via edge function
9. Show success state with order ID
10. Option to close sidebar or view order

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| No items selected | Disable "Continue" button |
| No payment method | Disable "Submit" button |
| No proof uploaded | Show error, prevent submission |
| Network error | Toast notification, retain form state |
| Storage upload fails | Show retry option |

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/CheckoutItemsSidebar.tsx` | Item selection sidebar |
| `src/components/CheckoutPaymentSidebar.tsx` | Payment method sidebar |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/CartSidebar.tsx` | Add checkout sidebar state management |

---

## Technical Implementation

### CartSidebar State Management

```typescript
// Add to CartSidebar.tsx
const [showItemSelection, setShowItemSelection] = useState(false);
const [showPaymentMethod, setShowPaymentMethod] = useState(false);
const [selectedItems, setSelectedItems] = useState<CartItem[]>([]);
const [totalAmount, setTotalAmount] = useState(0);

const handleCheckout = () => {
  onOpenChange(false); // Close cart
  setShowItemSelection(true); // Open item selection
};

const handleItemsContinue = (items: CartItem[], total: number) => {
  setSelectedItems(items);
  setTotalAmount(total);
  setShowItemSelection(false);
  setShowPaymentMethod(true);
};

const handleOrderComplete = (orderId: string) => {
  loadCartItems(); // Refresh cart
  toast({ title: "Order placed!", description: "..." });
  navigate(`/order-confirmation/${orderId}`);
};
```

### Smooth Transitions
- Use CSS transitions for sidebar open/close
- Stagger animations when switching between sidebars
- Fade overlay between transitions

---

## Implementation Order

1. Create `CheckoutItemsSidebar.tsx` component
2. Create `CheckoutPaymentSidebar.tsx` component
3. Update `CartSidebar.tsx` to manage the sidebar flow
4. Add smooth transitions and animations
5. Test on mobile and desktop

