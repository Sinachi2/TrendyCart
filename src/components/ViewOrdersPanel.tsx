import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, ChevronDown, ChevronUp, Truck, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderTracking } from "@/components/OrderTracking";
import { ScrollArea } from "@/components/ui/scroll-area";

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

interface ViewOrdersPanelProps {
  userId: string;
}

export const ViewOrdersPanel = ({ userId }: ViewOrdersPanelProps) => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadOrders();
  }, [userId]);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, statusFilter]);

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
        .eq("user_id", userId)
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

  const filterOrders = () => {
    let filtered = orders;

    if (searchQuery) {
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.order_items.some((item) =>
            item.product_name.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
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
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-full rounded-xl" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="p-4 border-b border-border/50">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 rounded-xl bg-background/50"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 rounded-xl bg-background/50">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground mt-3">
          {filteredOrders.length} orders found
        </p>
      </div>

      {/* Orders List */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">
                {orders.length === 0 ? "No orders yet" : "No matching orders"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => {
                const isExpanded = expandedOrder === order.id;
                return (
                  <div
                    key={order.id}
                    className="bg-muted/30 rounded-xl overflow-hidden border border-border/50"
                  >
                    {/* Order Header */}
                    <button
                      onClick={() => toggleExpand(order.id)}
                      className="w-full text-left p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-semibold text-sm">
                              #{order.id.slice(0, 8).toUpperCase()}
                            </span>
                            <Badge className={`${getStatusColor(order.status)} text-xs`}>
                              {order.status}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span>
                              {new Date(order.created_at).toLocaleDateString()}
                            </span>
                            <span>{order.order_items.length} items</span>
                            <span className="font-semibold text-foreground">
                              ${Number(order.total_amount).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>
                    </button>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-4">
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
                        <div className="space-y-2">
                          <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                            Items
                          </h4>
                          <div className="bg-background/50 rounded-lg p-3 space-y-2">
                            {order.order_items.map((item) => (
                              <div
                                key={item.id}
                                className="flex justify-between items-center text-sm"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium truncate">{item.product_name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {item.quantity} × ${Number(item.product_price).toFixed(2)}
                                  </p>
                                </div>
                                <p className="font-semibold ml-2">
                                  ${Number(item.subtotal).toFixed(2)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* View Full Order */}
                        <Link
                          to={`/order-confirmation/${order.id}`}
                          className="block"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full rounded-lg"
                          >
                            View Full Details
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
