import { ShoppingCart, Heart, X, Minus, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Product {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  image_url: string | null;
  category: string;
  description: string | null;
  is_new: boolean | null;
  stock_quantity: number | null;
}

interface ProductQuickViewProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}

const ProductQuickView = ({ product, open, onClose }: ProductQuickViewProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    if (user && product) {
      checkWishlistStatus();
    }
    setQuantity(1);
  }, [user, product]);

  const checkWishlistStatus = async () => {
    if (!product) return;
    try {
      const { data } = await supabase
        .from("wishlist")
        .select("id")
        .eq("user_id", user?.id)
        .eq("product_id", product.id)
        .maybeSingle();
      
      setIsWishlisted(!!data);
    } catch (error) {
      console.error("Error checking wishlist:", error);
    }
  };

  const handleToggleWishlist = async () => {
    if (!product) return;
    
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to save items to wishlist",
      });
      navigate("/auth");
      return;
    }

    try {
      if (isWishlisted) {
        await supabase.from("wishlist").delete().eq("user_id", user.id).eq("product_id", product.id);
        setIsWishlisted(false);
        toast({ title: "Removed from wishlist" });
      } else {
        await supabase.from("wishlist").insert({ user_id: user.id, product_id: product.id });
        setIsWishlisted(true);
        toast({ title: "Added to wishlist" });
      }
      window.dispatchEvent(new Event("wishlistUpdated"));
    } catch (error) {
      toast({ title: "Error", description: "Failed to update wishlist", variant: "destructive" });
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to add items to cart",
      });
      navigate("/auth");
      return;
    }

    try {
      const { error } = await supabase.from("cart_items").upsert({
        user_id: user.id,
        product_id: product.id,
        quantity,
      }, { onConflict: "user_id,product_id" });

      if (error) throw error;

      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart`,
      });
      window.dispatchEvent(new Event("cartUpdated"));
      onClose();
    } catch (error) {
      toast({ title: "Error", description: "Failed to add item to cart", variant: "destructive" });
    }
  };

  if (!product) return null;

  const isOutOfStock = product.stock_quantity !== null && product.stock_quantity <= 0;
  const stockStatus = product.stock_quantity === null ? null 
    : product.stock_quantity <= 0 ? { label: "Out of Stock", color: "bg-destructive" }
    : product.stock_quantity <= 5 ? { label: `Only ${product.stock_quantity} left`, color: "bg-orange-500" }
    : { label: "In Stock", color: "bg-green-500" };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-0">
          <div className="relative bg-muted">
            <img
              src={product.image_url || "/placeholder.svg"}
              alt={product.name}
              className={`w-full h-80 md:h-full object-cover ${isOutOfStock ? "opacity-50" : ""}`}
            />
            {product.is_new && (
              <Badge className="absolute top-4 left-4 bg-accent text-accent-foreground">New</Badge>
            )}
          </div>
          
          <div className="p-6 flex flex-col">
            <p className="text-sm text-muted-foreground mb-1">{product.category}</p>
            <h2 className="text-2xl font-bold mb-2">{product.name}</h2>
            
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl font-bold text-primary">${product.price}</span>
              {product.original_price && (
                <span className="text-lg text-muted-foreground line-through">${product.original_price}</span>
              )}
            </div>

            {stockStatus && (
              <Badge className={`${stockStatus.color} text-white w-fit mb-4`}>
                {stockStatus.label}
              </Badge>
            )}

            <p className="text-muted-foreground mb-6 flex-1">
              {product.description || "No description available."}
            </p>

            {!isOutOfStock && (
              <div className="flex items-center gap-4 mb-4">
                <span className="text-sm font-medium">Quantity:</span>
                <div className="flex items-center border rounded-md">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                className="flex-1" 
                onClick={handleAddToCart}
                disabled={isOutOfStock}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {isOutOfStock ? "Out of Stock" : "Add to Cart"}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleToggleWishlist}
                className={isWishlisted ? "text-red-500 border-red-500" : ""}
              >
                <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
              </Button>
            </div>

            <Button
              variant="link"
              className="mt-4"
              onClick={() => {
                onClose();
                navigate(`/product/${product.id}`);
              }}
            >
              View Full Details
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductQuickView;
