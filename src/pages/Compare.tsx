import { useNavigate } from "react-router-dom";
import { ArrowLeft, X, ShoppingCart, Check, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProductCompare } from "@/contexts/ProductCompareContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

const Compare = () => {
  const navigate = useNavigate();
  const { compareProducts, removeFromCompare, clearCompare } = useProductCompare();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleAddToCart = async (product: typeof compareProducts[0]) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to add items to cart",
      });
      navigate("/auth");
      return;
    }

    try {
      const { data: existingItem } = await supabase
        .from("cart_items")
        .select("quantity")
        .eq("user_id", user.id)
        .eq("product_id", product.id)
        .maybeSingle();

      const newQuantity = existingItem ? existingItem.quantity + 1 : 1;

      const { error } = await supabase.from("cart_items").upsert(
        {
          user_id: user.id,
          product_id: product.id,
          quantity: newQuantity,
        },
        { onConflict: "user_id,product_id" }
      );

      if (error) throw error;

      toast({
        title: "Added to cart",
        description: `${product.name} added to your cart`,
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

  const specs = [
    { label: "Category", key: "category" },
    { label: "Price", key: "price", format: (v: number) => `$${v.toFixed(2)}` },
    { label: "Original Price", key: "original_price", format: (v: number | null) => v ? `$${v.toFixed(2)}` : "-" },
    { label: "Discount", key: "discount", compute: (p: typeof compareProducts[0]) => 
      p.original_price ? `${Math.round((1 - p.price / p.original_price) * 100)}% off` : "-" 
    },
    { label: "Availability", key: "stock_quantity", format: (v: number | null) => 
      v && v > 0 ? `In Stock (${v})` : "Out of Stock" 
    },
  ];

  if (compareProducts.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">No Products to Compare</h1>
          <p className="text-muted-foreground mb-8">
            Add products to compare from the shop page
          </p>
          <Button onClick={() => navigate("/shop")}>Browse Products</Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Compare Products</h1>
          </div>
          <Button variant="outline" onClick={clearCompare}>
            Clear All
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr>
                <th className="text-left p-4 bg-muted/50 rounded-tl-lg w-40">Product</th>
                {compareProducts.map((product) => (
                  <th key={product.id} className="p-4 bg-muted/50 last:rounded-tr-lg">
                    <Card className="p-4 relative">
                      <button
                        onClick={() => removeFromCompare(product.id)}
                        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <img
                        src={product.image_url || "/placeholder.svg"}
                        alt={product.name}
                        className="w-full h-40 object-cover rounded-lg mb-3 cursor-pointer"
                        onClick={() => navigate(`/product/${product.id}`)}
                      />
                      <h3 className="font-semibold text-sm mb-2 line-clamp-2">{product.name}</h3>
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => handleAddToCart(product)}
                        disabled={(product.stock_quantity ?? 0) <= 0}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Add to Cart
                      </Button>
                    </Card>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {specs.map((spec, idx) => (
                <tr key={spec.label} className={idx % 2 === 0 ? "bg-muted/20" : ""}>
                  <td className="p-4 font-medium text-muted-foreground">{spec.label}</td>
                  {compareProducts.map((product) => {
                    let value: string;
                    if (spec.compute) {
                      value = spec.compute(product);
                    } else if (spec.format) {
                      value = spec.format((product as any)[spec.key]);
                    } else {
                      value = (product as any)[spec.key] || "-";
                    }
                    return (
                      <td key={product.id} className="p-4 text-center">
                        {spec.key === "stock_quantity" ? (
                          <Badge
                            variant="secondary"
                            className={
                              (product.stock_quantity ?? 0) > 0
                                ? "bg-green-500/10 text-green-700 dark:text-green-400"
                                : "bg-red-500/10 text-red-700 dark:text-red-400"
                            }
                          >
                            {value}
                          </Badge>
                        ) : (
                          <span className={spec.key === "price" ? "font-bold text-primary" : ""}>
                            {value}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="bg-muted/20">
                <td className="p-4 font-medium text-muted-foreground">Description</td>
                {compareProducts.map((product) => (
                  <td key={product.id} className="p-4 text-sm text-muted-foreground">
                    <p className="line-clamp-4">{product.description || "No description"}</p>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default Compare;
