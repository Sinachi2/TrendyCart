import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import ProductQuickView from "@/components/ProductQuickView";
import ProductHoverCard from "@/components/ProductHoverCard";
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
  deal_expires_at: string | null;
  is_deal_active: boolean;
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
  const [showOnSale, setShowOnSale] = useState(false);
  const [showInStock, setShowInStock] = useState(false);
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
    const matchesSale = !showOnSale || (product.original_price && product.original_price > product.price);
    const matchesStock = !showInStock || (product.stock_quantity && product.stock_quantity > 0);
    return matchesSearch && matchesCategory && matchesPrice && matchesRating && matchesSale && matchesStock;
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
      case "deals":
        // Sort active deals first, then by expiration
        const aIsDeal = a.is_deal_active && a.deal_expires_at;
        const bIsDeal = b.is_deal_active && b.deal_expires_at;
        if (aIsDeal && !bIsDeal) return -1;
        if (!aIsDeal && bIsDeal) return 1;
        return 0;
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
  }, [searchQuery, selectedCategory, sortBy, priceRange, minRating, showOnSale, showInStock]);

  const categories = ["all", ...Array.from(new Set(products.map(p => p.category)))];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8 md:mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Shop All Products</h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Browse our complete collection of premium products
          </p>
        </div>

        {/* Filters - Simplified */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Search and Primary Filters */}
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1">
              <SearchAutocomplete
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search products..."
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-44">
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
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="popular">Popular</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="deals">Limited Time Deals</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowOnSale(!showOnSale)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                showOnSale
                  ? "bg-destructive text-destructive-foreground shadow-sm"
                  : "bg-muted/80 hover:bg-muted text-foreground"
              }`}
            >
              🔥 On Sale
            </button>
            <button
              onClick={() => setShowInStock(!showInStock)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                showInStock
                  ? "bg-success text-success-foreground shadow-sm"
                  : "bg-muted/80 hover:bg-muted text-foreground"
              }`}
            >
              ✓ In Stock Only
            </button>
          </div>
        </div>

        {/* Advanced Filters - Collapsible Cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {/* Rating Filter */}
          <div className="p-4 bg-card border border-border/50 rounded-xl shadow-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Minimum Rating</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                {minRating > 0 ? (
                  <>
                    {minRating}+ <Star className="h-3 w-3 fill-warning text-warning" />
                  </>
                ) : (
                  "All ratings"
                )}
              </span>
            </div>
            <div className="flex gap-1.5">
              {[0, 1, 2, 3, 4].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setMinRating(rating)}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                    minRating === rating
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/50 border border-border hover:bg-muted"
                  }`}
                >
                  {rating === 0 ? (
                    "All"
                  ) : (
                    <>
                      {rating}+ <Star className="h-3 w-3 fill-warning text-warning" />
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="p-4 bg-card border border-border/50 rounded-xl shadow-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Price Range</span>
              <span className="text-xs text-muted-foreground font-mono">
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
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{paginatedProducts.length}</span> of{" "}
            <span className="font-medium text-foreground">{sortedProducts.length}</span> products
          </p>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-card border border-border/50 rounded-xl overflow-hidden animate-pulse">
                <div className="h-56 sm:h-64 bg-muted" />
                <div className="p-4 space-y-3">
                  <div className="h-3 w-16 bg-muted rounded" />
                  <div className="h-5 w-3/4 bg-muted rounded" />
                  <div className="h-4 w-20 bg-muted rounded" />
                  <div className="h-10 w-full bg-muted rounded-lg mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {paginatedProducts.map((product, index) => (
                <div 
                  key={product.id} 
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ProductHoverCard
                    name={product.name}
                    price={product.price}
                    originalPrice={product.original_price}
                    description={product.description}
                    category={product.category}
                    stockQuantity={product.stock_quantity}
                    averageRating={product.averageRating}
                    reviewCount={product.reviewCount}
                    image={product.image_url}
                  >
                    <div>
                      <ProductCard
                        id={product.id}
                        name={product.name}
                        price={product.price}
                        originalPrice={product.original_price}
                        image={product.image_url}
                        category={product.category}
                        isNew={product.is_new}
                        stockQuantity={product.stock_quantity}
                        description={product.description}
                        dealExpiresAt={product.deal_expires_at}
                        isDealActive={product.is_deal_active}
                        averageRating={product.averageRating}
                        reviewCount={product.reviewCount}
                        onQuickView={() => setQuickViewProduct(product)}
                      />
                    </div>
                  </ProductHoverCard>
                </div>
              ))}
            </div>

            {paginatedProducts.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-2xl">🔍</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or search query
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination className="mt-10">
                <PaginationContent className="gap-1">
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                      className={`${currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-muted"}`}
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
                      className={`${currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-muted"}`}
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
