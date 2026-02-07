import { Search, CreditCard, Package, CheckCircle } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const steps = [
  { icon: Search, colorClass: "bg-primary/10 text-primary", titleKey: "howItWorks.step1Title", descKey: "howItWorks.step1Desc" },
  { icon: CreditCard, colorClass: "bg-accent/10 text-accent", titleKey: "howItWorks.step2Title", descKey: "howItWorks.step2Desc" },
  { icon: Package, colorClass: "bg-success/10 text-success", titleKey: "howItWorks.step3Title", descKey: "howItWorks.step3Desc" },
  { icon: CheckCircle, colorClass: "bg-warning/10 text-warning", titleKey: "howItWorks.step4Title", descKey: "howItWorks.step4Desc" },
];

const HowItWorksSection = () => {
  const { t } = useLanguage();

  return (
    <section className="py-20 border-y border-border/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <span className="inline-block text-sm font-semibold text-accent uppercase tracking-wider mb-3">
            {t("howItWorks.badge")}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("howItWorks.title")}</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t("howItWorks.subtitle")}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <div key={i} className="relative text-center group">
              {/* Connector line (hidden on first and on mobile) */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-px bg-border" />
              )}

              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl ${step.colorClass} mb-5 transition-transform group-hover:scale-110 duration-300`}>
                <step.icon className="h-8 w-8" />
              </div>

              <div className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">
                {t("howItWorks.stepLabel")} {i + 1}
              </div>
              <h3 className="font-semibold text-lg mb-2">{t(step.titleKey)}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t(step.descKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
