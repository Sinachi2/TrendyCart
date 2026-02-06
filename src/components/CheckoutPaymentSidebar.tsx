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
  Calendar,
  User,
  FileText,
  DollarSign,
  Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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
import { useLanguage } from "@/hooks/useLanguage";

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
type CurrencyType = "fiat" | "crypto" | null;

const BANK_DETAILS = {
  bank: "Fidelity Bank",
  accountName: "SINACHI FRANKLIN EZEONYEKA",
  accountNumber: "6152779644",
};

const CRYPTO_DETAILS = {
  network: "USDT (BEP20)",
  walletAddress: "0x689dc021f5b7ed12883a401addc45fff7f279c19",
};

const FIAT_CURRENCIES = [
  { code: "NGN", name: "Nigerian Naira", symbol: "₦", flag: "🇳🇬" },
  { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
  { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧" },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "₵", flag: "🇬🇭" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh", flag: "🇰🇪" },
];

const CRYPTO_CURRENCIES = [
  { code: "USDT", name: "Tether (USDT)", symbol: "₮", flag: "🪙" },
  { code: "BTC", name: "Bitcoin", symbol: "₿", flag: "🪙" },
  { code: "ETH", name: "Ethereum", symbol: "Ξ", flag: "🪙" },
];

export const CheckoutPaymentSidebar = ({
  open,
  onOpenChange,
  selectedItems,
  totalAmount,
  onBack,
  onOrderComplete,
}: CheckoutPaymentSidebarProps) => {
  const [currencyType, setCurrencyType] = useState<CurrencyType>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [transactionRef, setTransactionRef] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [senderName, setSenderName] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!selectedCurrency) {
      errors.currency = t("checkout.currencyRequired");
    }
    if (!paymentMethod) {
      errors.paymentMethod = "Please select a payment method";
    }
    if (!transactionRef.trim()) {
      errors.transactionRef = "Transaction reference is required";
    }
    if (!paymentDate) {
      errors.paymentDate = "Payment date is required";
    }
    if (!senderName.trim()) {
      errors.senderName = "Sender name is required";
    }
    if (!proofFile) {
      errors.proofFile = "Payment proof is required";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

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
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

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

  const handleCurrencyTypeSelect = (type: CurrencyType) => {
    setCurrencyType(type);
    setSelectedCurrency(null);
    // Auto-set payment method based on currency type
    if (type === "fiat") {
      setPaymentMethod("bank_transfer");
    } else if (type === "crypto") {
      setPaymentMethod("crypto");
    }
  };

  const handleSubmitOrder = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to continue",
        variant: "destructive",
      });
      return;
    }

    if (!validateForm()) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setUploadProgress(0);

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

      // 3. Upload payment proof with progress simulation
      setUploadProgress(10);
      const fileExt = proofFile!.name.split(".").pop();
      const fileName = `${user.id}/${order.id}_${Date.now()}.${fileExt}`;

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 15, 85));
      }, 200);

      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(fileName, proofFile!);

      clearInterval(progressInterval);
      setUploadProgress(100);

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

      // 7. Send order notification email
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", user.id)
          .single();

        await supabase.functions.invoke("send-order-email", {
          body: {
            orderId: order.id,
            customerName: profile?.full_name || "Customer",
            customerEmail: profile?.email || user.email,
            items: orderItems,
            totalAmount,
            paymentMethod,
            currency: selectedCurrency,
          },
        });
      } catch (emailError) {
        console.error("Failed to send order email:", emailError);
      }

      // 8. Show success state
      setOrderSuccess(order.id);

      toast({
        title: "🎉 Order submitted!",
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
    setCurrencyType(null);
    setSelectedCurrency(null);
    setPaymentMethod(null);
    setTransactionRef("");
    setPaymentDate("");
    setSenderName("");
    setAdditionalNotes("");
    setProofFile(null);
    setProofPreview(null);
    setUploadProgress(0);
    setValidationErrors({});
    onOpenChange(false);
  };

  const canSubmit = paymentMethod && selectedCurrency && proofFile && transactionRef && paymentDate && senderName && !loading;

  // Success State
  if (orderSuccess) {
    return (
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col items-center justify-center">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto animate-scale-in">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">🎉 {t("checkout.orderSubmitted")}</h2>
              <p className="text-muted-foreground">
                {t("checkout.orderPlaced")} #{orderSuccess.slice(0, 8).toUpperCase()}
              </p>
              <p className="text-muted-foreground mt-2">
                {t("checkout.verifyNotice")}
              </p>
            </div>
            <div className="space-y-2 w-full max-w-xs">
              <Button onClick={() => { onOpenChange(false); navigate("/user-dashboard"); }} className="w-full">
                {t("checkout.goToDashboard")}
              </Button>
              <Button onClick={handleViewOrder} variant="outline" className="w-full">
                {t("checkout.viewOrder")}
              </Button>
              <Button onClick={() => { onOpenChange(false); navigate("/user-dashboard/orders"); }} variant="ghost" className="w-full text-muted-foreground">
                {t("checkout.reversePurchase")}
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
            <SheetTitle>{t("checkout.choosePayment")}</SheetTitle>
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
          {/* Currency Type Selection */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <Coins className="h-4 w-4" />
              {t("checkout.selectCurrency")} *
            </Label>
            {validationErrors.currency && (
              <p className="text-destructive text-xs">{validationErrors.currency}</p>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              <div
                className={`p-4 border-2 rounded-xl cursor-pointer transition-all text-center ${
                  currencyType === "fiat"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => handleCurrencyTypeSelect("fiat")}
              >
                <DollarSign className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="font-semibold text-sm">{t("checkout.fiatCurrency")}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("checkout.bankTransfer")}</p>
              </div>
              <div
                className={`p-4 border-2 rounded-xl cursor-pointer transition-all text-center ${
                  currencyType === "crypto"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => handleCurrencyTypeSelect("crypto")}
              >
                <Bitcoin className="h-6 w-6 mx-auto mb-2 text-warning" />
                <p className="font-semibold text-sm">{t("checkout.cryptocurrency")}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("checkout.stablecoin")}</p>
              </div>
            </div>

            {/* Currency selector */}
            {currencyType === "fiat" && (
              <div className="grid grid-cols-3 gap-2 animate-fade-in">
                {FIAT_CURRENCIES.map((cur) => (
                  <button
                    key={cur.code}
                    onClick={() => setSelectedCurrency(cur.code)}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                      selectedCurrency === cur.code
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <span>{cur.flag}</span>
                    <span>{cur.code}</span>
                  </button>
                ))}
              </div>
            )}

            {currencyType === "crypto" && (
              <div className="grid grid-cols-3 gap-2 animate-fade-in">
                {CRYPTO_CURRENCIES.map((cur) => (
                  <button
                    key={cur.code}
                    onClick={() => setSelectedCurrency(cur.code)}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                      selectedCurrency === cur.code
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <span>{cur.flag}</span>
                    <span>{cur.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Payment Method Details - Only show after currency is selected */}
          {selectedCurrency && currencyType === "fiat" && (
            <div className="space-y-3 animate-fade-in">
              <div className="p-4 border-2 border-primary rounded-xl bg-primary/5 ring-2 ring-primary/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{t("checkout.bankTransfer")}</h4>
                    <p className="text-xs text-muted-foreground">{t("checkout.bankTransferDesc")}</p>
                  </div>
                  <Check className="ml-auto h-5 w-5 text-primary" />
                </div>

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
                        onClick={() => copyToClipboard(BANK_DETAILS.accountName, "Account name")}
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
                        onClick={() => copyToClipboard(BANK_DETAILS.accountNumber, "Account number")}
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
              </div>
            </div>
          )}

          {selectedCurrency && currencyType === "crypto" && (
            <div className="space-y-3 animate-fade-in">
              <div className="p-4 border-2 border-primary rounded-xl bg-primary/5 ring-2 ring-primary/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Bitcoin className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{t("checkout.cryptocurrency")}</h4>
                    <p className="text-xs text-muted-foreground">{t("checkout.cryptoDesc")}</p>
                  </div>
                  <Check className="ml-auto h-5 w-5 text-primary" />
                </div>

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
                        onClick={() => copyToClipboard(CRYPTO_DETAILS.walletAddress, "Wallet address")}
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
              </div>
            </div>
          )}

          {/* Transaction Details - Required Fields */}
          {selectedCurrency && paymentMethod && (
            <div className="space-y-4 p-4 bg-muted/30 rounded-xl border animate-fade-in">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t("checkout.paymentDetails")}
              </h4>
              
              <div className="space-y-2">
                <Label htmlFor="transactionRef" className="flex items-center gap-1">
                  {t("checkout.transactionRef")} *
                  {validationErrors.transactionRef && (
                    <span className="text-destructive text-xs ml-auto">{validationErrors.transactionRef}</span>
                  )}
                </Label>
                <Input
                  id="transactionRef"
                  placeholder="Enter your transaction reference or hash"
                  value={transactionRef}
                  onChange={(e) => {
                    setTransactionRef(e.target.value);
                    if (validationErrors.transactionRef) {
                      setValidationErrors((prev) => ({ ...prev, transactionRef: "" }));
                    }
                  }}
                  className={validationErrors.transactionRef ? "border-destructive" : ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentDate" className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {t("checkout.paymentDate")} *
                  {validationErrors.paymentDate && (
                    <span className="text-destructive text-xs ml-auto">{validationErrors.paymentDate}</span>
                  )}
                </Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => {
                    setPaymentDate(e.target.value);
                    if (validationErrors.paymentDate) {
                      setValidationErrors((prev) => ({ ...prev, paymentDate: "" }));
                    }
                  }}
                  className={validationErrors.paymentDate ? "border-destructive" : ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="senderName" className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {t("checkout.senderName")} *
                  {validationErrors.senderName && (
                    <span className="text-destructive text-xs ml-auto">{validationErrors.senderName}</span>
                  )}
                </Label>
                <Input
                  id="senderName"
                  placeholder={t("checkout.senderNamePlaceholder")}
                  value={senderName}
                  onChange={(e) => {
                    setSenderName(e.target.value);
                    if (validationErrors.senderName) {
                      setValidationErrors((prev) => ({ ...prev, senderName: "" }));
                    }
                  }}
                  className={validationErrors.senderName ? "border-destructive" : ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalNotes">
                  {t("checkout.additionalNotes")}
                </Label>
                <Textarea
                  id="additionalNotes"
                  placeholder={t("checkout.notesPlaceholder")}
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          )}

          {/* Payment Proof Upload */}
          {selectedCurrency && paymentMethod && (
            <div className="space-y-2 animate-fade-in">
              <Label className="flex items-center gap-1">
                {t("checkout.proofRequired")} *
                {validationErrors.proofFile && (
                  <span className="text-destructive text-xs ml-auto">{validationErrors.proofFile}</span>
                )}
              </Label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  proofFile ? "border-primary bg-primary/5" : validationErrors.proofFile ? "border-destructive" : "border-border"
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
                    {loading && uploadProgress > 0 && (
                      <div className="space-y-1">
                        <Progress value={uploadProgress} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {uploadProgress < 100 ? t("checkout.uploading") : "Upload complete!"}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className="cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">
                      {t("checkout.uploadProof")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("checkout.uploadFormats")}
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
          {selectedCurrency && paymentMethod && (
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium py-2">
                <span>{t("checkout.orderSummary")} ({selectedItems.length} {t("cart.items")})</span>
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
                {selectedCurrency && (
                  <div className="pt-2 border-t text-xs text-muted-foreground">
                    Currency: <span className="font-medium text-foreground">{selectedCurrency}</span>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>

        {/* Footer */}
        <div className="border-t pt-4 space-y-4">
          <div className="flex justify-between items-center text-lg font-bold">
            <span>{t("checkout.total")}:</span>
            <span className="text-primary">${totalAmount.toFixed(2)}</span>
          </div>

          <Button
            onClick={handleSubmitOrder}
            className="w-full"
            size="lg"
            disabled={!canSubmit}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>
                  {uploadProgress > 0 && uploadProgress < 100
                    ? `${t("checkout.uploading")} ${uploadProgress}%`
                    : uploadProgress === 100
                    ? t("checkout.processing")
                    : t("checkout.submitting")}
                </span>
              </div>
            ) : (
              t("checkout.submitOrder")
            )}
          </Button>
          
          {loading && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground animate-pulse">
                {t("checkout.wait")}
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
