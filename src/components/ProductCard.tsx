import { ShoppingCart, Heart, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number | null;
  image: string | null;
  category: string;
  isNew?: boolean | null;
  stockQuantity?: number | null;
  onQuickView?: () => void;
}

const ProductCard = ({ 
  id, 
  name, 
  price, 
  originalPrice, 
  image, 
  category, 
  isNew, 
  stockQuantity = 0,
  onQuickView 
}: ProductCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkWishlistStatus();
    }
  }, [user, id]);

  const checkWishlistStatus = async () => {
    try {
      const { data } = await supabase
        .from("wishlist")
        .select("id")
        .eq("user_id", user?.id)
        .eq("product_id", id)
        .maybeSingle();
      
      setIsWishlisted(!!data);
    } catch (error) {
      console.error("Error checking wishlist:", error);
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to save items to wishlist",
      });
      navigate("/auth");
      return;
    }

    setWishlistLoading(true);
    try {
      if (isWishlisted) {
        const { error } = await supabase
          .from("wishlist")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", id);

        if (error) throw error;
        setIsWishlisted(false);
        toast({
          title: "Removed from wishlist",
          description: `${name} has been removed from your wishlist`,
        });
      } else {
        const { error } = await supabase
          .from("wishlist")
          .insert({ user_id: user.id, product_id: id });

        if (error) throw error;
        setIsWishlisted(true);
        toast({
          title: "Added to wishlist",
          description: `${name} has been saved to your wishlist`,
        });
      }
      window.dispatchEvent(new Event("wishlistUpdated"));
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      toast({
        title: "Error",
        description: "Failed to update wishlist",
        variant: "destructive",
      });
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to add items to cart",
      });
      navigate("/auth");
      return;
    }

    if (stockQuantity !== null && stockQuantity <= 0) {
      toast({
        title: "Out of stock",
        description: "This item is currently unavailable",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("cart_items")
        .upsert({
          user_id: user.id,
          product_id: id,
          quantity: 1,
        }, {
          onConflict: "user_id,product_id",
        });

      if (error) throw error;

      toast({
        title: "Added to cart",
        description: `${name} has been added to your cart`,
      });

      window.dispatchEvent(new Event("cartUpdated"));
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    }
  };

  const getStockStatus = () => {
    if (stockQuantity === null || stockQuantity === undefined) return null;
    if (stockQuantity <= 0) return { label: "Out of Stock", color: "bg-destructive text-destructive-foreground" };
    if (stockQuantity <= 5) return { label: `Only ${stockQuantity} left`, color: "bg-orange-500 text-white" };
    return { label: "In Stock", color: "bg-green-500 text-white" };
  };

  const stockStatus = getStockStatus();
  const isOutOfStock = stockQuantity !== null && stockQuantity <= 0;

  return (
    <Card className="group overflow-hidden hover:shadow-elegant transition-all duration-300 cursor-pointer" onClick={() => navigate(`/product/${id}`)}>
      <div className="relative overflow-hidden bg-muted">
        <img
          src={image || "/placeholder.svg"}
          alt={name}
          className={`w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500 ${isOutOfStock ? "opacity-50" : ""}`}
        />
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isNew && (
            <Badge className="bg-accent text-accent-foreground">
              New
            </Badge>
          )}
          {stockStatus && (
            <Badge className={stockStatus.color}>
              {stockStatus.label}
            </Badge>
          )}
        </div>
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <Button
            size="icon"
            variant="secondary"
            className={`transition-all ${
              isWishlisted 
                ? "opacity-100 bg-red-500 hover:bg-red-600 text-white" 
                : "opacity-0 group-hover:opacity-100"
            }`}
            onClick={handleToggleWishlist}
            disabled={wishlistLoading}
          >
            <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
          </Button>
          {onQuickView && (
            <Button
              size="icon"
              variant="secondary"
              className="opacity-0 group-hover:opacity-100 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                onQuickView();
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground mb-1">{category}</p>
        <h3 className="font-semibold text-lg mb-2 line-clamp-1">{name}</h3>
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary">${price}</span>
          {originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              ${originalPrice}
            </span>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Button 
          onClick={(e) => {
            e.stopPropagation();
            handleAddToCart();
          }} 
          className="w-full group-hover:bg-accent group-hover:text-accent-foreground transition-colors"
          disabled={isOutOfStock}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
