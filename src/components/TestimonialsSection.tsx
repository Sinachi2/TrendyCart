import { Star, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLanguage } from "@/hooks/useLanguage";

const testimonials = [
  {
    nameKey: "testimonials.name1",
    roleKey: "testimonials.role1",
    quoteKey: "testimonials.quote1",
    rating: 5,
    initials: "AO",
  },
  {
    nameKey: "testimonials.name2",
    roleKey: "testimonials.role2",
    quoteKey: "testimonials.quote2",
    rating: 5,
    initials: "SK",
  },
  {
    nameKey: "testimonials.name3",
    roleKey: "testimonials.role3",
    quoteKey: "testimonials.quote3",
    rating: 5,
    initials: "MJ",
  },
];

const TestimonialsSection = () => {
  const { t } = useLanguage();

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <span className="inline-block text-sm font-semibold text-primary uppercase tracking-wider mb-3">
            {t("testimonials.badge")}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("testimonials.title")}</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t("testimonials.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.map((item, i) => (
            <Card
              key={i}
              className="relative bg-card border-border/50 shadow-card hover-lift overflow-visible"
            >
              <div className="absolute -top-4 left-6">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Quote className="h-4 w-4 text-primary" />
                </div>
              </div>
              <CardContent className="pt-8 pb-6 px-6">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: item.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-foreground/90 leading-relaxed mb-6 text-sm">
                  "{t(item.quoteKey)}"
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                  <Avatar className="h-10 w-10 ring-2 ring-primary/10">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {item.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{t(item.nameKey)}</p>
                    <p className="text-xs text-muted-foreground">{t(item.roleKey)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
