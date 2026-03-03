import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";

const FeaturedCategories = () => {
  const [categories, setCategories] = useState<{ name: string; count: number; image: string | null }[]>([]);
  const { t } = useLanguage();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("products").select("category, image_url");
      if (!data) return;
      const map = new Map<string, { count: number; image: string | null }>();
      data.forEach((p) => {
        const existing = map.get(p.category);
        map.set(p.category, {
          count: (existing?.count || 0) + 1,
          image: existing?.image || p.image_url,
        });
      });
      setCategories(
        Array.from(map.entries())
          .map(([name, v]) => ({ name, ...v }))
          .slice(0, 6)
      );
    };
    load();
  }, []);

  if (categories.length === 0) return null;

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Shop by Category</h2>
          <p className="text-muted-foreground text-lg">Find exactly what you're looking for</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              to={`/shop?category=${encodeURIComponent(cat.name)}`}
              className="group relative rounded-2xl overflow-hidden aspect-[4/3] bg-muted"
            >
              <img
                src={cat.image || "/placeholder.svg"}
                alt={cat.name}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                <h3 className="text-white font-bold text-lg md:text-xl">{cat.name}</h3>
                <p className="text-white/80 text-sm">{cat.count} products</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCategories;
