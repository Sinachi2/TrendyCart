import { X, GitCompareArrows } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProductCompare } from "@/contexts/ProductCompareContext";
import { useNavigate } from "react-router-dom";

const ProductCompareBar = () => {
  const { compareProducts, removeFromCompare, clearCompare } = useProductCompare();
  const navigate = useNavigate();

  if (compareProducts.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50 p-4">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <GitCompareArrows className="h-5 w-5 text-primary" />
          <span className="font-medium text-sm">Compare ({compareProducts.length}/4)</span>
        </div>

        <div className="flex-1 flex items-center gap-3 overflow-x-auto">
          {compareProducts.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-2 bg-muted rounded-lg p-2 pr-3 shrink-0"
            >
              <img
                src={product.image_url || "/placeholder.svg"}
                alt={product.name}
                className="w-10 h-10 rounded object-cover"
              />
              <span className="text-sm font-medium max-w-24 truncate">{product.name}</span>
              <button
                onClick={() => removeFromCompare(product.id)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={clearCompare}>
            Clear All
          </Button>
          <Button
            size="sm"
            onClick={() => navigate("/compare")}
            disabled={compareProducts.length < 2}
          >
            Compare Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCompareBar;
