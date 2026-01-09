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
    onOpenChange(true);
    navigate("/checkout");
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Shopping Cart ({cartItems.length})</span>
            {cartItems.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                disabled={loading}
              >
                Clear All
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground mb-6">
                Add some products to get started
              </p>
              <Button onClick={handleShopAll}>
                Shop All Products
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 border rounded-lg relative group"
                >
                  <img
                    src={item.products?.image_url}
                    alt={item.products?.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">
                      {item.products?.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.quantity}
                    </p>
                    <p className="font-semibold text-primary">
                      ${((item.products?.price || 0) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
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
          <div className="border-t pt-4 space-y-4">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total:</span>
              <span className="text-primary">${total.toFixed(2)}</span>
            </div>

            <div className="space-y-2">
              <Button onClick={handleCheckout} className="w-full" size="lg">
                Checkout
              </Button>
              <Button
                onClick={handleShopAll}
                variant="outline"
                className="w-full"
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
