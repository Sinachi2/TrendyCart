import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle2, Package, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Skeleton } from "@/components/ui/skeleton";

interface OrderItem {
  id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
}

interface Order {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  shipping_address: any;
  order_items: OrderItem[];
}

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (orderId) {
      loadOrder();
    }
  }, [user, orderId, navigate]);

  const loadOrder = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          created_at,
          status,
          total_amount,
          shipping_address,
          order_items (
            id,
            product_name,
            product_price,
            quantity,
            subtotal
          )
        `)
        .eq("id", orderId)
        .single();

      if (error) throw error;

      setOrder(data);
    } catch (error) {
      console.error("Error loading order:", error);
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive",
      });
      navigate("/orders");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-3xl mx-auto p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Order Not Found</h2>
            <Button onClick={() => navigate("/orders")}>View Orders</Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Success Banner */}
          <Card className="mb-8 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
            <CardContent className="pt-6 text-center">
              <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-600" />
              <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
              <p className="text-muted-foreground mb-4">
                Thank you for your order. We've received your order and will
                process it shortly.
              </p>
              <p className="text-sm text-muted-foreground">
                Order #{order.id.slice(0, 8).toUpperCase()}
              </p>
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {order.order_items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center py-2"
                  >
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {item.quantity} × ${item.product_price}
                      </p>
                    </div>
                    <p className="font-semibold">
                      ${item.subtotal.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">
                  ${order.total_amount.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent>
              {order.shipping_address && (
                <div className="text-sm">
                  <p className="font-medium">{order.shipping_address.fullName}</p>
                  <p className="text-muted-foreground">{order.shipping_address.address}</p>
                  <p className="text-muted-foreground">
                    {order.shipping_address.city}, {order.shipping_address.state}{" "}
                    {order.shipping_address.zipCode}
                  </p>
                  <p className="text-muted-foreground">{order.shipping_address.country}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={() => navigate("/orders")}
              variant="outline"
              className="flex-1"
            >
              <Package className="h-4 w-4 mr-2" />
              View All Orders
            </Button>
            <Button onClick={() => navigate("/shop")} className="flex-1">
              Continue Shopping
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderConfirmation;
