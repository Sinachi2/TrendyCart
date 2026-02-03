import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { CheckoutItemsSidebar } from "./CheckoutItemsSidebar";
import { CheckoutPaymentSidebar } from "./CheckoutPaymentSidebar";

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

interface CartSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CartSidebar = ({ open, onOpenChange }: CartSidebarProps) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showItemSelection, setShowItemSelection] = useState(false);
  const [showPaymentMethod, setShowPaymentMethod] = useState(false);
  const [selectedItems, setSelectedItems] = useState<CartItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (open && user) {
      loadCartItems();
    }
  }, [open, user]);

  const loadCartItems = async () => {
    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select(`
          id,
          product_id,
          quantity,
          products (
            name,
            price,
            image_url
          )
        `);

      if (error) throw error;
      setCartItems(data || []);
    } catch (error) {
      console.error("Error loading cart:", error);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      setCartItems(cartItems.filter((item) => item.id !== itemId));
      window.dispatchEvent(new Event("cartUpdated"));

      toast({
        title: "Success",
        description: "Item removed from cart",
      });
    } catch (error) {
      console.error("Error removing item:", error);
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      });
    }
  };

  const clearAll = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user?.id);

      if (error) throw error;

      setCartItems([]);
      window.dispatchEvent(new Event("cartUpdated"));

      toast({
        title: "Success",
        description: "Cart cleared",
      });
    } catch (error) {
      console.error("Error clearing cart:", error);
      toast({
        title: "Error",
        description: "Failed to clear cart",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = () => {
    onOpenChange(false); // Close cart sidebar
    setShowItemSelection(true); // Open item selection sidebar
  };

  const handleItemsContinue = (items: CartItem[], total: number) => {
    setSelectedItems(items);
    setTotalAmount(total);
    setShowItemSelection(false);
    setShowPaymentMethod(true);
  };

  const handleBackToCart = () => {
    setShowItemSelection(false);
    onOpenChange(true); // Reopen cart sidebar
  };

  const handleBackToItems = () => {
    setShowPaymentMethod(false);
    setShowItemSelection(true);
  };

  const handleOrderComplete = (orderId: string) => {
    setShowPaymentMethod(false);
    loadCartItems(); // Refresh cart
    navigate(`/order-confirmation/${orderId}`);
  };

  const handleShopAll = () => {
    onOpenChange(false);
    navigate("/shop");
  };

  const total = cartItems.reduce(
    (sum, item) => sum + (item.products?.price || 0) * item.quantity,
    0
  );

  return (
    <>
      {/* Main Cart Sidebar */}
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
          <SheetHeader className="px-6 py-4 border-b border-border/50">
            <SheetTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                <span>Shopping Cart</span>
                {cartItems.length > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">
                    ({cartItems.length} items)
                  </span>
                )}
              </div>
              {cartItems.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  disabled={loading}
                  className="text-muted-foreground hover:text-destructive text-xs"
                >
                  Clear All
                </Button>
              )}
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                  <ShoppingBag className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-[200px]">
                  Looks like you haven't added any products yet
                </p>
                <Button onClick={handleShopAll} className="shadow-sm">
                  Browse Products
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {cartItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex gap-3 p-3 bg-muted/30 rounded-xl relative group animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <img
                      src={item.products?.image_url}
                      alt={item.products?.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0 py-0.5">
                      <h4 className="font-medium text-sm truncate mb-0.5">
                        {item.products?.name}
                      </h4>
                      <p className="text-xs text-muted-foreground mb-1">
                        Qty: {item.quantity}
                      </p>
                      <p className="font-semibold text-primary text-sm">
                        ${((item.products?.price || 0) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => removeItem(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cartItems.length > 0 && (
            <div className="border-t border-border/50 px-6 py-4 space-y-4 bg-muted/20">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-xl font-bold">${total.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Shipping calculated at checkout
              </p>

              <div className="space-y-2">
                <Button onClick={handleCheckout} className="w-full shadow-sm" size="lg">
                  Proceed to Checkout
                </Button>
                <Button
                  onClick={handleShopAll}
                  variant="ghost"
                  className="w-full text-muted-foreground"
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Checkout Item Selection Sidebar */}
      <CheckoutItemsSidebar
        open={showItemSelection}
        onOpenChange={setShowItemSelection}
        cartItems={cartItems}
        onContinue={handleItemsContinue}
        onBack={handleBackToCart}
      />

      {/* Checkout Payment Sidebar */}
      <CheckoutPaymentSidebar
        open={showPaymentMethod}
        onOpenChange={setShowPaymentMethod}
        selectedItems={selectedItems}
        totalAmount={totalAmount}
        onBack={handleBackToItems}
        onOrderComplete={handleOrderComplete}
      />
    </>
  );
};
