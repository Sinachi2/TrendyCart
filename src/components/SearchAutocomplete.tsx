import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Loader2, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  original_price: number | null;
  image_url: string | null;
}

interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  compact?: boolean;
}

const SearchAutocomplete = ({ value, onChange, placeholder = "Search products...", compact = false }: SearchAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const searchProducts = async () => {
      if (value.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("products")
          .select("id, name, category, price, original_price, image_url")
          .ilike("name", `%${value}%`)
          .limit(8);

        if (error) throw error;
        setSuggestions(data || []);
        setShowSuggestions(true);
        setActiveIndex(-1);
      } catch (error) {
        console.error("Error searching products:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchProducts, 250);
    return () => clearTimeout(debounce);
  }, [value]);

  const handleSelect = useCallback((product: Product) => {
    setShowSuggestions(false);
    onChange("");
    navigate(`/product/${product.id}`);
  }, [navigate, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleClear = () => {
    onChange("");
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const discount = (product: Product) => {
    if (product.original_price && product.original_price > product.price) {
      return Math.round(((product.original_price - product.price) / product.original_price) * 100);
    }
    return 0;
  };

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <Search className={cn(
        "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors",
        compact ? "h-3.5 w-3.5" : "h-4 w-4",
        value.length > 0 && "text-primary"
      )} />
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => value.length >= 2 && setShowSuggestions(true)}
        onKeyDown={handleKeyDown}
        className={cn(
          "pl-9 pr-9 transition-all duration-200 border-border/60 focus:border-primary/40",
          compact ? "h-9 text-sm rounded-lg" : "h-10 rounded-xl"
        )}
      />
      {value.length > 0 && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      {loading && (
        <Loader2 className="absolute right-9 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground animate-spin" />
      )}

      {/* Dropdown */}
      {showSuggestions && value.length >= 2 && (
        <div className={cn(
          "absolute top-full left-0 right-0 mt-2 bg-popover/95 backdrop-blur-xl border border-border/60 rounded-xl shadow-xl z-50 overflow-hidden",
          "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
        )}>
          {suggestions.length > 0 ? (
            <>
              <div className="px-3 py-2 border-b border-border/40">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  {suggestions.length} result{suggestions.length !== 1 ? "s" : ""} found
                </p>
              </div>
              <ul className="max-h-[360px] overflow-auto py-1">
                {suggestions.map((product, index) => (
                  <li key={product.id}>
                    <button
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 transition-all duration-150 text-left group",
                        activeIndex === index
                          ? "bg-primary/8 text-foreground"
                          : "hover:bg-muted/60"
                      )}
                      onClick={() => handleSelect(product)}
                      onMouseEnter={() => setActiveIndex(index)}
                    >
                      <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-muted flex-shrink-0 ring-1 ring-border/30">
                        <img
                          src={product.image_url || "/placeholder.svg"}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {discount(product) > 0 && (
                          <div className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[8px] font-bold px-1 py-0.5 rounded-bl-md rounded-tr-lg">
                            -{discount(product)}%
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.category}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-semibold text-sm text-primary">${product.price.toFixed(2)}</span>
                        {product.original_price && product.original_price > product.price && (
                          <p className="text-[10px] text-muted-foreground line-through">${product.original_price.toFixed(2)}</p>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => { setShowSuggestions(false); navigate("/shop"); }}
                className="w-full px-3 py-2.5 border-t border-border/40 text-xs font-medium text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-1.5"
              >
                <TrendingUp className="h-3 w-3" />
                View all results in shop
              </button>
            </>
          ) : !loading ? (
            <div className="p-6 text-center">
              <Search className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm font-medium text-muted-foreground">No products found</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Try a different search term</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;
