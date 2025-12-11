import { useState, useEffect } from "react";
import { CreditCard, Plus, Trash2, Star, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PaymentMethod {
  id: string;
  card_last_four: string;
  card_brand: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

interface PaymentMethodsProps {
  userId: string;
}

const cardBrandIcons: Record<string, string> = {
  visa: "💳",
  mastercard: "💳",
  amex: "💳",
  discover: "💳",
};

export const PaymentMethods = ({ userId }: PaymentMethodsProps) => {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    cardNumber: "",
    expMonth: "",
    expYear: "",
    cvv: "",
    isDefault: false,
  });

  useEffect(() => {
    loadMethods();
  }, [userId]);

  const loadMethods = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("user_id", userId)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMethods(data || []);
    } catch (error) {
      console.error("Error loading payment methods:", error);
    } finally {
      setLoading(false);
    }
  };

  const detectCardBrand = (number: string): string => {
    const cleaned = number.replace(/\D/g, "");
    if (/^4/.test(cleaned)) return "Visa";
    if (/^5[1-5]/.test(cleaned)) return "Mastercard";
    if (/^3[47]/.test(cleaned)) return "Amex";
    if (/^6(?:011|5)/.test(cleaned)) return "Discover";
    return "Card";
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\D/g, "").slice(0, 16);
    const groups = v.match(/.{1,4}/g);
    return groups ? groups.join(" ") : v;
  };

  const handleSave = async () => {
    const cardNum = formData.cardNumber.replace(/\D/g, "");
    if (cardNum.length < 13) {
      toast({ title: "Invalid card number", variant: "destructive" });
      return;
    }
    if (!formData.expMonth || !formData.expYear) {
      toast({ title: "Invalid expiration date", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      if (formData.isDefault) {
        await supabase
          .from("payment_methods")
          .update({ is_default: false })
          .eq("user_id", userId);
      }

      const { error } = await supabase.from("payment_methods").insert({
        user_id: userId,
        card_last_four: cardNum.slice(-4),
        card_brand: detectCardBrand(cardNum),
        exp_month: parseInt(formData.expMonth),
        exp_year: parseInt(formData.expYear),
        is_default: methods.length === 0 ? true : formData.isDefault,
      });

      if (error) throw error;

      toast({ title: "Payment method added" });
      setDialogOpen(false);
      setFormData({ cardNumber: "", expMonth: "", expYear: "", cvv: "", isDefault: false });
      loadMethods();
    } catch (error) {
      console.error("Error saving payment method:", error);
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("payment_methods").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Payment method removed" });
      loadMethods();
    } catch (error) {
      console.error("Error deleting payment method:", error);
      toast({ title: "Failed to delete", variant: "destructive" });
    }
    setDeleteId(null);
  };

  const handleSetDefault = async (id: string) => {
    try {
      await supabase
        .from("payment_methods")
        .update({ is_default: false })
        .eq("user_id", userId);

      const { error } = await supabase
        .from("payment_methods")
        .update({ is_default: true })
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Default payment method updated" });
      loadMethods();
    } catch (error) {
      console.error("Error setting default:", error);
    }
  };

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50 shadow-sm">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-card/50 backdrop-blur border-border/50 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Payment Methods</h2>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="rounded-xl gap-2">
                  <Plus className="h-4 w-4" />
                  Add Card
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Payment Method</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Card Number</Label>
                    <Input
                      value={formData.cardNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, cardNumber: formatCardNumber(e.target.value) })
                      }
                      className="h-11 rounded-xl font-mono"
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Month</Label>
                      <Input
                        value={formData.expMonth}
                        onChange={(e) =>
                          setFormData({ ...formData, expMonth: e.target.value.replace(/\D/g, "").slice(0, 2) })
                        }
                        className="h-11 rounded-xl"
                        placeholder="MM"
                        maxLength={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Year</Label>
                      <Input
                        value={formData.expYear}
                        onChange={(e) =>
                          setFormData({ ...formData, expYear: e.target.value.replace(/\D/g, "").slice(0, 4) })
                        }
                        className="h-11 rounded-xl"
                        placeholder="YYYY"
                        maxLength={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">CVV</Label>
                      <Input
                        value={formData.cvv}
                        onChange={(e) =>
                          setFormData({ ...formData, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })
                        }
                        className="h-11 rounded-xl"
                        placeholder="123"
                        type="password"
                        maxLength={4}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      This is a demo. Card details are stored securely but no real charges will be made.
                    </p>
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-foreground">Set as default payment method</span>
                  </label>
                </div>

                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving} className="rounded-xl">
                    {saving ? "Adding..." : "Add Card"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {methods.length === 0 ? (
            <div className="text-center py-10">
              <CreditCard className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">No payment methods saved</p>
              <Button variant="outline" className="rounded-xl gap-2" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                Add Your First Card
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {methods.map((method) => (
                <div
                  key={method.id}
                  className={`relative p-4 rounded-xl border transition-all ${
                    method.is_default
                      ? "border-primary/30 bg-primary/5"
                      : "border-border/50 bg-muted/20 hover:bg-muted/40"
                  }`}
                >
                  {method.is_default && (
                    <span className="absolute top-3 right-3 flex items-center gap-1 text-xs font-medium text-primary">
                      <Star className="h-3 w-3 fill-current" />
                      Default
                    </span>
                  )}

                  <div className="flex items-center gap-4">
                    <div className="h-12 w-16 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-xs font-bold">
                      {method.card_brand.slice(0, 4).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        {method.card_brand} •••• {method.card_last_four}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Expires {method.exp_month.toString().padStart(2, "0")}/{method.exp_year}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
                    {!method.is_default && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-muted-foreground hover:text-primary"
                        onClick={() => handleSetDefault(method.id)}
                      >
                        <Star className="h-3.5 w-3.5 mr-1.5" />
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-muted-foreground hover:text-destructive ml-auto"
                      onClick={() => setDeleteId(method.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Payment Method?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the card from your saved payment methods.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
