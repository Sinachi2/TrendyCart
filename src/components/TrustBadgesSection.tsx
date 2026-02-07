import { Shield, Lock, RefreshCw, Globe, CreditCard, Headphones } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const badges = [
  { icon: Lock, titleKey: "trust.ssl", descKey: "trust.sslDesc" },
  { icon: Shield, titleKey: "trust.verified", descKey: "trust.verifiedDesc" },
  { icon: RefreshCw, titleKey: "trust.refund", descKey: "trust.refundDesc" },
  { icon: Globe, titleKey: "trust.global", descKey: "trust.globalDesc" },
  { icon: CreditCard, titleKey: "trust.payments", descKey: "trust.paymentsDesc" },
  { icon: Headphones, titleKey: "trust.support", descKey: "trust.supportDesc" },
];

const TrustBadgesSection = () => {
  const { t } = useLanguage();

  return (
    <section className="py-16 bg-card border-y border-border/50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {badges.map((badge, i) => (
            <div key={i} className="flex flex-col items-center text-center gap-3 p-4">
              <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center">
                <badge.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-xs">{t(badge.titleKey)}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{t(badge.descKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBadgesSection;
