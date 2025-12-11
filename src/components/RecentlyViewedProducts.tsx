import { useNavigate } from "react-router-dom";
import { Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";

const RecentlyViewedProducts = () => {
  const navigate = useNavigate();
  const { recentProducts, clearRecentlyViewed } = useRecentlyViewed();

  if (recentProducts.length === 0) return null;

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" />
            Recently Viewed
          </h2>
          <Button variant="ghost" size="sm" onClick={clearRecentlyViewed}>
            Clear All
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {recentProducts.slice(0, 5).map((product) => (
            <Card
              key={product.id}
              className="group cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
              onClick={() => navigate(`/product/${product.id}`)}
            >
              <div className="aspect-square overflow-hidden bg-muted">
                <img
                  src={product.image_url || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground mb-1">{product.category}</p>
                <h3 className="font-medium text-sm line-clamp-1">{product.name}</h3>
                <p className="font-bold text-primary mt-1">${product.price}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecentlyViewedProducts;
