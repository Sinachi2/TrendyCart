import { useState, useEffect } from "react";

interface RecentProduct {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category: string;
  viewedAt: number;
}

const STORAGE_KEY = "recently_viewed_products";
const MAX_ITEMS = 10;

export const useRecentlyViewed = () => {
  const [recentProducts, setRecentProducts] = useState<RecentProduct[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setRecentProducts(JSON.parse(stored));
      } catch {
        setRecentProducts([]);
      }
    }
  }, []);

  const addToRecentlyViewed = (product: Omit<RecentProduct, "viewedAt">) => {
    setRecentProducts((prev) => {
      // Remove if already exists
      const filtered = prev.filter((p) => p.id !== product.id);
      // Add to front with timestamp
      const updated = [{ ...product, viewedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearRecentlyViewed = () => {
    localStorage.removeItem(STORAGE_KEY);
    setRecentProducts([]);
  };

  return { recentProducts, addToRecentlyViewed, clearRecentlyViewed };
};
