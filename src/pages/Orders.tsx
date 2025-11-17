import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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

const Orders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
      case "processing":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      case "shipped":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400";
      case "delivered":
        return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "cancelled":
        return "bg-red-500/10 text-red-700 dark:text-red-400";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Order History</h1>

        {orders.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">
              Start shopping to see your orders here!
            </p>
            <Button onClick={() => navigate("/shop")}>Browse Products</Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Collapsible key={order.id}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">
                          Order #{order.id.slice(0, 8).toUpperCase()}
                        </CardTitle>
                        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                          <span>
                            {new Date(order.created_at).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span>{order.order_items.length} items</span>
                          <span>•</span>
                          <span className="font-semibold text-foreground">
                            ${order.total_amount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.toUpperCase()}
                        </Badge>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                    </div>
                  </CardHeader>

                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <Separator className="mb-4" />

                      {/* Order Items */}
                      <div className="space-y-3 mb-6">
                        <h3 className="font-semibold">Items</h3>
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

                      {/* Shipping Address */}
                      {order.shipping_address && (
                        <div>
                          <h3 className="font-semibold mb-2">
                            Shipping Address
                          </h3>
                          <div className="text-sm text-muted-foreground">
                            <p>{order.shipping_address.fullName}</p>
                            <p>{order.shipping_address.address}</p>
                            <p>
                              {order.shipping_address.city},{" "}
                              {order.shipping_address.state}{" "}
                              {order.shipping_address.zipCode}
                            </p>
                            <p>{order.shipping_address.country}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Orders;
