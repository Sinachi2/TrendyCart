import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  ChevronRight,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  RotateCcw,
  Search,
  Filter,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";

interface OrderItem {
  id: string;
  product_name: string;
  product_price: number;
  quantity: number;
}

interface Order {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  order_items: OrderItem[];
}

const REVERSAL_WINDOW_HOURS = 24; // Orders can be reversed within 24 hours

const DashboardOrders = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [reversingOrder, setReversingOrder] = useState<string | null>(null);
  const [confirmReversal, setConfirmReversal] = useState<Order | null>(null);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          created_at,
          status,
          total_amount,
          order_items (
            id,
            product_name,
            product_price,
            quantity
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const canReverseOrder = (order: Order) => {
    if (order.status !== "pending") return false;
    
    const orderDate = new Date(order.created_at);
    const now = new Date();
    const hoursDiff = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60);
    
    return hoursDiff <= REVERSAL_WINDOW_HOURS;
  };

  const getRemainingTime = (order: Order) => {
    const orderDate = new Date(order.created_at);
    const deadline = new Date(orderDate.getTime() + REVERSAL_WINDOW_HOURS * 60 * 60 * 1000);
    const now = new Date();
    const hoursLeft = Math.max(0, (deadline.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (hoursLeft < 1) {
      return `${Math.floor(hoursLeft * 60)} minutes left`;
    }
    return `${Math.floor(hoursLeft)} hours left`;
  };

  const handleReverseOrder = async (order: Order) => {
    setReversingOrder(order.id);
    
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "reversed" })
        .eq("id", order.id);

      if (error) throw error;

      toast({
        title: "Order Reversed",
        description: `Order #${order.id.slice(0, 8).toUpperCase()} has been successfully reversed.`,
      });

      setOrders(orders.map(o => 
        o.id === order.id ? { ...o, status: "reversed" } : o
      ));
    } catch (error) {
      console.error("Error reversing order:", error);
      toast({
        title: "Reversal Failed",
        description: "Unable to reverse order. Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setReversingOrder(null);
      setConfirmReversal(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "processing":
        return <Package className="h-4 w-4" />;
      case "shipped":
        return <Truck className="h-4 w-4" />;
      case "delivered":
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "reversed":
        return <RotateCcw className="h-4 w-4" />;
      default:
        return <XCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
      case "processing":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
      case "shipped":
        return "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20";
      case "delivered":
      case "completed":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
      case "reversed":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.order_items.some(item => 
        item.product_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <DashboardLayout title="My Orders" description="View and manage your orders">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Orders" description="View and manage your orders">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="reversed">Reversed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card className="bg-card/50">
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="font-semibold mb-2">No orders found</h3>
            <p className="text-muted-foreground text-sm mb-4">
              {orders.length === 0 
                ? "You haven't placed any orders yet"
                : "Try adjusting your search or filters"
              }
            </p>
            <Button asChild className="rounded-xl">
              <Link to="/shop">Start Shopping</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order, index) => (
            <Card 
              key={order.id} 
              className="bg-card/50 backdrop-blur border-border/50 overflow-hidden animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-0">
                <div className="p-4 lg:p-6">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">
                          Order #{order.id.slice(0, 8).toUpperCase()}
                        </h3>
                        <Badge className={`${getStatusColor(order.status)} border flex items-center gap-1`}>
                          {getStatusIcon(order.status)}
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">${parseFloat(String(order.total_amount)).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.order_items.length} item{order.order_items.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-2 mb-4">
                    {order.order_items.slice(0, 2).map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.quantity}x {item.product_name}
                        </span>
                        <span className="font-medium">
                          ${(item.product_price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    {order.order_items.length > 2 && (
                      <p className="text-sm text-muted-foreground">
                        +{order.order_items.length - 2} more items
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <Button variant="outline" size="sm" className="rounded-xl flex-1 sm:flex-none" asChild>
                      <Link to={`/order-confirmation/${order.id}`}>
                        View Details
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                    
                    {canReverseOrder(order) && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="rounded-xl flex-1 sm:flex-none"
                        onClick={() => setConfirmReversal(order)}
                        disabled={reversingOrder === order.id}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Reverse Order
                        <span className="ml-2 text-xs opacity-75">
                          ({getRemainingTime(order)})
                        </span>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reversal Confirmation Dialog */}
      <AlertDialog open={!!confirmReversal} onOpenChange={() => setConfirmReversal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reverse This Order?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reverse order #{confirmReversal?.id.slice(0, 8).toUpperCase()}? 
              This action cannot be undone. If you've already made a payment, please contact support for a refund.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmReversal && handleReverseOrder(confirmReversal)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Reverse Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default DashboardOrders;
