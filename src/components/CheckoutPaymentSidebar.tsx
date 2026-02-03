import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Bitcoin,
  Copy,
  Check,
  Upload,
  FileImage,
  X,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  products: {
    name: string;
    price: number;
    image_url: string;
  };
}

interface CheckoutPaymentSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItems: CartItem[];
  totalAmount: number;
  onBack: () => void;
  onOrderComplete: (orderId: string) => void;
}

type PaymentMethod = "bank_transfer" | "crypto" | null;

const BANK_DETAILS = {
  bank: "Fidelity Bank",
  accountName: "SINACHI FRANKLIN EZEONYEKA",
  accountNumber: "6152779644",
};

const CRYPTO_DETAILS = {
  network: "USDT (BEP20)",
  walletAddress: "0x689dc021f5b7ed12883a401addc45fff7f279c19",
};

export const CheckoutPaymentSidebar = ({
  open,
  onOpenChange,
  selectedItems,
  totalAmount,
  onBack,
  onOrderComplete,
}: CheckoutPaymentSidebarProps) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [transactionRef, setTransactionRef] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({
      title: "Copied!",
      description: `${field} copied to clipboard`,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload JPG, PNG, WebP, or PDF",
          variant: "destructive",
        });
        return;
      }

      setProofFile(file);

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setProofPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setProofPreview(null);
      }
    }
  };

  const removeFile = () => {
    setProofFile(null);
    setProofPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmitOrder = async () => {
    if (!user || !paymentMethod || !proofFile) {
      toast({
        title: "Missing information",
        description: "Please select a payment method and upload proof",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // 1. Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total_amount: totalAmount,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Create order items
      const orderItems = selectedItems.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.products.name,
        product_price: item.products.price,
        quantity: item.quantity,
        subtotal: item.products.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 3. Upload payment proof
      const fileExt = proofFile.name.split(".").pop();
      const fileName = `${user.id}/${order.id}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(fileName, proofFile);

      if (uploadError) throw uploadError;

      // 4. Create payment proof record
      const { data: urlData } = supabase.storage
        .from("payment-proofs")
        .getPublicUrl(fileName);

      const { error: proofError } = await supabase
        .from("payment_proofs")
        .insert({
          order_id: order.id,
          user_id: user.id,
          payment_method: paymentMethod,
          proof_url: urlData.publicUrl,
          transaction_reference: transactionRef || null,
          amount: totalAmount,
          status: "pending",
        });

      if (proofError) throw proofError;

      // 5. Remove selected items from cart
      const selectedIds = selectedItems.map((item) => item.id);
      const { error: deleteError } = await supabase
        .from("cart_items")
        .delete()
        .in("id", selectedIds);

      if (deleteError) throw deleteError;

      // 6. Trigger cart update event
      window.dispatchEvent(new Event("cartUpdated"));

      // 7. Show success state
      setOrderSuccess(order.id);

      toast({
        title: "Order submitted!",
        description: "Your payment proof is being reviewed",
      });
    } catch (error) {
      console.error("Error submitting order:", error);
      toast({
        title: "Error",
        description: "Failed to submit order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = () => {
    if (orderSuccess) {
      onOpenChange(false);
      navigate(`/order-confirmation/${orderSuccess}`);
    }
  };

  const handleClose = () => {
    setOrderSuccess(null);
    setPaymentMethod(null);
    setTransactionRef("");
    setProofFile(null);
    setProofPreview(null);
    onOpenChange(false);
  };

  const canSubmit = paymentMethod && proofFile && !loading;

  // Success State
  if (orderSuccess) {
    return (
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col items-center justify-center">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Order Submitted!</h2>
              <p className="text-muted-foreground">
                Your order #{orderSuccess.slice(0, 8)} has been placed.
              </p>
              <p className="text-muted-foreground mt-2">
                We'll notify you once your payment is verified.
              </p>
            </div>
            <div className="space-y-2 w-full max-w-xs">
              <Button onClick={handleViewOrder} className="w-full">
                View Order Details
              </Button>
              <Button onClick={handleClose} variant="outline" className="w-full">
                Continue Shopping
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <SheetTitle>Choose Payment Method</SheetTitle>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                <Check className="h-3.5 w-3.5" />
              </div>
              <span className="text-muted-foreground">Items</span>
            </div>
            <div className="flex-1 h-px bg-primary" />
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                2
              </div>
              <span className="font-medium">Payment</span>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* Payment Method Selection */}
          <div className="space-y-3">
            {/* Bank Transfer Card */}
            <div
              className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                paymentMethod === "bank_transfer"
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border hover:border-primary/50"
              }`}
              onClick={() => setPaymentMethod("bank_transfer")}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Bank Transfer</h4>
                  <p className="text-xs text-muted-foreground">Direct bank deposit</p>
                </div>
                {paymentMethod === "bank_transfer" && (
                  <Check className="ml-auto h-5 w-5 text-primary" />
                )}
              </div>

              {paymentMethod === "bank_transfer" && (
                <div className="space-y-2 pt-3 border-t">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Bank:</span>
                    <span className="font-medium">{BANK_DETAILS.bank}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Account Name:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-xs truncate max-w-[150px]">
                        {BANK_DETAILS.accountName}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(BANK_DETAILS.accountName, "Account name");
                        }}
                      >
                        {copiedField === "Account name" ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Account Number:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium font-mono">
                        {BANK_DETAILS.accountNumber}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(BANK_DETAILS.accountNumber, "Account number");
                        }}
                      >
                        {copiedField === "Account number" ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Cryptocurrency Card */}
            <div
              className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                paymentMethod === "crypto"
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border hover:border-primary/50"
              }`}
              onClick={() => setPaymentMethod("crypto")}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <Bitcoin className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Cryptocurrency</h4>
                  <p className="text-xs text-muted-foreground">USDT (BEP20)</p>
                </div>
                {paymentMethod === "crypto" && (
                  <Check className="ml-auto h-5 w-5 text-primary" />
                )}
              </div>

              {paymentMethod === "crypto" && (
                <div className="space-y-2 pt-3 border-t">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Network:</span>
                    <span className="font-medium">{CRYPTO_DETAILS.network}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Wallet Address:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                        {CRYPTO_DETAILS.walletAddress}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(CRYPTO_DETAILS.walletAddress, "Wallet address");
                        }}
                      >
                        {copiedField === "Wallet address" ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Transaction Reference */}
          {paymentMethod && (
            <div className="space-y-2">
              <Label htmlFor="transactionRef">
                Transaction Reference (Optional)
              </Label>
              <Input
                id="transactionRef"
                placeholder="Enter your transaction reference"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
              />
            </div>
          )}

          {/* Payment Proof Upload */}
          {paymentMethod && (
            <div className="space-y-2">
              <Label>Payment Proof *</Label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  proofFile ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                {proofFile ? (
                  <div className="space-y-3">
                    {proofPreview ? (
                      <img
                        src={proofPreview}
                        alt="Payment proof preview"
                        className="max-h-32 mx-auto rounded-lg object-contain"
                      />
                    ) : (
                      <FileImage className="w-12 h-12 mx-auto text-primary" />
                    )}
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm font-medium truncate max-w-[200px]">
                        {proofFile.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={removeFile}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">
                      Click to upload payment proof
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG, WebP, or PDF (max 5MB)
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          )}

          {/* Order Summary */}
          {paymentMethod && (
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium py-2">
                <span>Order Summary ({selectedItems.length} items)</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2 space-y-2">
                {selectedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between text-sm text-muted-foreground"
                  >
                    <span className="truncate flex-1 mr-2">
                      {item.products?.name} × {item.quantity}
                    </span>
                    <span>
                      ${((item.products?.price || 0) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>

        {/* Footer */}
        <div className="border-t pt-4 space-y-4">
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total:</span>
            <span className="text-primary">${totalAmount.toFixed(2)}</span>
          </div>

          <Button
            onClick={handleSubmitOrder}
            className="w-full"
            size="lg"
            disabled={!canSubmit}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Order"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
