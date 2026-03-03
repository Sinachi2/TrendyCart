import { Truck, RotateCcw, ShieldCheck, CreditCard } from "lucide-react";

const policies = [
  { icon: Truck, title: "Free Shipping", desc: "On orders over $50 worldwide" },
  { icon: RotateCcw, title: "Easy Returns", desc: "30-day hassle-free returns" },
  { icon: ShieldCheck, title: "2 Year Warranty", desc: "Full coverage guarantee" },
  { icon: CreditCard, title: "Secure Checkout", desc: "SSL encrypted payments" },
];

const ShippingReturns = () => (
  <section className="py-16 bg-muted/30 border-y border-border">
    <div className="container mx-auto px-4">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold mb-3">Shipping & Returns</h2>
        <p className="text-muted-foreground">We make shopping worry-free</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {policies.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="text-center p-6 bg-card rounded-2xl border border-border/50 shadow-card hover-lift transition-all duration-300">
            <div className="mx-auto w-14 h-14 flex items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
              <Icon className="h-7 w-7" />
            </div>
            <h3 className="font-semibold mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default ShippingReturns;
