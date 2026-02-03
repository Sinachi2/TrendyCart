import { useState, useEffect } from "react";
import { Check, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  products: {
    name: string;
    price: number;
    image_url: string;
  };
}

interface CheckoutItemsSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartItems: CartItem[];
  onContinue: (selectedItems: CartItem[], total: number) => void;
  onBack: () => void;
}

export const CheckoutItemsSidebar = ({
  open,
  onOpenChange,
  cartItems,
  onContinue,
  onBack,
}: CheckoutItemsSidebarProps) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Select all items by default when sidebar opens
  useEffect(() => {
    if (open && cartItems.length > 0) {
      setSelectedIds(new Set(cartItems.map((item) => item.id)));
    }
  }, [open, cartItems]);

  const toggleItem = (itemId: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(itemId)) {
      newSet.delete(itemId);
    } else {
      newSet.add(itemId);
    }
    setSelectedIds(newSet);
  };

  const toggleAll = () => {
    if (selectedIds.size === cartItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(cartItems.map((item) => item.id)));
    }
  };

  const selectedItems = cartItems.filter((item) => selectedIds.has(item.id));
  const total = selectedItems.reduce(
    (sum, item) => sum + (item.products?.price || 0) * item.quantity,
    0
  );

  const handleContinue = () => {
    if (selectedItems.length > 0) {
      onContinue(selectedItems, total);
    }
  };

  const allSelected = selectedIds.size === cartItems.length && cartItems.length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader className="space-y-4">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Select Items to Pay For
          </SheetTitle>
          
          {/* Step indicator */}
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                1
              </div>
              <span className="font-medium">Select Items</span>
            </div>
            <div className="flex-1 h-px bg-border" />
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-medium">
                2
              </div>
              <span className="text-muted-foreground">Payment</span>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Select All Toggle */}
          <div
            className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={toggleAll}
          >
            <Checkbox
              checked={allSelected}
              onCheckedChange={toggleAll}
              className="data-[state=checked]:bg-primary"
            />
            <span className="font-medium">
              {allSelected ? "Deselect All" : "Select All"} ({cartItems.length} items)
            </span>
          </div>

          {/* Items List */}
          <div className="space-y-3">
            {cartItems.map((item) => {
              const isSelected = selectedIds.has(item.id);
              return (
                <div
                  key={item.id}
                  className={`flex gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => toggleItem(item.id)}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleItem(item.id)}
                    className="mt-1 data-[state=checked]:bg-primary"
                  />
                  <img
                    src={item.products?.image_url}
                    alt={item.products?.name}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate text-sm">
                      {item.products?.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.quantity}
                    </p>
                    <p className="font-semibold text-primary">
                      ${((item.products?.price || 0) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="flex items-center">
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t pt-4 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">
                {selectedItems.length} of {cartItems.length} items selected
              </p>
              <p className="text-lg font-bold">
                Total: <span className="text-primary">${total.toFixed(2)}</span>
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleContinue}
              className="w-full"
              size="lg"
              disabled={selectedItems.length === 0}
            >
              Continue to Payment
            </Button>
            <Button onClick={onBack} variant="outline" className="w-full">
              Back to Cart
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
