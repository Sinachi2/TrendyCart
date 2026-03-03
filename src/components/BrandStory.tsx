import { Award, Globe } from "lucide-react";

const BrandStory = () => (
  <section className="py-20">
    <div className="container mx-auto px-4">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-muted">
          <img
            src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80"
            alt="Our brand story"
            loading="lazy"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent" />
        </div>
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Story</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Born from a passion for quality and accessibility, TrendyCart bridges the gap between premium products and global shoppers. We believe everyone deserves access to exceptional goods.
            </p>
          </div>
          <div className="grid gap-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Our Mission</h3>
                <p className="text-muted-foreground">To deliver premium-quality products at fair prices with world-class customer service.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                <Globe className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Our Vision</h3>
                <p className="text-muted-foreground">To become the most trusted global marketplace, connecting quality brands with customers everywhere.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default BrandStory;
