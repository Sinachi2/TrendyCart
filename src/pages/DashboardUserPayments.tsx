import { useEffect, useState } from "react";
import {
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";

interface PaymentProof {
  id: string;
  order_id: string;
  payment_method: string;
  amount: number;
  status: string;
  proof_url: string;
  transaction_reference: string | null;
  created_at: string;
}

const DashboardPayments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentProof[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPayments();
    }
  }, [user]);

  const loadPayments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("payment_proofs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error("Error loading payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "verified":
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
      case "verified":
      case "approved":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
      case "rejected":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "bank_transfer":
        return "Bank Transfer";
      case "crypto":
        return "Cryptocurrency";
      default:
        return method;
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Payments" description="View your payment history">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Payments" description="View your payment history and verification status">
      {payments.length === 0 ? (
        <Card className="bg-card/50">
          <CardContent className="py-12 text-center">
            <CreditCard className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="font-semibold mb-2">No payments yet</h3>
            <p className="text-muted-foreground text-sm">
              Your payment history will appear here after you make a purchase
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {payments.map((payment, index) => (
            <Card 
              key={payment.id}
              className="bg-card/50 backdrop-blur border-border/50 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">
                          {getPaymentMethodLabel(payment.payment_method)}
                        </h3>
                        <Badge className={`${getStatusColor(payment.status)} border flex items-center gap-1`}>
                          {getStatusIcon(payment.status)}
                          {payment.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Order #{payment.order_id?.slice(0, 8).toUpperCase() || "N/A"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(payment.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {payment.transaction_reference && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Ref: {payment.transaction_reference}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold">
                      ${parseFloat(String(payment.amount)).toFixed(2)}
                    </span>
                    {payment.proof_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => window.open(payment.proof_url, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View Proof
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default DashboardPayments;
