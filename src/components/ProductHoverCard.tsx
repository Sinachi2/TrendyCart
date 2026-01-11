import { Star, Package, Tag } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";

interface ProductHoverCardProps {
  children: React.ReactNode;
  name: string;
  price: number;
  originalPrice?: number | null;
  description?: string | null;
  category: string;
  stockQuantity?: number | null;
  averageRating?: number;
  reviewCount?: number;
  image?: string | null;
}

const ProductHoverCard = ({
  children,
  name,
  price,
  originalPrice,
  description,
  category,
  stockQuantity,
  averageRating = 0,
  reviewCount = 0,
  image,
}: ProductHoverCardProps) => {
  const discount = originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const getStockStatus = () => {
    if (stockQuantity === null || stockQuantity === undefined) return null;
    if (stockQuantity <= 0) return { label: "Out of Stock", color: "text-destructive" };
    if (stockQuantity <= 5) return { label: `Only ${stockQuantity} left!`, color: "text-orange-500" };
    return { label: "In Stock", color: "text-emerald-500" };
  };

  const stockStatus = getStockStatus();

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent
        className="w-80 p-0 overflow-hidden bg-card/95 backdrop-blur-xl border-border/50 shadow-xl"
        side="right"
        align="start"
        sideOffset={12}
      >
        {/* Image */}
        {image && (
          <div className="relative h-40 overflow-hidden bg-muted">
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover"
            />
            {discount > 0 && (
              <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground">
                -{discount}% OFF
              </Badge>
            )}
          </div>
        )}

        <div className="p-4 space-y-3">
          {/* Category */}
          <div className="flex items-center gap-2">
            <Tag className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              {category}
            </span>
          </div>

          {/* Name */}
          <h4 className="font-semibold text-foreground leading-tight">{name}</h4>

          {/* Description */}
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}

          {/* Rating */}
          {reviewCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${
                      i < Math.round(averageRating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                ({reviewCount} reviews)
              </span>
            </div>
          )}

          {/* Price & Stock */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-primary">${price}</span>
              {originalPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  ${originalPrice}
                </span>
              )}
            </div>

            {stockStatus && (
              <div className="flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 text-muted-foreground" />
                <span className={`text-xs font-medium ${stockStatus.color}`}>
                  {stockStatus.label}
                </span>
              </div>
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default ProductHoverCard;
