import { ArrowRight, Truck, Shield, Headphones, Sparkles, Star, Zap, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import DealsSection from "@/components/DealsSection";
import FeaturedCategories from "@/components/FeaturedCategories";
import BrandStory from "@/components/BrandStory";
import ShippingReturns from "@/components/ShippingReturns";
import TestimonialsSection from "@/components/TestimonialsSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import FAQSection from "@/components/FAQSection";
import TrustBadgesSection from "@/components/TrustBadgesSection";
import { useLanguage } from "@/hooks/useLanguage";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Home = () => {
  const { t } = useLanguage();
  const [featuredProduct, setFeaturedProduct] = useState<any>(null);

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .eq("is_deal_active", true)
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setFeaturedProduct(data);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section - Premium Apple-style */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/[0.03] to-accent/[0.05] dark:from-background dark:via-primary/[0.06] dark:to-accent/[0.08]" />
        
        {/* Floating blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-primary/[0.07] blur-[100px] animate-pulse-soft" />
          <div className="absolute top-1/2 -left-48 w-[400px] h-[400px] rounded-full bg-accent/[0.08] blur-[100px] animate-pulse-soft" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] rounded-full bg-success/[0.05] blur-[80px] animate-pulse-soft" style={{ animationDelay: '2s' }} />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
        
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left - Content */}
            <div className="text-left space-y-8 animate-fade-in">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">{t("home.badge")}</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight">
                {t("home.heroTitle1")}
                <span className="block gradient-text mt-2">
                  {t("home.heroTitle2")}
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-lg text-balance">
                {t("home.heroSubtitle")}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="text-base px-8 shadow-elegant btn-glow group">
                  <Link to="/shop">
                    {t("home.shopNow")}
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-base px-8 glass border-border/50">
                  <Link to="/shop">
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    {t("home.learnMore")}
                  </Link>
                </Button>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground pt-4">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <span className="font-medium">{t("home.reviews")}</span>
                </div>
                <div className="hidden sm:block w-px h-4 bg-border" />
                <span>{t("home.freeShippingBadge")}</span>
              </div>
            </div>

            {/* Right - Featured Product Showcase */}
            <div className="relative flex items-center justify-center animate-slide-in-up">
              {/* Glow behind product */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-72 h-72 md:w-96 md:h-96 rounded-full bg-primary/10 blur-[60px]" />
              </div>

              {/* Glass card with product */}
              <div className="relative glass rounded-3xl p-6 md:p-8 shadow-elegant max-w-md w-full">
                {featuredProduct?.image_url ? (
                  <img
                    src={featuredProduct.image_url}
                    alt={featuredProduct.name}
                    className="w-full h-64 md:h-72 object-contain mb-6 drop-shadow-xl"
                    loading="eager"
                  />
                ) : (
                  <div className="w-full h-64 md:h-72 bg-muted/30 rounded-2xl mb-6 flex items-center justify-center">
                    <ShoppingBag className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                )}
                
                {featuredProduct && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">{featuredProduct.category}</p>
                    <h3 className="text-xl font-bold">{featuredProduct.name}</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-primary">${featuredProduct.price}</span>
                      {featuredProduct.original_price && (
                        <span className="text-lg text-muted-foreground line-through">${featuredProduct.original_price}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Floating discount badge */}
                {featuredProduct?.original_price && (
                  <div className="absolute -top-3 -right-3 bg-destructive text-destructive-foreground rounded-full h-14 w-14 flex items-center justify-center shadow-lg animate-pulse-soft">
                    <span className="text-sm font-bold">
                      -{Math.round((1 - featuredProduct.price / featuredProduct.original_price) * 100)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Glassmorphism cards */}
      <section className="py-16 relative">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Truck,
                title: t("home.freeShipping"),
                description: t("home.freeShippingDesc"),
                color: "text-primary bg-primary/10",
              },
              {
                icon: Shield,
                title: t("home.securePayment"),
                description: t("home.securePaymentDesc"),
                color: "text-success bg-success/10",
              },
              {
                icon: Headphones,
                title: t("home.support"),
                description: t("home.supportDesc"),
                color: "text-accent bg-accent/10",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-6 glass rounded-2xl shadow-card hover-lift"
              >
                <div className={`p-3 rounded-xl ${feature.color}`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <FeaturedCategories />

      {/* Deals Section */}
      <DealsSection />

      {/* Featured Products Carousel */}
      <section className="py-20 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 rounded-full mb-4">
              <Zap className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-accent">{t("home.trending")}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("home.featured")}</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t("home.featuredDesc")}
            </p>
          </div>
          
          <div className="relative px-4 md:px-12">
            <FeaturedCarousel />
          </div>

          <div className="text-center mt-10">
            <Button asChild size="lg" variant="outline" className="px-8">
              <Link to="/shop">
                {t("home.viewAll")} <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <HowItWorksSection />

      {/* Trust Badges */}
      <TrustBadgesSection />

      {/* Testimonials */}
      <TestimonialsSection />

      {/* Brand Story */}
      <BrandStory />

      {/* FAQ */}
      <FAQSection />

      {/* CTA Section - Premium gradient */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        
        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-4">
            {t("home.ctaTitle")}
          </h2>
          <p className="text-primary-foreground/90 text-lg mb-8 max-w-2xl mx-auto">
            {t("home.ctaSubtitle")}
          </p>
          <Button asChild size="lg" variant="secondary" className="px-8 shadow-lg">
            <Link to="/shop">{t("home.browseCollection")}</Link>
          </Button>
        </div>
      </section>

      {/* Shipping & Returns */}
      <ShippingReturns />

      <Footer />
    </div>
  );
};

export default Home;
