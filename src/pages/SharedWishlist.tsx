import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Heart, ShoppingBag, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface WishlistItem {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    category: string;
  };
}

interface UserProfile {
  full_name: string | null;
  email: string;
}

const SharedWishlist = () => {
  const { userId } = useParams<{ userId: string }>();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadSharedWishlist();
    }
  }, [userId]);

  const loadSharedWishlist = async () => {
    try {
      // Load user profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", userId)
        .single();

      if (profileError) {
        throw new Error("User not found");
      }

      setUserProfile(profile);

      // Load wishlist items
      const { data: wishlistData, error: wishlistError } = await supabase
        .from("wishlist")
        .select(`
          id,
          product:products (
            id,
            name,
            price,
            image_url,
            category
          )
        `)
        .eq("user_id", userId);

      if (wishlistError) throw wishlistError;

      setItems(wishlistData as unknown as WishlistItem[]);
    } catch (err: any) {
      setError(err.message || "Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  };

  const displayName = userProfile?.full_name || userProfile?.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Button asChild variant="ghost" className="mb-6">
          <Link to="/shop">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shop
          </Link>
        </Button>

        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-12 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Wishlist Not Found</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button asChild>
              <Link to="/shop">Browse Products</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Heart className="h-8 w-8 text-primary fill-primary" />
                {displayName}'s Wishlist
              </h1>
              <p className="text-muted-foreground mt-2">
                {items.length} {items.length === 1 ? "item" : "items"} in wishlist
              </p>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-16">
                <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Wishlist is Empty</h2>
                <p className="text-muted-foreground">This wishlist doesn't have any items yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {items.map((item) => (
                  <Card key={item.id} className="overflow-hidden group">
                    <div className="aspect-square relative overflow-hidden bg-muted">
                      {item.product.image_url ? (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground uppercase mb-1">
                        {item.product.category}
                      </p>
                      <h3 className="font-semibold mb-2 line-clamp-2">
                        {item.product.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-bold text-primary">
                          ${item.product.price.toFixed(2)}
                        </p>
                        <Button asChild size="sm">
                          <Link to={`/product/${item.product.id}`}>View</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SharedWishlist;
