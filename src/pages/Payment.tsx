import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  Info,
  Upload,
  FileImage,
  X,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  Lock,
  BadgeCheck,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const BANK = {
  bank: "Fidelity Bank",
  accountName: "SINACHI FRANKLIN EZEONYEKA",
  accountNumber: "6152779644",
};

const MAX_FILE_MB = 5;
const VALID_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

const Payment = () => {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [copied, setCopied] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [orderId, setOrderId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const allBankText = useMemo(
    () =>
      `Bank: ${BANK.bank}\nAccount Name: ${BANK.accountName}\nAccount Number: ${BANK.accountNumber}`,
    [],
  );

  const copy = async (text: string, field: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      setTimeout(() => setCopied(null), 2000);
      toast.success(`${label} copied to clipboard`);
    } catch {
      toast.error("Unable to copy. Please copy manually.");
    }
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`File must be smaller than ${MAX_FILE_MB}MB`);
      return;
    }
    if (!VALID_TYPES.includes(f.type)) {
      toast.error("Only JPG, PNG, WebP or PDF are allowed");
      return;
    }
    setFile(f);
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!orderId.trim()) e.orderId = "Order ID is required";
    if (!customerName.trim()) e.customerName = "Full name is required";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = "Valid email is required";
    if (!phone.trim()) e.phone = "Phone number is required";
    const amt = parseFloat(amount);
    if (!amount || Number.isNaN(amt) || amt <= 0) e.amount = "Enter a valid amount";
    if (!paidAt) e.paidAt = "Payment date & time is required";
    if (!file) e.file = "Please upload your payment receipt";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!user) {
      toast.error("Please sign in to submit your payment");
      return;
    }
    if (!validate()) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    setLoading(true);
    try {
      const ext = file!.name.split(".").pop();
      const path = `${user.id}/${Date.now()}_${orderId.trim()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("payment-proofs")
        .upload(path, file!);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage
        .from("payment-proofs")
        .getPublicUrl(path);

      const adminNotes = JSON.stringify({
        customerName: customerName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        paidAt,
        notes: notes.trim() || null,
        submittedFrom: "payment-page",
      });

      const { error: insErr } = await supabase.from("payment_proofs").insert({
        user_id: user.id,
        payment_method: "bank_transfer",
        proof_url: urlData.publicUrl,
        transaction_reference: orderId.trim(),
        amount: parseFloat(amount),
        status: "pending",
        admin_notes: adminNotes,
      });
      if (insErr) throw insErr;

      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error(err);
      toast.error("Could not submit payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b bg-gradient-to-b from-primary/5 to-transparent">
          <div className="container mx-auto px-4 py-10 md:py-14">
            <Link
              to="/checkout"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="h-4 w-4" /> Back to checkout
            </Link>
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium mb-4">
                <Lock className="h-3.5 w-3.5" /> Secure Bank Transfer
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                Complete your payment
              </h1>
              <p className="text-muted-foreground mt-3 md:text-lg">
                Send your payment to the account below, then submit your receipt for verification.
                Orders are processed as soon as payment is confirmed.
              </p>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-10 md:py-14">
          {submitted ? (
            <Card className="max-w-2xl mx-auto border-success/30">
              <CardContent className="p-8 md:p-12 text-center space-y-6">
                <div className="w-20 h-20 mx-auto rounded-full bg-success/10 flex items-center justify-center animate-scale-in">
                  <CheckCircle2 className="h-10 w-10 text-success" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl md:text-3xl font-bold">Thank you!</h2>
                  <p className="text-muted-foreground md:text-lg">
                    Your payment is being verified. We'll notify you once your order has been confirmed.
                  </p>
                </div>
                <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground flex items-start gap-3 text-left">
                  <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>
                    Verification typically takes a short time. You'll receive an email and an
                    in-app notification once your order is confirmed and processing begins.
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <Button asChild>
                    <Link to="/user-dashboard/orders">View my orders</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/shop">Continue shopping</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-5 gap-6 lg:gap-8 items-start">
              {/* Bank details card */}
              <Card className="lg:col-span-2 lg:sticky lg:top-24 overflow-hidden">
                <CardHeader className="bg-gradient-to-br from-primary/10 to-primary/5 border-b">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Bank Transfer Details</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Transfer to the account below
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  <div className="space-y-4">
                    <DetailRow label="Bank" value={BANK.bank} />
                    <Separator />
                    <DetailRow label="Account Name" value={BANK.accountName} />
                    <Separator />
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                        Account Number
                      </p>
                      <div className="mt-1.5 flex items-center justify-between gap-3">
                        <p className="text-2xl font-bold tracking-wider tabular-nums">
                          {BANK.accountNumber}
                        </p>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => copy(BANK.accountNumber, "acct", "Account number")}
                          className="gap-1.5"
                        >
                          {copied === "acct" ? (
                            <>
                              <Check className="h-4 w-4" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" /> Copy
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => copy(allBankText, "all", "All bank details")}
                  >
                    {copied === "all" ? (
                      <>
                        <Check className="h-4 w-4" /> All details copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" /> Copy All Bank Details
                      </>
                    )}
                  </Button>

                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm flex items-start gap-3">
                    <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground">Important</p>
                      <p className="text-muted-foreground mt-1">
                        Please use your <span className="font-medium text-foreground">Order ID</span>{" "}
                        as the payment reference so we can match your transfer to your order.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <Trust icon={<ShieldCheck className="h-4 w-4" />} label="Verified" />
                    <Trust icon={<Lock className="h-4 w-4" />} label="Secure" />
                    <Trust icon={<BadgeCheck className="h-4 w-4" />} label="Trusted" />
                  </div>

                  {!showForm && (
                    <Button
                      size="lg"
                      className="w-full mt-2"
                      onClick={() => setShowForm(true)}
                    >
                      I've Made Payment
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Right side: instructions or form */}
              <div className="lg:col-span-3 space-y-6">
                {!showForm ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">How it works</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <Step n={1} title="Transfer the exact amount" desc="Use the bank details on the left. Include your Order ID as the reference." />
                      <Step n={2} title="Confirm your payment" desc={`Click "I've Made Payment" and fill in the short verification form.`} />
                      <Step n={3} title="We verify & ship" desc="Our team verifies your payment (usually within a short time), then processes and ships your order." />
                      <div className="rounded-xl bg-muted/50 p-4 flex items-start gap-3 text-sm text-muted-foreground">
                        <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span>
                          Orders are only processed after payment verification. You'll receive a
                          confirmation email as soon as your payment is approved.
                        </span>
                      </div>
                      <Button size="lg" className="w-full sm:w-auto" onClick={() => setShowForm(true)}>
                        I've Made Payment
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Submit payment for verification</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Fields marked with <span className="text-destructive">*</span> are required.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={onSubmit} className="space-y-5" noValidate>
                        <div className="grid md:grid-cols-2 gap-4">
                          <Field label="Order ID" required error={errors.orderId}>
                            <Input
                              value={orderId}
                              onChange={(e) => setOrderId(e.target.value)}
                              placeholder="e.g. TC-4F2A9B"
                              autoComplete="off"
                            />
                          </Field>
                          <Field label="Amount Paid" required error={errors.amount}>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              placeholder="0.00"
                              inputMode="decimal"
                            />
                          </Field>
                          <Field label="Customer Name" required error={errors.customerName}>
                            <Input
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              placeholder="Full name"
                              autoComplete="name"
                            />
                          </Field>
                          <Field label="Email Address" required error={errors.email}>
                            <Input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="you@example.com"
                              autoComplete="email"
                            />
                          </Field>
                          <Field label="Phone Number" required error={errors.phone}>
                            <Input
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="+234 800 000 0000"
                              autoComplete="tel"
                            />
                          </Field>
                          <Field label="Date & Time of Payment" required error={errors.paidAt}>
                            <Input
                              type="datetime-local"
                              value={paidAt}
                              onChange={(e) => setPaidAt(e.target.value)}
                            />
                          </Field>
                        </div>

                        <Field label="Upload Payment Receipt" required error={errors.file}>
                          <input
                            ref={fileRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            onChange={onFile}
                            className="hidden"
                            id="payment-receipt"
                          />
                          {!file ? (
                            <label
                              htmlFor="payment-receipt"
                              className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                            >
                              <Upload className="h-6 w-6 text-muted-foreground" />
                              <span className="text-sm font-medium">
                                Click to upload receipt
                              </span>
                              <span className="text-xs text-muted-foreground">
                                JPG, PNG, WebP or PDF · up to {MAX_FILE_MB}MB
                              </span>
                            </label>
                          ) : (
                            <div className="flex items-center gap-3 border rounded-xl p-3">
                              {preview ? (
                                <img
                                  src={preview}
                                  alt="Receipt preview"
                                  className="h-14 w-14 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center">
                                  <FileImage className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(file.size / 1024).toFixed(0)} KB
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={clearFile}
                                aria-label="Remove file"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </Field>

                        <Field label="Additional Notes (optional)">
                          <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Anything we should know about your payment?"
                            rows={3}
                          />
                        </Field>

                        <div className="rounded-xl bg-muted/50 p-4 text-xs text-muted-foreground flex items-start gap-2">
                          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>
                            Payment verification may take a short time. Your order will be
                            processed as soon as we confirm your payment.
                          </span>
                        </div>

                        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setShowForm(false)}
                            disabled={loading}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" size="lg" disabled={loading} className="gap-2">
                            {loading ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Submitting…
                              </>
                            ) : (
                              <>Submit payment</>
                            )}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
      {label}
    </p>
    <p className="mt-1 text-base font-semibold text-foreground break-words">{value}</p>
  </div>
);

const Trust = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div className="flex flex-col items-center gap-1 rounded-lg border bg-background/50 py-2 text-xs text-muted-foreground">
    <span className="text-primary">{icon}</span>
    {label}
  </div>
);

const Step = ({ n, title, desc }: { n: number; title: string; desc: string }) => (
  <div className="flex gap-4">
    <div className="h-9 w-9 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
      {n}
    </div>
    <div>
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
    </div>
  </div>
);

const Field = ({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <Label className="text-sm font-medium">
      {label}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </Label>
    {children}
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
);

export default Payment;