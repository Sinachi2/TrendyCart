import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  ArrowRight, 
  MapPin, 
  Check, 
  Copy, 
  Upload, 
  Building2, 
  Bitcoin, 
  AlertCircle,
  ShoppingCart,
  Package,
  CreditCard,
  Loader2,
  Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import CouponInput from "@/components/CouponInput";
import CheckoutStepper from "@/components/CheckoutStepper";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { isVipEmail } from "@/lib/vip";

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

const CHECKOUT_STEPS = [
  { id: 1, label: "Select Items", description: "Choose what to pay for" },
  { id: 2, label: "Shipping", description: "Delivery address" },
  { id: 3, label: "Payment", description: "Choose payment method" },
  { id: 4, label: "Confirm", description: "Review & submit" },
];

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number;
}

const shippingSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zipCode: z.string().min(5, "ZIP code is required"),
  country: z.string().min(2, "Country is required"),
});

type ShippingFormData = z.infer<typeof shippingSchema>;

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
  };
}

interface SavedAddress {
  id: string;
  label: string;
  full_name: string;
  street_address: string;
  apartment: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Core state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  
  // Step-based state
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [paymentMethod, setPaymentMethod] = useState<"bank_transfer" | "crypto" | null>(null);
  
  // Address state
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  
  // Coupon state
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discount, setDiscount] = useState(0);
  
  // Payment proof state
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [transactionRef, setTransactionRef] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isValid },
  } = useForm<ShippingFormData>({
    resolver: zodResolver(shippingSchema),
    mode: "onChange",
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      const [cartRes, addressRes] = await Promise.all([
        supabase.from("cart_items").select(`
          id,
          quantity,
          products (
            id,
            name,
            price,
            image_url
          )
        `),
        supabase
          .from("addresses")
          .select("*")
          .order("is_default", { ascending: false })
          .order("created_at", { ascending: false }),
      ]);

      if (cartRes.error) throw cartRes.error;

      if (!cartRes.data || cartRes.data.length === 0) {
        navigate("/cart");
        return;
      }

      const formattedData = cartRes.data?.map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        product: item.products,
      })) || [];

      setCartItems(formattedData);
      // Select all items by default
      setSelectedItemIds(new Set(formattedData.map((item: CartItem) => item.id)));
      
      setSavedAddresses(addressRes.data || []);

      const defaultAddr = addressRes.data?.find((a) => a.is_default);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
        fillFormWithAddress(defaultAddr);
      } else if (addressRes.data && addressRes.data.length > 0) {
        setSelectedAddressId(addressRes.data[0].id);
        fillFormWithAddress(addressRes.data[0]);
      } else {
        setUseNewAddress(true);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load checkout data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fillFormWithAddress = (addr: SavedAddress) => {
    setValue("fullName", addr.full_name);
    setValue("address", addr.street_address + (addr.apartment ? `, ${addr.apartment}` : ""));
    setValue("city", addr.city);
    setValue("state", addr.state);
    setValue("zipCode", addr.postal_code);
    setValue("country", addr.country);
  };

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId);
    setUseNewAddress(false);
    const addr = savedAddresses.find((a) => a.id === addressId);
    if (addr) fillFormWithAddress(addr);
  };

  const handleUseNewAddress = () => {
    setSelectedAddressId(null);
    setUseNewAddress(true);
    setValue("fullName", "");
    setValue("address", "");
    setValue("city", "");
    setValue("state", "");
    setValue("zipCode", "");
    setValue("country", "");
  };

  // Item selection handlers
  const toggleItemSelection = (itemId: string) => {
    setSelectedItemIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const selectAllItems = () => {
    setSelectedItemIds(new Set(cartItems.map((item) => item.id)));
  };

  const deselectAllItems = () => {
    setSelectedItemIds(new Set());
  };

  const isAllSelected = selectedItemIds.size === cartItems.length;

  // Get selected items
  const selectedItems = cartItems.filter((item) => selectedItemIds.has(item.id));

  // Price calculations for selected items
  const selectedSubtotal = selectedItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const isVip = isVipEmail(user?.email);
  const shipping = isVip ? 0 : selectedSubtotal > 50 ? 0 : 9.99;
  const total = isVip ? 0 : Math.max(0, selectedSubtotal + shipping - discount);

  const handleCouponApplied = (coupon: Coupon | null, discountAmount: number) => {
    setAppliedCoupon(coupon);
    setDiscount(discountAmount);
  };

  // Copy to clipboard
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

  // File handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

  // Navigation
  const goToNextStep = () => {
    if (checkoutStep < 4) {
      setCheckoutStep(checkoutStep + 1);
    }
  };

  const goToPrevStep = () => {
    if (checkoutStep > 1) {
      setCheckoutStep(checkoutStep - 1);
    }
  };

  const handleStepClick = (step: number) => {
    if (step < checkoutStep) {
      setCheckoutStep(step);
    }
  };

  // Final order submission
  const handlePlaceOrder = async () => {
    if (!user || selectedItems.length === 0 || !paymentMethod || !proofFile) {
      toast({
        title: "Missing information",
        description: "Please complete all steps before placing your order",
        variant: "destructive",
      });
      return;
    }

    const shippingData = getValues();

    setPlacing(true);
    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total_amount: total,
          shipping_address: { 
            ...shippingData, 
            coupon_code: appliedCoupon?.code || null, 
            discount_applied: discount 
          },
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items for SELECTED items only
      const orderItems = selectedItems.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_price: item.product.price,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Upload payment proof
      const fileExt = proofFile.name.split(".").pop();
      const fileName = `${user.id}/${order.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(fileName, proofFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("payment-proofs")
        .getPublicUrl(fileName);

      // Create payment proof record
      const { error: proofError } = await supabase
        .from("payment_proofs")
        .insert({
          order_id: order.id,
          user_id: user.id,
          payment_method: paymentMethod,
          proof_url: publicUrl,
          transaction_reference: transactionRef || null,
          amount: total,
          status: "pending",
        });

      if (proofError) throw proofError;

      // Clear only selected items from cart
      const { error: clearError } = await supabase
        .from("cart_items")
        .delete()
        .in("id", Array.from(selectedItemIds));

      if (clearError) throw clearError;

      // Send email notification
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", user.id)
          .single();

        await supabase.functions.invoke("send-notification", {
          body: {
            type: "payment_submitted",
            email: profile?.email || user.email,
            data: {
              orderId: order.id,
              customerName: profile?.full_name || "Customer",
              amount: total,
              paymentMethod: paymentMethod === "bank_transfer" ? "Bank Transfer" : "Cryptocurrency",
            },
          },
        });
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
      }

      window.dispatchEvent(new Event("cartUpdated"));

      toast({
        title: "Order placed successfully!",
        description: "Your payment is being verified. You'll be notified once confirmed.",
      });

      navigate(`/order-confirmation/${order.id}`);
    } catch (error) {
      console.error("Error placing order:", error);
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPlacing(false);
    }
  };

  // Step validation
  const canProceedFromStep1 = selectedItemIds.size > 0;
  const canProceedFromStep2 = selectedAddressId !== null || (useNewAddress && isValid);
  const canProceedFromStep3 = paymentMethod !== null;
  const canSubmitOrder = proofFile !== null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => checkoutStep === 1 ? navigate("/cart") : goToPrevStep()}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {checkoutStep === 1 ? "Back to Cart" : "Back"}
        </Button>

        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        {/* Stepper */}
        <div className="mb-8">
          <CheckoutStepper 
            steps={CHECKOUT_STEPS} 
            currentStep={checkoutStep}
            onStepClick={handleStepClick}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Select Items */}
            {checkoutStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    Select Items to Purchase
                  </CardTitle>
                  <CardDescription>
                    Choose which items you want to checkout
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Select All Toggle */}
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={(checked) => 
                          checked ? selectAllItems() : deselectAllItems()
                        }
                      />
                      <span className="font-medium">
                        {isAllSelected ? "Deselect All" : "Select All"}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {selectedItemIds.size} of {cartItems.length} selected
                    </span>
                  </div>

                  {/* Item List */}
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <label
                        key={item.id}
                        className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                          selectedItemIds.has(item.id)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <Checkbox
                          checked={selectedItemIds.has(item.id)}
                          onCheckedChange={() => toggleItemSelection(item.id)}
                        />
                        <img
                          src={item.product.image_url || "/placeholder.svg"}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded-md"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium">{item.product.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">
                            ${(item.product.price * item.quantity).toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ${item.product.price.toFixed(2)} each
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>

                  {selectedItemIds.size === 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Please select at least one item to continue
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={goToNextStep}
                    disabled={!canProceedFromStep1}
                    className="w-full"
                    size="lg"
                  >
                    Continue to Shipping
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Shipping Address */}
            {checkoutStep === 2 && (
              <>
                {savedAddresses.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        Saved Addresses
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup
                        value={selectedAddressId || "new"}
                        onValueChange={(val) => {
                          if (val === "new") {
                            handleUseNewAddress();
                          } else {
                            handleAddressSelect(val);
                          }
                        }}
                        className="space-y-3"
                      >
                        {savedAddresses.map((addr) => (
                          <label
                            key={addr.id}
                            className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                              selectedAddressId === addr.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <RadioGroupItem value={addr.id} className="mt-1" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{addr.label}</span>
                                {addr.is_default && (
                                  <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {addr.full_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {addr.street_address}
                                {addr.apartment && `, ${addr.apartment}`}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {addr.city}, {addr.state} {addr.postal_code}
                              </p>
                            </div>
                            {selectedAddressId === addr.id && (
                              <Check className="h-5 w-5 text-primary shrink-0" />
                            )}
                          </label>
                        ))}
                        <label
                          className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                            useNewAddress
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <RadioGroupItem value="new" />
                          <span className="font-medium">Use a new address</span>
                        </label>
                      </RadioGroup>
                    </CardContent>
                  </Card>
                )}

                {(useNewAddress || savedAddresses.length === 0) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Shipping Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          {...register("fullName")}
                          placeholder="John Doe"
                        />
                        {errors.fullName && (
                          <p className="text-sm text-destructive mt-1">
                            {errors.fullName.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          {...register("address")}
                          placeholder="123 Main St"
                        />
                        {errors.address && (
                          <p className="text-sm text-destructive mt-1">
                            {errors.address.message}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            {...register("city")}
                            placeholder="New York"
                          />
                          {errors.city && (
                            <p className="text-sm text-destructive mt-1">
                              {errors.city.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            {...register("state")}
                            placeholder="NY"
                          />
                          {errors.state && (
                            <p className="text-sm text-destructive mt-1">
                              {errors.state.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="zipCode">ZIP Code</Label>
                          <Input
                            id="zipCode"
                            {...register("zipCode")}
                            placeholder="10001"
                          />
                          {errors.zipCode && (
                            <p className="text-sm text-destructive mt-1">
                              {errors.zipCode.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="country">Country</Label>
                          <Input
                            id="country"
                            {...register("country")}
                            placeholder="USA"
                          />
                          {errors.country && (
                            <p className="text-sm text-destructive mt-1">
                              {errors.country.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Button
                  onClick={goToNextStep}
                  disabled={!canProceedFromStep2}
                  className="w-full"
                  size="lg"
                >
                  Continue to Payment
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </>
            )}

            {/* Step 3: Payment Method */}
            {checkoutStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Choose Payment Method
                  </CardTitle>
                  <CardDescription>
                    Select how you'd like to pay for your order
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Payments are manually verified. You'll upload proof of payment in the next step.
                    </AlertDescription>
                  </Alert>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Bank Transfer Option */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("bank_transfer")}
                      className={`p-6 rounded-xl border-2 text-left transition-all ${
                        paymentMethod === "bank_transfer"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-3 rounded-full ${
                          paymentMethod === "bank_transfer" 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted"
                        }`}>
                          <Building2 className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Bank Transfer</h3>
                          <p className="text-sm text-muted-foreground">
                            Direct bank transfer
                          </p>
                        </div>
                        {paymentMethod === "bank_transfer" && (
                          <Check className="h-5 w-5 text-primary ml-auto" />
                        )}
                      </div>
                    </button>

                    {/* Crypto Option */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("crypto")}
                      className={`p-6 rounded-xl border-2 text-left transition-all ${
                        paymentMethod === "crypto"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-3 rounded-full ${
                          paymentMethod === "crypto" 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted"
                        }`}>
                          <Bitcoin className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Cryptocurrency</h3>
                          <p className="text-sm text-muted-foreground">
                            USDT (TRC20)
                          </p>
                        </div>
                        {paymentMethod === "crypto" && (
                          <Check className="h-5 w-5 text-primary ml-auto" />
                        )}
                      </div>
                    </button>
                  </div>

                  {/* Payment Details */}
                  {paymentMethod === "bank_transfer" && (
                    <div className="bg-muted/50 p-4 rounded-xl space-y-2 mt-4">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        Bank Transfer Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between p-2 bg-background rounded-lg">
                          <span className="text-muted-foreground">Bank Name:</span>
                          <span className="font-medium">{PAYMENT_DETAILS.bank.name}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-background rounded-lg">
                          <span className="text-muted-foreground">Account Name:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-xs">{PAYMENT_DETAILS.bank.accountName}</span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              type="button"
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
                          <span className="text-muted-foreground">Account Number:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-primary">{PAYMENT_DETAILS.bank.accountNumber}</span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              type="button"
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
                    </div>
                  )}

                  {paymentMethod === "crypto" && (
                    <div className="bg-muted/50 p-4 rounded-xl space-y-2 mt-4">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Bitcoin className="h-4 w-4 text-primary" />
                        Cryptocurrency Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between p-2 bg-background rounded-lg">
                          <span className="text-muted-foreground">Network:</span>
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
                              type="button"
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
                    </div>
                  )}

                  {!paymentMethod && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Please select a payment method to continue
                    </p>
                  )}

                  <Button
                    onClick={goToNextStep}
                    disabled={!canProceedFromStep3}
                    className="w-full"
                    size="lg"
                  >
                    Continue to Review
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Review & Upload Proof */}
            {checkoutStep === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Review & Complete Order
                  </CardTitle>
                  <CardDescription>
                    Verify your order details and upload payment proof
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Order Summary */}
                  <div className="space-y-3">
                    <h4 className="font-semibold">Order Items ({selectedItems.length})</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                          <img
                            src={item.product.image_url || "/placeholder.svg"}
                            alt={item.product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.product.name}</p>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-semibold text-sm">
                            ${(item.product.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Payment Method Summary */}
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    {paymentMethod === "bank_transfer" ? (
                      <Building2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Bitcoin className="h-5 w-5 text-primary" />
                    )}
                    <span className="font-medium">
                      {paymentMethod === "bank_transfer" ? "Bank Transfer" : "Cryptocurrency (USDT)"}
                    </span>
                  </div>

                  <Separator />

                  {/* Amount Due */}
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">Amount Due</p>
                    <p className="text-3xl font-bold text-primary">${total.toFixed(2)}</p>
                  </div>

                  {/* Transaction Reference */}
                  <div className="space-y-2">
                    <Label>Transaction Reference (Optional)</Label>
                    <Input
                      placeholder="Enter transaction ID or reference"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                    />
                  </div>

                  {/* Upload Payment Proof */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
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

                  {!proofFile && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Please upload your payment proof to complete the order
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={handlePlaceOrder}
                    disabled={!canSubmitOrder || placing}
                    className="w-full"
                    size="lg"
                  >
                    {placing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Submit Order & Payment Proof
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedItems.length > 0 ? (
                  <>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {selectedItems.map((item) => (
                        <div key={item.id} className="flex gap-3">
                          <img
                            src={item.product.image_url || "/placeholder.svg"}
                            alt={item.product.name}
                            className="w-14 h-14 object-cover rounded"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm line-clamp-1">
                              {item.product.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Qty: {item.quantity}
                            </p>
                            <p className="text-sm font-semibold">
                              ${(item.product.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>${selectedSubtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shipping</span>
                        <span>
                          {shipping === 0 ? (isVip ? "FREE (VIP)" : "FREE") : `$${shipping.toFixed(2)}`}
                        </span>
                      </div>
                      {!isVip && selectedSubtotal <= 50 && selectedSubtotal > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Add ${(50 - selectedSubtotal).toFixed(2)} more for free shipping
                        </p>
                      )}
                    </div>

                    {checkoutStep >= 2 && (
                      <>
                        <Separator />
                        <CouponInput
                          subtotal={selectedSubtotal}
                          onCouponApplied={handleCouponApplied}
                          appliedCoupon={appliedCoupon}
                        />
                      </>
                    )}

                    <Separator />

                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <div className="text-right">
                        {isVip && (
                          <div className="text-sm font-normal text-green-600 dark:text-green-400">
                            VIP — 100% off
                          </div>
                        )}
                        {!isVip && discount > 0 && (
                          <div className="text-sm font-normal text-green-600 dark:text-green-400">
                            -${discount.toFixed(2)} discount
                          </div>
                        )}
                        <span className="text-primary">${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No items selected</p>
                    <p className="text-xs mt-1">Select items to see your order summary</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
