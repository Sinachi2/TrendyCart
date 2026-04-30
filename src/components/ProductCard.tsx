import { ShoppingCart, Heart, Eye, GitCompareArrows, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useProductCompare } from "@/contexts/ProductCompareContext";
import CountdownTimer from "@/components/CountdownTimer";
import { cn } from "@/lib/utils";
import { formatNGN, formatUSD } from "@/lib/currency";
import { useCurrency } from "@/contexts/CurrencyContext";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number | null;
  image: string | null;
  category: string;
  isNew?: boolean | null;
  stockQuantity?: number | null;
  description?: string | null;
  dealExpiresAt?: string | null;
  isDealActive?: boolean;
  averageRating?: number;
  reviewCount?: number;
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
  description,
  dealExpiresAt,
  isDealActive,
  averageRating = 0,
  reviewCount = 0,
  onQuickView 
}: ProductCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { addToCompare, removeFromCompare, isInCompare } = useProductCompare();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const handleToggleCompare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const product = {
      id,
      name,
      price,
      original_price: originalPrice ?? null,
      image_url: image,
      category,
      description: description ?? null,
      stock_quantity: stockQuantity,
    };

    if (isInCompare(id)) {
      removeFromCompare(id);
      toast({
        title: "Removed from compare",
        description: `${name} removed from comparison`,
      });
    } else {
      addToCompare(product);
      toast({
        title: "Added to compare",
        description: `${name} added to comparison`,
      });
    }
  };

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

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
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

    setIsAddingToCart(true);
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
    } finally {
      setIsAddingToCart(false);
    }
  };

  const getStockStatus = () => {
    if (stockQuantity === null || stockQuantity === undefined) return null;
    if (stockQuantity <= 0) return { label: "Out of Stock", variant: "destructive" as const };
    if (stockQuantity <= 5) return { label: `Only ${stockQuantity} left`, variant: "warning" as const };
    return { label: "In Stock", variant: "success" as const };
  };

  const stockStatus = getStockStatus();
  const isOutOfStock = stockQuantity !== null && stockQuantity <= 0;
  const discountPercent = originalPrice && originalPrice > price 
    ? Math.round(((originalPrice - price) / originalPrice) * 100) 
    : 0;
  
  const isDealExpired = dealExpiresAt ? new Date(dealExpiresAt) <= new Date() : false;
  const showDealTimer = isDealActive && dealExpiresAt && !isDealExpired;

  return (
    <Card 
      className={cn(
        "group overflow-hidden bg-card border-border/50 hover-lift cursor-pointer",
        "transition-all duration-300"
      )} 
      onClick={() => navigate(`/product/${id}`)}
    >
      <div className="relative overflow-hidden bg-muted/50">
        <img
          src={image || "/placeholder.svg"}
          alt={name}
          loading="lazy"
          className={cn(
            "w-full h-56 sm:h-64 object-cover transition-transform duration-500",
            "group-hover:scale-105",
            isOutOfStock && "opacity-60 grayscale-[30%]"
          )}
        />
        
        {/* Badges - Top Left */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {isNew && (
            <Badge className="bg-accent text-accent-foreground shadow-sm">
              New
            </Badge>
          )}
          {discountPercent > 0 && (
            <Badge className="bg-destructive text-destructive-foreground shadow-sm">
              -{discountPercent}%
            </Badge>
          )}
        </div>

        {/* Deal Timer */}
        {showDealTimer && (
          <div className="absolute bottom-3 left-3">
            <CountdownTimer
              expiresAt={dealExpiresAt!}
              variant="badge"
              showIcon={true}
            />
          </div>
        )}

        {/* Action Buttons - Top Right */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          <Button
            size="icon"
            variant="secondary"
            className={cn(
              "h-9 w-9 rounded-full shadow-sm transition-all duration-200",
              isWishlisted 
                ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground opacity-100" 
                : "opacity-0 group-hover:opacity-100 bg-background/90 hover:bg-background"
            )}
            onClick={handleToggleWishlist}
            disabled={wishlistLoading}
          >
            <Heart className={cn("h-4 w-4", isWishlisted && "fill-current")} />
          </Button>
          {onQuickView && (
            <Button
              size="icon"
              variant="secondary"
              className="h-9 w-9 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 bg-background/90 hover:bg-background"
              onClick={(e) => {
                e.stopPropagation();
                onQuickView();
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="icon"
            variant="secondary"
            className={cn(
              "h-9 w-9 rounded-full shadow-sm transition-all duration-200",
              isInCompare(id)
                ? "bg-primary hover:bg-primary/90 text-primary-foreground opacity-100"
                : "opacity-0 group-hover:opacity-100 bg-background/90 hover:bg-background"
            )}
            onClick={handleToggleCompare}
          >
            <GitCompareArrows className="h-4 w-4" />
          </Button>
        </div>

        {/* Stock Status - Bottom Right */}
        {stockStatus && (
          <div className="absolute bottom-3 right-3">
            <Badge 
              variant={stockStatus.variant === "success" ? "default" : stockStatus.variant === "warning" ? "secondary" : "destructive"}
              className={cn(
                "text-xs shadow-sm",
                stockStatus.variant === "success" && "bg-success text-success-foreground",
                stockStatus.variant === "warning" && "bg-warning text-warning-foreground"
              )}
            >
              {stockStatus.label}
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
          {category}
        </p>
        <h3 className="font-semibold text-base mb-2 line-clamp-1 group-hover:text-primary transition-colors">
          {name}
        </h3>
        
        {/* Rating */}
        {reviewCount > 0 && (
          <div className="flex items-center gap-1.5 mb-3">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "h-3.5 w-3.5",
                    star <= Math.round(averageRating)
                      ? "fill-warning text-warning"
                      : "text-muted-foreground/30"
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">({reviewCount})</span>
          </div>
        )}
        
        {/* Price */}
        <div className="space-y-0.5">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-primary">${price.toFixed(2)}</span>
            {originalPrice && originalPrice > price && (
              <span className="text-sm text-muted-foreground line-through">
                ${originalPrice.toFixed(2)}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-foreground/80">{formatNGN(price)}</span>
            {originalPrice && originalPrice > price && (
              <span className="text-xs text-muted-foreground line-through">
                {formatNGN(originalPrice)}
              </span>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Button 
          onClick={handleAddToCart}
          className={cn(
            "w-full transition-all duration-200",
            !isOutOfStock && "hover:shadow-md"
          )}
          disabled={isOutOfStock || isAddingToCart}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {isOutOfStock ? "Out of Stock" : isAddingToCart ? "Adding..." : "Add to Cart"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
