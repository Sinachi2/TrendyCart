import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, ChevronDown, ChevronUp, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderTracking } from "@/components/OrderTracking";

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
  tracking_number: string | null;
  carrier: string | null;
  estimated_delivery: string | null;
  tracking_url: string | null;
  order_items: OrderItem[];
}

const Orders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadOrders();
  }, [user, navigate]);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          created_at,
          status,
          total_amount,
          shipping_address,
          tracking_number,
          carrier,
          estimated_delivery,
          tracking_url,
          order_items (
            id,
            product_name,
            product_price,
            quantity,
            subtotal
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setOrders(data || []);
    } catch (error) {
      console.error("Error loading orders:", error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
      case "processing":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      case "shipped":
        return "bg-violet-500/10 text-violet-700 dark:text-violet-400";
      case "delivered":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
      case "cancelled":
        return "bg-red-500/10 text-red-700 dark:text-red-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Order History</h1>

        {orders.length === 0 ? (
          <Card className="p-12 text-center bg-card/50 border-border/50">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
            <h2 className="text-2xl font-semibold mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">
              Start shopping to see your orders here!
            </p>
            <Button onClick={() => navigate("/shop")} className="rounded-xl">
              Browse Products
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isExpanded = expandedOrder === order.id;
              return (
                <Card key={order.id} className="bg-card/50 backdrop-blur border-border/50 overflow-hidden">
                  {/* Order Header */}
                  <button
                    onClick={() => toggleExpand(order.id)}
                    className="w-full text-left"
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-lg">
                              Order #{order.id.slice(0, 8).toUpperCase()}
                            </CardTitle>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span>
                              {new Date(order.created_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                            <span>•</span>
                            <span>{order.order_items.length} items</span>
                            <span>•</span>
                            <span className="font-semibold text-foreground">
                              ${order.total_amount.toFixed(2)}
                            </span>
                            {order.tracking_number && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-primary">
                                  <Truck className="h-3.5 w-3.5" />
                                  Tracking available
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <CardContent className="pt-0 space-y-6">
                      <Separator />

                      {/* Order Tracking */}
                      <OrderTracking
                        orderId={order.id}
                        status={order.status}
                        trackingNumber={order.tracking_number}
                        carrier={order.carrier}
                        estimatedDelivery={order.estimated_delivery}
                        trackingUrl={order.tracking_url}
                      />

                      {/* Order Items */}
                      <div className="space-y-3">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                          Items
                        </h3>
                        <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                          {order.order_items.map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between items-center"
                            >
                              <div>
                                <p className="font-medium">{item.product_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {item.quantity} × ${item.product_price.toFixed(2)}
                                </p>
                              </div>
                              <p className="font-semibold">
                                ${item.subtotal.toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Shipping Address */}
                      {order.shipping_address && (
                        <div className="space-y-3">
                          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                            Shipping Address
                          </h3>
                          <div className="bg-muted/30 rounded-xl p-4 text-sm">
                            <p className="font-medium">{order.shipping_address.fullName}</p>
                            <p className="text-muted-foreground">{order.shipping_address.address}</p>
                            <p className="text-muted-foreground">
                              {order.shipping_address.city}, {order.shipping_address.state}{" "}
                              {order.shipping_address.zipCode}
                            </p>
                            <p className="text-muted-foreground">{order.shipping_address.country}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Orders;
