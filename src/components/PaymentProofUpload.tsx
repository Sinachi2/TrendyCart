import { useState } from "react";
import { Upload, Check, Building2, Bitcoin, Copy, AlertCircle, Image, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PAYMENT_DETAILS = {
  bank: {
    name: "Fidelity Bank",
    accountName: "SINACHI FRANKLIN EZEONYEKA",
    accountNumber: "6152779644",
  },
  crypto: {
    network: "USDT (TRC20)",
    walletAddress: "0x689dc021f5b7ed12883a401addc45fff7f279c19",
  },
};

interface PaymentProofUploadProps {
  orderId: string;
  amount: number;
  onSuccess?: () => void;
}

const PaymentProofUpload = ({ orderId, amount, onSuccess }: PaymentProofUploadProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<"bank_transfer" | "crypto">("bank_transfer");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [transactionRef, setTransactionRef] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast({
        title: "Copied!",
        description: `${field} copied to clipboard`,
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy manually",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image (JPG, PNG, WebP) or PDF",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setProofFile(file);

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async () => {
    if (!user || !proofFile) {
      toast({
        title: "Missing information",
        description: "Please upload your payment proof",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      // Upload file to storage
      const fileExt = proofFile.name.split(".").pop();
      const fileName = `${user.id}/${orderId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(fileName, proofFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("payment-proofs")
        .getPublicUrl(fileName);

      // Create payment proof record
      const { error: insertError } = await supabase
        .from("payment_proofs")
        .insert({
          order_id: orderId,
          user_id: user.id,
          payment_method: paymentMethod,
          proof_url: publicUrl,
          transaction_reference: transactionRef || null,
          amount,
          status: "pending",
        });

      if (insertError) throw insertError;

      // Get user profile for email
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", user.id)
        .single();

      // Send confirmation email
      try {
        await supabase.functions.invoke("send-notification", {
          body: {
            type: "payment_submitted",
            email: profile?.email || user.email,
            data: {
              orderId,
              customerName: profile?.full_name || "Customer",
              amount,
              paymentMethod: paymentMethod === "bank_transfer" ? "Bank Transfer" : "Cryptocurrency",
            },
          },
        });
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
      }

      setSubmitted(true);
      toast({
        title: "Payment proof submitted!",
        description: "Your payment is being verified. You'll be notified once confirmed.",
      });
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting payment proof:", error);
      toast({
        title: "Error",
        description: "Failed to submit payment proof. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
              Payment Proof Submitted
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300 mt-2">
              Your payment is being verified. You'll receive a notification once it's confirmed.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Submit Payment Proof
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Complete your payment using the details below, then upload your receipt or transaction screenshot.
          </AlertDescription>
        </Alert>

        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm font-medium">Amount Due</p>
          <p className="text-2xl font-bold text-primary">${amount.toFixed(2)}</p>
        </div>

        <Tabs 
          value={paymentMethod} 
          onValueChange={(v) => setPaymentMethod(v as "bank_transfer" | "crypto")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bank_transfer" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Bank Transfer
            </TabsTrigger>
            <TabsTrigger value="crypto" className="flex items-center gap-2">
              <Bitcoin className="h-4 w-4" />
              Crypto
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bank_transfer" className="space-y-3 mt-4">
            <div className="bg-muted/50 p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between p-2 bg-background rounded-lg">
                <span className="text-sm text-muted-foreground">Bank:</span>
                <span className="font-medium">{PAYMENT_DETAILS.bank.name}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-background rounded-lg">
                <span className="text-sm text-muted-foreground">Account Name:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-xs">{PAYMENT_DETAILS.bank.accountName}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(PAYMENT_DETAILS.bank.accountName, "Account Name")}
                  >
                    {copiedField === "Account Name" ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 bg-background rounded-lg">
                <span className="text-sm text-muted-foreground">Account Number:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-primary">{PAYMENT_DETAILS.bank.accountNumber}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(PAYMENT_DETAILS.bank.accountNumber, "Account Number")}
                  >
                    {copiedField === "Account Number" ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="crypto" className="space-y-3 mt-4">
            <div className="bg-muted/50 p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between p-2 bg-background rounded-lg">
                <span className="text-sm text-muted-foreground">Network:</span>
                <span className="font-medium">{PAYMENT_DETAILS.crypto.network}</span>
              </div>
              <div className="p-2 bg-background rounded-lg space-y-2">
                <span className="text-xs text-muted-foreground">Wallet Address:</span>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-muted p-2 rounded break-all font-mono">
                    {PAYMENT_DETAILS.crypto.walletAddress}
                  </code>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 shrink-0"
                    onClick={() => copyToClipboard(PAYMENT_DETAILS.crypto.walletAddress, "Wallet Address")}
                  >
                    {copiedField === "Wallet Address" ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-2">
          <Label>Transaction Reference (Optional)</Label>
          <Input
            placeholder="Enter transaction ID or reference"
            value={transactionRef}
            onChange={(e) => setTransactionRef(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Upload Payment Proof *
          </Label>
          <p className="text-xs text-muted-foreground">
            Upload your receipt or transaction screenshot (JPG, PNG, WebP, PDF - Max 5MB)
          </p>
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleFileChange}
          />
          {previewUrl && (
            <div className="mt-2 border rounded-lg p-2">
              <img
                src={previewUrl}
                alt="Payment proof preview"
                className="max-h-40 object-contain mx-auto rounded"
              />
            </div>
          )}
          {proofFile && !previewUrl && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <Check className="h-3 w-3" />
              File selected: {proofFile.name}
            </p>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!proofFile || uploading}
          className="w-full"
          size="lg"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Submit Payment Proof
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PaymentProofUpload;
