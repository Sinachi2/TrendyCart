import { ArrowRight, Truck, Shield, Headphones, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroChatInterface from "@/components/HeroChatInterface";
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

const Home = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* AI Chat Hero Section */}
      <HeroChatInterface />

      {/* Features - Glassmorphism cards */}
      <section className="py-16 relative">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Truck, title: t("home.freeShipping"), description: t("home.freeShippingDesc"), color: "text-primary bg-primary/10" },
              { icon: Shield, title: t("home.securePayment"), description: t("home.securePaymentDesc"), color: "text-success bg-success/10" },
              { icon: Headphones, title: t("home.support"), description: t("home.supportDesc"), color: "text-accent bg-accent/10" },
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-4 p-6 glass rounded-2xl shadow-card hover-lift">
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

      <FeaturedCategories />
      <DealsSection />

      <section className="py-20 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 rounded-full mb-4">
              <Zap className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-accent">{t("home.trending")}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("home.featured")}</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t("home.featuredDesc")}</p>
          </div>
          <div className="relative px-4 md:px-12">
            <FeaturedCarousel />
          </div>
          <div className="text-center mt-10">
            <Button asChild size="lg" variant="outline" className="px-8">
              <Link to="/shop">{t("home.viewAll")} <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <HowItWorksSection />
      <TrustBadgesSection />
      <TestimonialsSection />
      <BrandStory />
      <FAQSection />

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-4">{t("home.ctaTitle")}</h2>
          <p className="text-primary-foreground/90 text-lg mb-8 max-w-2xl mx-auto">{t("home.ctaSubtitle")}</p>
          <Button asChild size="lg" variant="secondary" className="px-8 shadow-lg">
            <Link to="/shop">{t("home.browseCollection")}</Link>
          </Button>
        </div>
      </section>

      <ShippingReturns />
      <Footer />
    </div>
  );
};

export default Home;
