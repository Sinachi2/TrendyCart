import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Trash2, ShoppingBag, ArrowRight, Sparkles, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNGN } from "@/lib/currency";

interface CartItem {
  id: string;
  quantity: number;
  product_id: string;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    stock_quantity: number | null;
  };
}

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadCart();
  }, [user, navigate]);

  const loadCart = async () => {
    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select(`
          id,
          quantity,
          product_id,
          products (
            id,
            name,
            price,
            image_url,
            stock_quantity
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedData = data?.map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        product_id: item.product_id,
        product: item.products,
      })) || [];

      setCartItems(formattedData);
    } catch (error) {
      console.error("Error loading cart:", error);
      toast({
        title: "Error",
        description: "Failed to load cart items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: newQuantity })
        .eq("id", itemId);

      if (error) throw error;

      setCartItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );

      window.dispatchEvent(new Event("cartUpdated"));
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive",
      });
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      setCartItems((prev) => prev.filter((item) => item.id !== itemId));
      window.dispatchEvent(new Event("cartUpdated"));

      toast({
        title: "Item removed",
        description: "Item has been removed from your cart",
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

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const shipping = subtotal > 50 ? 0 : 9.99;
  const total = subtotal + shipping;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary mb-3">
            <ShoppingBag className="h-3 w-3" />
            Your bag
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold gradient-text">Shopping Cart</h1>
          <p className="text-muted-foreground mt-2">
            {cartItems.length > 0
              ? `${cartItems.length} item${cartItems.length !== 1 ? "s" : ""} ready to checkout`
              : "Items you add will appear here"}
          </p>
        </div>

        {cartItems.length === 0 ? (
          <Card className="p-12 text-center border-dashed bg-muted/20">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
              <ShoppingBag className="h-16 w-16 mx-auto text-primary relative" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">
              Discover trending products and start shopping today.
            </p>
            <Button asChild size="lg" className="btn-glow bg-gradient-primary">
              <Link to="/shop">
                <Sparkles className="h-4 w-4 mr-2" />
                Browse Products
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item, idx) => (
                <Card
                  key={item.id}
                  className="hover-lift border-border/60 animate-fade-in"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <Link to={`/product/${item.product.id}`} className="shrink-0">
                        <img
                          src={item.product.image_url || "/placeholder.svg"}
                          alt={item.product.name}
                          className="w-24 h-24 object-cover rounded-xl border border-border/50 hover:scale-105 transition-transform"
                        />
                      </Link>
                      <div className="flex-1">
                        <Link
                          to={`/product/${item.product.id}`}
                          className="font-semibold mb-1 block hover:text-primary transition-colors line-clamp-2"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-lg font-bold text-primary mb-0.5">
                          ${item.product.price.toFixed(2)}
                        </p>
                        <p className="text-sm font-medium text-foreground/70 mb-3">
                          {formatNGN(item.product.price)}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center border border-border rounded-md">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                              disabled={item.quantity <= 1}
                            >
                              -
                            </Button>
                            <span className="px-4 font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                              disabled={
                                item.quantity >=
                                (item.product.stock_quantity ?? 0)
                              }
                            >
                              +
                            </Button>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-24 border-primary/20 shadow-elegant overflow-hidden">
                <div className="h-1 bg-gradient-primary" />
                <CardContent className="p-6 space-y-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Tag className="h-5 w-5 text-primary" />
                    Order Summary
                  </h2>
                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium text-right">
                        ${subtotal.toFixed(2)}
                        <span className="block text-xs text-muted-foreground">{formatNGN(subtotal)}</span>
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-medium text-right">
                        {shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}
                        {shipping > 0 && (
                          <span className="block text-xs text-muted-foreground">{formatNGN(shipping)}</span>
                        )}
                      </span>
                    </div>
                    {subtotal <= 50 && (
                      <p className="text-xs text-muted-foreground">
                        Add ${(50 - subtotal).toFixed(2)} more for free shipping
                      </p>
                    )}
                  </div>

                  <Separator />

                  <div className="flex justify-between items-start text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary text-right">
                      ${total.toFixed(2)}
                      <span className="block text-sm font-semibold text-foreground/70">{formatNGN(total)}</span>
                    </span>
                  </div>

                  <Button
                    onClick={() => navigate("/checkout")}
                    className="w-full btn-glow bg-gradient-primary hover:opacity-90"
                    size="lg"
                  >
                    Proceed to Checkout
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => navigate("/shop")}
                    className="w-full"
                  >
                    Continue Shopping
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Cart;
