import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "./ProductCard";

interface Props {
  category: string;
  currentProductId: string;
}

const RelatedProducts = ({ category, currentProductId }: Props) => {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("category", category)
        .neq("id", currentProductId)
        .limit(4);
      setProducts(data || []);
    };
    load();
  }, [category, currentProductId]);

  if (products.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            id={p.id}
            name={p.name}
            price={p.price}
            originalPrice={p.original_price}
            image={p.image_url}
            category={p.category}
            isNew={p.is_new}
            stockQuantity={p.stock_quantity}
          />
        ))}
      </div>
    </section>
  );
};

export default RelatedProducts;
