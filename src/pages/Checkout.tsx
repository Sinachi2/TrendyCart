import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, MapPin, Check, Copy, Upload, Building2, Bitcoin, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import CouponInput from "@/components/CouponInput";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

// Payment Methods Section Component
const PaymentMethodsSection = ({ toast }: { toast: any }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"bank" | "crypto">("bank");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

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
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      setProofFile(file);
    }
  };

  const handleConfirmPayment = () => {
    if (!proofFile) {
      toast({
        title: "Proof required",
        description: "Please upload your payment proof (receipt or transaction hash)",
        variant: "destructive",
      });
      return;
    }
    setPaymentConfirmed(true);
    toast({
      title: "Payment confirmation received!",
      description: "Your payment is being verified. You'll be notified once confirmed.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          Payment Method
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Payments are manually verified. Please upload proof of payment after completing your transfer.
          </AlertDescription>
        </Alert>

        <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "bank" | "crypto")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bank" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Bank Transfer
            </TabsTrigger>
            <TabsTrigger value="crypto" className="flex items-center gap-2">
              <Bitcoin className="h-4 w-4" />
              Cryptocurrency
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bank" className="space-y-4 mt-4">
            <div className="bg-muted/50 p-4 rounded-xl space-y-3">
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
          </TabsContent>

          <TabsContent value="crypto" className="space-y-4 mt-4">
            <div className="bg-muted/50 p-4 rounded-xl space-y-3">
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
                  <span className="text-muted-foreground text-xs">Wallet Address:</span>
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
          </TabsContent>
        </Tabs>

        <Separator />

        {/* Payment Proof Upload */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Upload Payment Proof</Label>
          <p className="text-xs text-muted-foreground">
            Upload your receipt or transaction hash screenshot
          </p>
          <div className="flex items-center gap-3">
            <Input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="flex-1"
            />
          </div>
          {proofFile && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <Check className="h-3 w-3" />
              File selected: {proofFile.name}
            </p>
          )}
        </div>

        {paymentConfirmed ? (
          <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-300">
              Your payment is being verified. You'll be notified once confirmed.
            </AlertDescription>
          </Alert>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleConfirmPayment}
          >
            <Upload className="h-4 w-4 mr-2" />
            Confirm Payment
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discount, setDiscount] = useState(0);

  const handleCouponApplied = (coupon: Coupon | null, discountAmount: number) => {
    setAppliedCoupon(coupon);
    setDiscount(discountAmount);
  };

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ShippingFormData>({
    resolver: zodResolver(shippingSchema),
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
      setSavedAddresses(addressRes.data || []);

      // Auto-select default address
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

  const onSubmit = async (data: ShippingFormData) => {
    if (!user) return;

    setPlacing(true);
    try {
      const subtotal = cartItems.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      );
      const shipping = subtotal > 50 ? 0 : 9.99;
      const total = subtotal + shipping - discount;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total_amount: total,
          shipping_address: { ...data, coupon_code: appliedCoupon?.code || null, discount_applied: discount },
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map((item) => ({
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

      // Clear cart
      const { error: clearError } = await supabase
        .from("cart_items")
        .delete()
        .in(
          "id",
          cartItems.map((item) => item.id)
        );

      if (clearError) throw clearError;

      window.dispatchEvent(new Event("cartUpdated"));

      toast({
        title: "Order placed successfully!",
        description: "Thank you for your order",
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

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const shipping = subtotal > 50 ? 0 : 9.99;
  const total = subtotal + shipping - discount;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/cart")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cart
        </Button>

        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Shipping Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Saved Addresses */}
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

              {/* Address Form */}
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

              <PaymentMethodsSection toast={toast} />
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <img
                          src={item.product.image_url || "/placeholder.svg"}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {item.product.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
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
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>
                        {shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  {/* Coupon Input */}
                  <CouponInput
                    subtotal={subtotal}
                    onCouponApplied={handleCouponApplied}
                    appliedCoupon={appliedCoupon}
                  />

                  <Separator />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <div className="text-right">
                      {discount > 0 && (
                        <div className="text-sm font-normal text-green-600 dark:text-green-400">
                          -${discount.toFixed(2)} discount
                        </div>
                      )}
                      <span className="text-primary">${total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={placing}
                  >
                    {placing ? "Placing Order..." : "Place Order"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default Checkout;
