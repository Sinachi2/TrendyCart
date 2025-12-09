import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, ShoppingCart, Heart, Package, Truck, Shield } from "lucide-react";
import ProductReviews from "@/components/ProductReviews";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Skeleton } from "@/components/ui/skeleton";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  image_url: string | null;
  category: string;
  stock_quantity: number | null;
  is_new: boolean | null;
}

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      setProduct(data);
    } catch (error) {
      console.error("Error loading product:", error);
      toast({
        title: "Error",
        description: "Failed to load product details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

    if (!product) return;

    try {
      // Check if item already exists in cart
      const { data: existingItem } = await supabase
        .from("cart_items")
        .select("quantity")
        .eq("user_id", user.id)
        .eq("product_id", product.id)
        .maybeSingle();

      const newQuantity = existingItem ? existingItem.quantity + quantity : quantity;

      const { error } = await supabase
        .from("cart_items")
        .upsert({
          user_id: user.id,
          product_id: product.id,
          quantity: newQuantity,
        }, {
          onConflict: "user_id,product_id",
        });

      if (error) throw error;

      toast({
        title: "Added to cart",
        description: `${quantity} ${product.name} added to your cart`,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-24 mb-8" />
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="h-96 w-full rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
          <Button onClick={() => navigate("/shop")}>Back to Shop</Button>
        </div>
      </div>
    );
  }

  const inStock = (product.stock_quantity ?? 0) > 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Image */}
          <div className="relative">
            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
              <img
                src={product.image_url || "/placeholder.svg"}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            {product.is_new && (
              <Badge className="absolute top-4 left-4 bg-accent text-accent-foreground">
                New Arrival
              </Badge>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
                {product.category}
              </p>
              <h1 className="text-3xl lg:text-4xl font-bold mb-4">
                {product.name}
              </h1>
              
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl font-bold text-primary">
                  ${product.price}
                </span>
                {product.original_price && (
                  <>
                    <span className="text-xl text-muted-foreground line-through">
                      ${product.original_price}
                    </span>
                    <Badge variant="secondary" className="text-sm">
                      Save ${(product.original_price - product.price).toFixed(2)}
                    </Badge>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 mb-6">
                {inStock ? (
                  <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-400">
                    <Package className="h-3 w-3 mr-1" />
                    In Stock ({product.stock_quantity} available)
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-red-500/10 text-red-700 dark:text-red-400">
                    Out of Stock
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <p className="text-muted-foreground leading-relaxed">
                {product.description || "No description available for this product."}
              </p>
            </div>

            <Separator />

            {/* Specifications */}
            <div>
              <h2 className="text-lg font-semibold mb-3">Specifications</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category:</span>
                  <span className="font-medium">{product.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Availability:</span>
                  <span className="font-medium">{inStock ? "In Stock" : "Out of Stock"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SKU:</span>
                  <span className="font-medium">{product.id.slice(0, 8).toUpperCase()}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="font-medium">Quantity:</label>
                <div className="flex items-center border border-border rounded-md">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={!inStock}
                  >
                    -
                  </Button>
                  <span className="px-4 font-medium">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.min(product.stock_quantity ?? 1, quantity + 1))}
                    disabled={!inStock}
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={!inStock}
                  className="flex-1"
                  size="lg"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>
                <Button variant="outline" size="lg">
                  <Heart className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Features */}
            <Card className="p-4 bg-muted/50">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <Truck className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-xs text-muted-foreground">Free Shipping</p>
                </div>
                <div>
                  <Shield className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-xs text-muted-foreground">Secure Payment</p>
                </div>
                <div>
                  <Package className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-xs text-muted-foreground">Easy Returns</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12">
          <ProductReviews productId={product.id} />
        </div>
      </main>
    </div>
  );
};

export default ProductDetail;
