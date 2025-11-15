import { ShoppingCart, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  isNew?: boolean;
}

const ProductCard = ({ name, price, originalPrice, image, category, isNew }: ProductCardProps) => {
  return (
    <Card className="group overflow-hidden hover:shadow-elegant transition-all duration-300">
      <div className="relative overflow-hidden bg-muted">
        <img
          src={image}
          alt={name}
          className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {isNew && (
          <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground">
            New
          </Badge>
        )}
        <Button
          size="icon"
          variant="secondary"
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Heart className="h-4 w-4" />
        </Button>
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
        <Button className="w-full group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
