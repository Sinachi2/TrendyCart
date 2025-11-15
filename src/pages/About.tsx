import Navbar from "@/components/Navbar";
import { Target, Users, Award } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        {/* Hero */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">About ShopHub</h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            We're on a mission to make online shopping accessible, enjoyable, and rewarding for everyone. 
            Since 2024, we've been delivering quality products and exceptional service to customers worldwide.
          </p>
        </div>

        {/* Values */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center p-6 rounded-lg border border-border hover:shadow-card transition-shadow">
            <div className="inline-flex p-4 bg-primary/10 rounded-full mb-4">
              <Target className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Our Mission</h3>
            <p className="text-muted-foreground">
              To provide high-quality products at fair prices while delivering an exceptional shopping experience.
            </p>
          </div>

          <div className="text-center p-6 rounded-lg border border-border hover:shadow-card transition-shadow">
            <div className="inline-flex p-4 bg-primary/10 rounded-full mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Our Team</h3>
            <p className="text-muted-foreground">
              A passionate group of individuals dedicated to curating the best products for our customers.
            </p>
          </div>

          <div className="text-center p-6 rounded-lg border border-border hover:shadow-card transition-shadow">
            <div className="inline-flex p-4 bg-primary/10 rounded-full mb-4">
              <Award className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Our Promise</h3>
            <p className="text-muted-foreground">
              Quality products, secure transactions, and customer satisfaction guaranteed with every purchase.
            </p>
          </div>
        </div>

        {/* Story */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-card border border-border rounded-lg p-8 md:p-12">
            <h2 className="text-3xl font-bold mb-6">Our Story</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                ShopHub was founded with a simple idea: shopping should be easy, enjoyable, and trustworthy. 
                We started in a small office with big dreams and a commitment to changing the e-commerce landscape.
              </p>
              <p>
                Today, we serve thousands of customers worldwide, offering carefully curated products across 
                multiple categories. From the latest electronics to timeless fashion pieces, we ensure every 
                item meets our strict quality standards.
              </p>
              <p>
                What sets us apart is our dedication to customer service. We believe that buying online should 
                be as personal as shopping in a physical store. That's why our team is always ready to help, 
                answer questions, and ensure your complete satisfaction.
              </p>
              <p>
                As we continue to grow, our commitment remains the same: to provide you with the best products, 
                competitive prices, and an shopping experience that keeps you coming back.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
