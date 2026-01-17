import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  CreditCard, 
  RefreshCw, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  Building2,
  Bitcoin,
  ExternalLink
} from "lucide-react";

interface PaymentProof {
  id: string;
  order_id: string | null;
  user_id: string;
  payment_method: string;
  proof_url: string;
  transaction_reference: string | null;
  amount: number | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  profiles: {
    email: string;
    full_name: string | null;
  } | null;
  orders: {
    total_amount: number;
    status: string;
  } | null;
}

const statusOptions = [
  { value: "pending", label: "Pending", color: "bg-yellow-500/10 text-yellow-700", icon: Clock },
  { value: "verified", label: "Verified", color: "bg-green-500/10 text-green-700", icon: CheckCircle },
  { value: "rejected", label: "Rejected", color: "bg-red-500/10 text-red-700", icon: XCircle },
];

const DashboardPayments = () => {
  const navigate = useNavigate();
  const { user, loading, isAdmin } = useAuth();
  const { toast } = useToast();
  const [payments, setPayments] = useState<PaymentProof[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [updatingPayment, setUpdatingPayment] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentProof | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (!loading && user && !isAdmin) {
      navigate("/");
    } else if (user && isAdmin) {
      loadPayments();
    }
  }, [user, loading, isAdmin, navigate]);

  const loadPayments = async () => {
    try {
      setLoadingPayments(true);
      const { data, error } = await supabase
        .from("payment_proofs")
        .select(`
          *,
          profiles:user_id (
            email,
            full_name
          ),
          orders:order_id (
            total_amount,
            status
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPayments(data as unknown as PaymentProof[]);
    } catch (error) {
      console.error("Error loading payments:", error);
      toast({
        title: "Error",
        description: "Failed to load payment proofs",
        variant: "destructive",
      });
    } finally {
      setLoadingPayments(false);
    }
  };

  const updatePaymentStatus = async (paymentId: string, newStatus: string, notes?: string) => {
    setUpdatingPayment(paymentId);
    try {
      const payment = payments.find((p) => p.id === paymentId);
      if (!payment) return;

      // Update payment status
      const { error } = await supabase
        .from("payment_proofs")
        .update({ 
          status: newStatus,
          admin_notes: notes || null,
          verified_by: user?.id,
          verified_at: new Date().toISOString()
        })
        .eq("id", paymentId);

      if (error) throw error;

      // If verified, update order status to processing
      if (newStatus === "verified" && payment.order_id) {
        await supabase
          .from("orders")
          .update({ status: "processing" })
          .eq("id", payment.order_id);

        // Send notification to user
        if (payment.profiles?.email) {
          try {
            await supabase.functions.invoke("send-notification", {
              body: {
                type: "payment_verified",
                email: payment.profiles.email,
                data: {
                  orderId: payment.order_id,
                  customerName: payment.profiles.full_name,
                  status: newStatus,
                },
              },
            });
          } catch (notifError) {
            console.error("Error sending notification:", notifError);
          }
        }
      }

      // Update local state
      setPayments((prev) =>
        prev.map((p) => (p.id === paymentId ? { ...p, status: newStatus, admin_notes: notes || null } : p))
      );

      toast({
        title: "Payment updated",
        description: `Payment status changed to ${newStatus}`,
      });

      setViewDialogOpen(false);
    } catch (error) {
      console.error("Error updating payment:", error);
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive",
      });
    } finally {
      setUpdatingPayment(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find((s) => s.value === status);
    const Icon = statusOption?.icon || Clock;
    return (
      <Badge variant="secondary" className={`${statusOption?.color || ""} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {statusOption?.label || status}
      </Badge>
    );
  };

  const openProofViewer = (payment: PaymentProof) => {
    setSelectedPayment(payment);
    setAdminNotes(payment.admin_notes || "");
    setViewDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  const pendingCount = payments.filter(p => p.status === "pending").length;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />

        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border bg-background px-6">
            <SidebarTrigger />
            <h1 className="text-xl font-semibold">Payment Verification</h1>
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingCount} pending
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={loadPayments}
              className="ml-auto"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </header>

          <main className="flex-1 p-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Proofs ({payments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingPayments ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading payments...</p>
                  </div>
                ) : payments.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No payment proofs yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Order Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {payment.profiles?.full_name || "Anonymous"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {payment.profiles?.email || "N/A"}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {payment.payment_method === "bank_transfer" ? (
                                  <Building2 className="h-4 w-4 text-blue-600" />
                                ) : (
                                  <Bitcoin className="h-4 w-4 text-orange-500" />
                                )}
                                <span className="text-sm capitalize">
                                  {payment.payment_method.replace("_", " ")}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              ${payment.orders?.total_amount?.toFixed(2) || payment.amount?.toFixed(2) || "N/A"}
                            </TableCell>
                            <TableCell>{getStatusBadge(payment.status)}</TableCell>
                            <TableCell>
                              {new Date(payment.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openProofViewer(payment)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                                {payment.status === "pending" && (
                                  <>
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => updatePaymentStatus(payment.id, "verified")}
                                      disabled={updatingPayment === payment.id}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => updatePaymentStatus(payment.id, "rejected")}
                                      disabled={updatingPayment === payment.id}
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>

      {/* View Payment Proof Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Proof Details</DialogTitle>
            <DialogDescription>
              Review the payment proof and update status
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedPayment.profiles?.full_name || "Anonymous"}</p>
                  <p className="text-sm">{selectedPayment.profiles?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <div className="flex items-center gap-2">
                    {selectedPayment.payment_method === "bank_transfer" ? (
                      <Building2 className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Bitcoin className="h-4 w-4 text-orange-500" />
                    )}
                    <span className="capitalize">{selectedPayment.payment_method.replace("_", " ")}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order Amount</p>
                  <p className="font-medium text-lg">
                    ${selectedPayment.orders?.total_amount?.toFixed(2) || selectedPayment.amount?.toFixed(2) || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedPayment.status)}
                </div>
                {selectedPayment.transaction_reference && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Transaction Reference</p>
                    <p className="font-mono text-sm bg-muted p-2 rounded">{selectedPayment.transaction_reference}</p>
                  </div>
                )}
              </div>

              {/* Proof Image */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Payment Proof</p>
                <div className="border rounded-lg p-2 bg-muted/50">
                  <a 
                    href={selectedPayment.proof_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Payment Proof Image
                  </a>
                  <img 
                    src={selectedPayment.proof_url} 
                    alt="Payment proof" 
                    className="mt-2 max-h-64 object-contain rounded"
                  />
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <Label htmlFor="admin-notes">Admin Notes</Label>
                <Textarea
                  id="admin-notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this payment verification..."
                  rows={3}
                />
              </div>

              {/* Actions */}
              {selectedPayment.status === "pending" && (
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="destructive"
                    onClick={() => updatePaymentStatus(selectedPayment.id, "rejected", adminNotes)}
                    disabled={updatingPayment === selectedPayment.id}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Payment
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => updatePaymentStatus(selectedPayment.id, "verified", adminNotes)}
                    disabled={updatingPayment === selectedPayment.id}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Verify Payment
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default DashboardPayments;
