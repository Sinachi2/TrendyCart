import { createContext, useContext, useState, ReactNode } from "react";

interface Product {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  image_url: string | null;
  category: string;
  description: string | null;
  stock_quantity: number | null;
}

interface ProductCompareContextType {
  compareProducts: Product[];
  addToCompare: (product: Product) => void;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
  isInCompare: (productId: string) => boolean;
}

const ProductCompareContext = createContext<ProductCompareContextType | undefined>(undefined);

export const ProductCompareProvider = ({ children }: { children: ReactNode }) => {
  const [compareProducts, setCompareProducts] = useState<Product[]>([]);

  const addToCompare = (product: Product) => {
    if (compareProducts.length >= 4) return;
    if (compareProducts.find((p) => p.id === product.id)) return;
    setCompareProducts((prev) => [...prev, product]);
  };

  const removeFromCompare = (productId: string) => {
    setCompareProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const clearCompare = () => {
    setCompareProducts([]);
  };

  const isInCompare = (productId: string) => {
    return compareProducts.some((p) => p.id === productId);
  };

  return (
    <ProductCompareContext.Provider
      value={{ compareProducts, addToCompare, removeFromCompare, clearCompare, isInCompare }}
    >
      {children}
    </ProductCompareContext.Provider>
  );
};

export const useProductCompare = () => {
  const context = useContext(ProductCompareContext);
  if (!context) {
    throw new Error("useProductCompare must be used within ProductCompareProvider");
  }
  return context;
};
