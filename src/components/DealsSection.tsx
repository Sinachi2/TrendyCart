import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Percent } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  original_price: number;
  image_url: string | null;
  category: string;
}

const DealsSection = () => {
  const [deals, setDeals] = useState<Product[]>([]);

  useEffect(() => {
    loadDeals();
  }, []);

  const loadDeals = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .not("original_price", "is", null)
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;
      // Filter products where original_price > price
      const discountedProducts = (data || []).filter(
        (p) => p.original_price && p.original_price > p.price
      );
      setDeals(discountedProducts);
    } catch (error) {
      console.error("Error loading deals:", error);
    }
  };

  const calculateDiscount = (price: number, originalPrice: number) => {
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  };

  if (deals.length === 0) return null;

  return (
    <section className="py-20 bg-destructive/5">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Percent className="h-6 w-6 text-destructive" />
              <span className="text-destructive font-semibold uppercase tracking-wide text-sm">
                Limited Time
              </span>
            </div>
            <h2 className="text-4xl font-bold">Hot Deals & Sales</h2>
            <p className="text-muted-foreground text-lg mt-2">
              Don't miss out on these amazing discounts
            </p>
          </div>
          <Button asChild variant="outline" className="hidden md:flex">
            <Link to="/shop">
              View All Deals <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {deals.map((product) => (
            <Link to={`/product/${product.id}`} key={product.id}>
              <Card className="group overflow-hidden hover:shadow-elegant transition-all duration-300">
                <div className="relative">
                  <img
                    src={product.image_url || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <Badge className="absolute top-3 left-3 bg-destructive text-destructive-foreground text-lg px-3 py-1">
                    -{calculateDiscount(product.price, product.original_price)}%
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">{product.category}</p>
                  <h3 className="font-semibold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-destructive">${product.price}</span>
                    <span className="text-lg text-muted-foreground line-through">
                      ${product.original_price}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8 md:hidden">
          <Button asChild variant="outline">
            <Link to="/shop">
              View All Deals <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default DealsSection;
