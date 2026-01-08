import Navbar from "@/components/Navbar";
import { Target, Users, Award } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">About TrendyCart</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              TrendyCart is a modern e-commerce platform built to make online
              shopping fast, stylish, and reliable. We connect customers with
              quality products while delivering a smooth and enjoyable shopping
              experience.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Values */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center p-6 rounded-lg border border-border hover:shadow-card transition-shadow">
            <div className="inline-flex p-4 bg-primary/10 rounded-full mb-4">
              <Target className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Our Mission</h3>
            <p className="text-muted-foreground">
              To make online shopping accessible, enjoyable, and rewarding by
              offering quality products, fair pricing, and fast service.
            </p>
          </div>

          <div className="text-center p-6 rounded-lg border border-border hover:shadow-card transition-shadow">
            <div className="inline-flex p-4 bg-primary/10 rounded-full mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Our Team</h3>
            <p className="text-muted-foreground">
              A dedicated team of creatives, curators, and tech professionals
              working together to deliver the best shopping experience.
            </p>
          </div>

          <div className="text-center p-6 rounded-lg border border-border hover:shadow-card transition-shadow">
            <div className="inline-flex p-4 bg-primary/10 rounded-full mb-4">
              <Award className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Our Promise</h3>
            <p className="text-muted-foreground">
              Secure payments, trusted products, and customer satisfaction —
              every order, every time.
            </p>
          </div>
        </div>

        {/* Story */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-card border border-border rounded-lg p-8 md:p-12">
            <h2 className="text-3xl font-bold mb-6">Our Story</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                TrendyCart was founded with a simple vision: shopping should feel
                effortless, modern, and trustworthy. What started as a small
                idea quickly grew into a platform focused on convenience and
                quality.
              </p>

              <p>
                Since 2024, we have served customers across different regions,
                carefully curating products that meet our quality and style
                standards — from everyday essentials to trending items.
              </p>

              <p>
                At TrendyCart, we believe shopping is more than just buying
                products. It’s about trust, support, and a seamless experience.
                That’s why our customer service team is always ready to assist
                and ensure satisfaction.
              </p>

              <p>
                As we grow, our commitment remains the same: to deliver value,
                innovation, and an enjoyable shopping journey that keeps you
                coming back.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
