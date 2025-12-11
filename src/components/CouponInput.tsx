import { useState } from "react";
import { Tag, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number;
}

interface CouponInputProps {
  subtotal: number;
  onCouponApplied: (coupon: Coupon | null, discount: number) => void;
  appliedCoupon: Coupon | null;
}

const CouponInput = ({ subtotal, onCouponApplied, appliedCoupon }: CouponInputProps) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const validateCoupon = async () => {
    if (!code.trim()) return;

    setLoading(true);
    try {
      const { data: coupon, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", code.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;

      if (!coupon) {
        toast({
          title: "Invalid coupon",
          description: "This coupon code doesn't exist or has expired",
          variant: "destructive",
        });
        return;
      }

      // Check expiration
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        toast({
          title: "Coupon expired",
          description: "This coupon has expired",
          variant: "destructive",
        });
        return;
      }

      // Check min order amount
      if (subtotal < coupon.min_order_amount) {
        toast({
          title: "Minimum not met",
          description: `This coupon requires a minimum order of $${coupon.min_order_amount}`,
          variant: "destructive",
        });
        return;
      }

      // Check max uses
      if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
        toast({
          title: "Coupon limit reached",
          description: "This coupon has reached its usage limit",
          variant: "destructive",
        });
        return;
      }

      // Calculate discount
      let discount = 0;
      if (coupon.discount_type === "percentage") {
        discount = subtotal * (coupon.discount_value / 100);
      } else {
        discount = Math.min(coupon.discount_value, subtotal);
      }

      onCouponApplied(coupon, discount);
      toast({
        title: "Coupon applied!",
        description: `You saved $${discount.toFixed(2)}`,
      });
    } catch (error) {
      console.error("Error validating coupon:", error);
      toast({
        title: "Error",
        description: "Failed to validate coupon",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeCoupon = () => {
    setCode("");
    onCouponApplied(null, 0);
    toast({
      title: "Coupon removed",
      description: "The discount has been removed from your order",
    });
  };

  if (appliedCoupon) {
    return (
      <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-600" />
          <span className="font-medium text-green-700 dark:text-green-400">
            {appliedCoupon.code}
          </span>
          <span className="text-sm text-muted-foreground">
            ({appliedCoupon.discount_type === "percentage"
              ? `${appliedCoupon.discount_value}% off`
              : `$${appliedCoupon.discount_value} off`})
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={removeCoupon}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Enter coupon code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="pl-10"
            onKeyDown={(e) => e.key === "Enter" && validateCoupon()}
          />
        </div>
        <Button onClick={validateCoupon} disabled={loading || !code.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Try: WELCOME10, SAVE20, or SUMMER25
      </p>
    </div>
  );
};

export default CouponInput;
