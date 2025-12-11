import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import ProductQuickView from "@/components/ProductQuickView";
import SearchAutocomplete from "@/components/SearchAutocomplete";
import { Slider } from "@/components/ui/slider";
import { Star } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { supabase } from "@/integrations/supabase/client";

const ITEMS_PER_PAGE = 12;

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
  created_at: string | null;
  averageRating?: number;
  reviewCount?: number;
}

const Shop = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [minRating, setMinRating] = useState(0);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data: productsData, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch reviews for all products to calculate average ratings
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("product_id, rating");

      const reviewsByProduct = (reviewsData || []).reduce((acc, review) => {
        if (!acc[review.product_id]) {
          acc[review.product_id] = { total: 0, count: 0 };
        }
        acc[review.product_id].total += review.rating;
        acc[review.product_id].count += 1;
        return acc;
      }, {} as Record<string, { total: number; count: number }>);

      const productsWithRatings = (productsData || []).map((product) => ({
        ...product,
        averageRating: reviewsByProduct[product.id]
          ? reviewsByProduct[product.id].total / reviewsByProduct[product.id].count
          : 0,
        reviewCount: reviewsByProduct[product.id]?.count || 0,
      }));

      setProducts(productsWithRatings);
      
      // Calculate max price
      if (productsWithRatings.length > 0) {
        const max = Math.ceil(Math.max(...productsWithRatings.map(p => p.price)));
        setMaxPrice(max);
        setPriceRange([0, max]);
      }
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
    const matchesRating = (product.averageRating || 0) >= minRating;
    return matchesSearch && matchesCategory && matchesPrice && matchesRating;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "newest":
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      case "popular":
        return (b.is_new ? 1 : 0) - (a.is_new ? 1 : 0);
      case "rating":
        return (b.averageRating || 0) - (a.averageRating || 0);
      default:
        return 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortBy, priceRange, minRating]);

  const categories = ["all", ...Array.from(new Set(products.map(p => p.category)))];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Shop All Products</h1>
          <p className="text-muted-foreground text-lg">
            Browse our complete collection of premium products
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <SearchAutocomplete
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search products..."
          />
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category === "all" ? "All Categories" : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="popular">Popular</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Rating Filter */}
        <div className="mb-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Minimum Rating</span>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              {minRating > 0 ? (
                <>
                  {minRating}+ <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                </>
              ) : (
                "All ratings"
              )}
            </span>
          </div>
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4].map((rating) => (
              <button
                key={rating}
                onClick={() => setMinRating(rating)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  minRating === rating
                    ? "bg-primary text-primary-foreground"
                    : "bg-background border border-border hover:bg-muted"
                }`}
              >
                {rating === 0 ? (
                  "All"
                ) : (
                  <>
                    {rating}+ <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Price Range Filter */}
        <div className="mb-8 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Price Range</span>
            <span className="text-sm text-muted-foreground">
              ${priceRange[0]} - ${priceRange[1]}
            </span>
          </div>
          <Slider
            value={priceRange}
            onValueChange={(value) => setPriceRange(value as [number, number])}
            max={maxPrice}
            min={0}
            step={10}
            className="w-full"
          />
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-4">
          Showing {paginatedProducts.length} of {sortedProducts.length} products
        </p>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  originalPrice={product.original_price}
                  image={product.image_url}
                  category={product.category}
                  isNew={product.is_new}
                  stockQuantity={product.stock_quantity}
                  onQuickView={() => setQuickViewProduct(product)}
                />
              ))}
            </div>

            {paginatedProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  No products found. Try adjusting your filters.
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination className="mt-8">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => handlePageChange(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </div>

      {/* Quick View Modal */}
      <ProductQuickView
        product={quickViewProduct}
        open={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
};

export default Shop;
