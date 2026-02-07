import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Target, Users, Award, Globe, ShieldCheck, Heart, TrendingUp, Clock } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const About = () => {
  const { t } = useLanguage();

  const stats = [
    { value: "2,000+", label: t("about.statCustomers") },
    { value: "50+", label: t("about.statCountries") },
    { value: "4.9/5", label: t("about.statRating") },
    { value: "24/7", label: t("about.statSupport") },
  ];

  const values = [
    {
      icon: Target,
      title: t("about.missionTitle"),
      description: t("about.missionDesc"),
      color: "bg-primary/10 text-primary",
    },
    {
      icon: Users,
      title: t("about.teamTitle"),
      description: t("about.teamDesc"),
      color: "bg-accent/10 text-accent",
    },
    {
      icon: Award,
      title: t("about.promiseTitle"),
      description: t("about.promiseDesc"),
      color: "bg-success/10 text-success",
    },
  ];

  const timeline = [
    { year: "2024", icon: Heart, title: t("about.timeline1Title"), desc: t("about.timeline1Desc") },
    { year: "2024", icon: Globe, title: t("about.timeline2Title"), desc: t("about.timeline2Desc") },
    { year: "2025", icon: TrendingUp, title: t("about.timeline3Title"), desc: t("about.timeline3Desc") },
    { year: "2025", icon: ShieldCheck, title: t("about.timeline4Title"), desc: t("about.timeline4Desc") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 py-20 md:py-28 relative">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block text-sm font-semibold text-primary uppercase tracking-wider mb-4">
              {t("about.badge")}
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">{t("about.heroTitle")}</h1>
            <p className="text-xl text-muted-foreground leading-relaxed text-balance">
              {t("about.heroSubtitle")}
            </p>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border bg-muted/30">
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-primary mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        {/* Values */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {values.map((item, i) => (
            <div key={i} className="text-center p-8 rounded-2xl border border-border/50 bg-card shadow-card hover-lift">
              <div className={`inline-flex p-4 rounded-xl mb-5 ${item.color}`}>
                <item.icon className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Story */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className="text-center mb-12">
            <span className="inline-block text-sm font-semibold text-accent uppercase tracking-wider mb-3">
              {t("about.storyBadge")}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("about.storyTitle")}</h2>
          </div>
          <div className="bg-card border border-border/50 rounded-2xl p-8 md:p-12 shadow-card">
            <div className="space-y-5 text-muted-foreground leading-relaxed text-lg">
              <p>{t("about.story1")}</p>
              <p>{t("about.story2")}</p>
              <p>{t("about.story3")}</p>
              <p>{t("about.story4")}</p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block text-sm font-semibold text-primary uppercase tracking-wider mb-3">
              {t("about.journeyBadge")}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold">{t("about.journeyTitle")}</h2>
          </div>
          <div className="space-y-6">
            {timeline.map((item, i) => (
              <div key={i} className="flex gap-5 items-start group">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  {i < timeline.length - 1 && <div className="w-px h-full bg-border mt-2 min-h-[24px]" />}
                </div>
                <div className="pb-6">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{item.year}</span>
                  <h3 className="font-semibold text-lg mt-1">{item.title}</h3>
                  <p className="text-muted-foreground text-sm mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default About;
