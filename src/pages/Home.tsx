import { ArrowRight, Truck, Shield, Headphones, Sparkles, Star, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import DealsSection from "@/components/DealsSection";
import { useLanguage } from "@/hooks/useLanguage";

const Home = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section - Premium Design */}
      <section className="relative overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-40 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-8 animate-fade-in">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">{t("home.badge")}</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight animate-fade-in">
              {t("home.heroTitle1")}
              <span className="block gradient-text mt-2">
                {t("home.heroTitle2")}
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in text-balance">
              {t("home.heroSubtitle")}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
              <Button asChild size="lg" className="text-base px-8 shadow-elegant btn-glow">
                <Link to="/shop">
                  {t("home.shopNow")} <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-base px-8">
                <Link to="/about">{t("home.learnMore")}</Link>
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>
                <span>{t("home.reviews")}</span>
              </div>
              <div className="hidden sm:block w-px h-4 bg-border" />
              <span>{t("home.freeShippingBadge")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Modern cards */}
      <section className="py-16 border-y border-border bg-muted/30">
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
                className="flex items-start gap-4 p-6 bg-card rounded-2xl border border-border/50 shadow-card hover-lift"
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

      <Footer />
    </div>
  );
};

export default Home;
