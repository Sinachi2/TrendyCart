import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, Send, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";

const Contact = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }
    
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      errors.email = "Please enter a valid email";
    }
    
    if (!formData.subject.trim()) {
      errors.subject = "Subject is required";
    } else if (formData.subject.trim().length < 3) {
      errors.subject = "Subject must be at least 3 characters";
    }
    
    if (!formData.message.trim()) {
      errors.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      errors.message = "Message must be at least 10 characters";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-contact-email", {
        body: formData,
      });

      if (error) throw error;

      setIsSuccess(true);
      toast({
        title: "Message sent!",
        description: "We'll get back to you as soon as possible.",
      });

      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
      setValidationErrors({});
      
      setTimeout(() => setIsSuccess(false), 5000);
    } catch (error: any) {
      console.error("Error sending contact email:", error);
      toast({
        title: "Failed to send message",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
    if (validationErrors[id]) {
      setValidationErrors((prev) => ({ ...prev, [id]: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
          </div>
          
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-fade-in">{t("contact.title")}</h1>
              <p className="text-lg text-muted-foreground animate-fade-in">
                {t("contact.subtitle")}
              </p>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 pb-16">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Contact Form */}
              <div className="bg-card border border-border rounded-2xl p-8 shadow-card animate-fade-in">
                <h2 className="text-2xl font-bold mb-6">{t("contact.sendMessage")}</h2>
                
                {isSuccess ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4 animate-scale-in">
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{t("contact.messageSent")}</h3>
                    <p className="text-muted-foreground">
                      {t("contact.messageSentDesc")}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <Label htmlFor="name" className="flex items-center gap-1 mb-2">
                        {t("contact.name")} *
                        {validationErrors.name && (
                          <span className="text-destructive text-xs ml-auto">{validationErrors.name}</span>
                        )}
                      </Label>
                      <Input 
                        id="name" 
                        placeholder={t("contact.namePlaceholder")}
                        value={formData.name}
                        onChange={handleChange}
                        disabled={isLoading}
                        className={`h-12 ${validationErrors.name ? "border-destructive" : ""}`}
                      />
                    </div>

                    <div>
                      <Label htmlFor="email" className="flex items-center gap-1 mb-2">
                        {t("contact.email")} *
                        {validationErrors.email && (
                          <span className="text-destructive text-xs ml-auto">{validationErrors.email}</span>
                        )}
                      </Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder={t("contact.emailPlaceholder")}
                        value={formData.email}
                        onChange={handleChange}
                        disabled={isLoading}
                        className={`h-12 ${validationErrors.email ? "border-destructive" : ""}`}
                      />
                    </div>

                    <div>
                      <Label htmlFor="subject" className="flex items-center gap-1 mb-2">
                        {t("contact.subject")} *
                        {validationErrors.subject && (
                          <span className="text-destructive text-xs ml-auto">{validationErrors.subject}</span>
                        )}
                      </Label>
                      <Input 
                        id="subject" 
                        placeholder={t("contact.subjectPlaceholder")}
                        value={formData.subject}
                        onChange={handleChange}
                        disabled={isLoading}
                        className={`h-12 ${validationErrors.subject ? "border-destructive" : ""}`}
                      />
                    </div>

                    <div>
                      <Label htmlFor="message" className="flex items-center gap-1 mb-2">
                        {t("contact.message")} *
                        {validationErrors.message && (
                          <span className="text-destructive text-xs ml-auto">{validationErrors.message}</span>
                        )}
                      </Label>
                      <Textarea
                        id="message"
                        placeholder={t("contact.messagePlaceholder")}
                        rows={5}
                        value={formData.message}
                        onChange={handleChange}
                        disabled={isLoading}
                        className={`resize-none ${validationErrors.message ? "border-destructive" : ""}`}
                      />
                    </div>

                    <Button type="submit" className="w-full h-12 text-base gap-2" disabled={isLoading}>
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>{t("contact.sending")}</span>
                        </div>
                      ) : (
                        <>
                          {t("contact.send")} <Send className="h-5 w-5" />
                        </>
                      )}
                    </Button>
                    
                    {isLoading && (
                      <p className="text-xs text-muted-foreground text-center animate-pulse">
                        Please wait while we send your message...
                      </p>
                    )}
                  </form>
                )}
              </div>

              {/* Contact Info */}
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-2xl p-6 shadow-card animate-fade-in hover-lift">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{t("contact.emailUs")}</h3>
                      <p className="text-muted-foreground text-sm">trendycart96@gmail.com</p>
                      <p className="text-muted-foreground text-sm">ezeonyekasinachifranklin@gmail.com</p>                    
                      <p className="text-muted-foreground text-sm">ezeonyekasinachi@gmail.com</p>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6 shadow-card animate-fade-in hover-lift" style={{ animationDelay: "0.1s" }}>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-success/10 rounded-xl">
                      <Phone className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{t("contact.callUs")}</h3>
                      <p className="text-muted-foreground">+234 (806) 333-2087</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t("contact.hours")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6 shadow-card animate-fade-in hover-lift" style={{ animationDelay: "0.2s" }}>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-accent/10 rounded-xl">
                      <MapPin className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{t("contact.visitUs")}</h3>
                      <p className="text-muted-foreground">
                        78 Fadahunsi Street<br />
                        Surulere Lagos, 101241<br />
                        Nigeria
                      </p>
                    </div>
                  </div>
                </div>

                {/* Map placeholder */}
                <div className="bg-muted rounded-2xl h-48 flex items-center justify-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
                  <p className="text-muted-foreground text-sm">Interactive map coming soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
