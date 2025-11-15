import { ArrowRight, Truck, Shield, Headphones } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import heroBg from "@/assets/hero-bg.jpg";

const featuredProducts = [
  {
    id: 1,
    name: "Premium Wireless Headphones",
    price: 299,
    originalPrice: 399,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
    category: "Electronics",
    isNew: true,
  },
  {
    id: 2,
    name: "Smart Watch Pro",
    price: 449,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
    category: "Wearables",
    isNew: true,
  },
  {
    id: 3,
    name: "Designer Backpack",
    price: 129,
    originalPrice: 179,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500",
    category: "Fashion",
  },
  {
    id: 4,
    name: "Minimalist Wallet",
    price: 49,
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=500",
    category: "Accessories",
  },
];

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section 
        className="relative bg-gradient-hero py-20 md:py-32 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.8)), url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Discover Your
              <span className="block bg-gradient-primary bg-clip-text text-transparent">
                Perfect Style
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
              Shop the latest trends in fashion, electronics, and accessories. Quality products at unbeatable prices.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="text-lg">
                <Link to="/shop">
                  Shop Now <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg">
                <Link to="/about">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Free Shipping</h3>
                <p className="text-muted-foreground">On orders over $50</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Secure Payment</h3>
                <p className="text-muted-foreground">100% protected transactions</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Headphones className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">24/7 Support</h3>
                <p className="text-muted-foreground">Dedicated customer service</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Featured Products</h2>
            <p className="text-muted-foreground text-lg">
              Handpicked selection of our best sellers
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>

          <div className="text-center">
            <Button asChild size="lg" variant="outline">
              <Link to="/shop">
                View All Products <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Start Shopping?
          </h2>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of happy customers and discover amazing deals every day
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link to="/shop">Browse Collection</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Home;
