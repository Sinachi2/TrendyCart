import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ShoppingCart, 
  CreditCard, 
  UserPlus, 
  Package, 
  CheckCircle,
  Clock,
  Truck,
  XCircle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  type: "order" | "payment" | "customer";
  title: string;
  description: string;
  status?: string;
  amount?: number;
  timestamp: string;
}

const getActivityIcon = (type: string, status?: string) => {
  if (type === "order") {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "shipped":
        return <Truck className="h-4 w-4 text-blue-500" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <ShoppingCart className="h-4 w-4 text-primary" />;
    }
  }
  if (type === "payment") {
    return <CreditCard className="h-4 w-4 text-green-500" />;
  }
  return <UserPlus className="h-4 w-4 text-purple-500" />;
};

const getStatusBadge = (status: string) => {
  const statusConfig: Record<string, { color: string; label: string }> = {
    pending: { color: "bg-yellow-500/10 text-yellow-700", label: "Pending" },
    processing: { color: "bg-blue-500/10 text-blue-700", label: "Processing" },
    shipped: { color: "bg-purple-500/10 text-purple-700", label: "Shipped" },
    completed: { color: "bg-green-500/10 text-green-700", label: "Completed" },
    cancelled: { color: "bg-red-500/10 text-red-700", label: "Cancelled" },
    verified: { color: "bg-green-500/10 text-green-700", label: "Verified" },
    rejected: { color: "bg-red-500/10 text-red-700", label: "Rejected" },
  };

  const config = statusConfig[status] || { color: "bg-muted", label: status };
  return (
    <Badge variant="secondary" className={config.color}>
      {config.label}
    </Badge>
  );
};

const ActivityFeed = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      // Fetch recent orders
      const { data: orders } = await supabase
        .from("orders")
        .select("id, total_amount, status, created_at, profiles:user_id(full_name)")
        .order("created_at", { ascending: false })
        .limit(10);

      // Fetch recent payments
      const { data: payments } = await supabase
        .from("payment_proofs")
        .select("id, amount, status, created_at, profiles:user_id(full_name)")
        .order("created_at", { ascending: false })
        .limit(5);

      // Fetch recent customers
      const { data: customers } = await supabase
        .from("profiles")
        .select("id, full_name, email, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      const allActivities: ActivityItem[] = [];

      // Process orders
      (orders || []).forEach((order: any) => {
        allActivities.push({
          id: `order-${order.id}`,
          type: "order",
          title: "New Order",
          description: `${order.profiles?.full_name || "Customer"} placed an order`,
          status: order.status,
          amount: parseFloat(order.total_amount),
          timestamp: order.created_at,
        });
      });

      // Process payments
      (payments || []).forEach((payment: any) => {
        allActivities.push({
          id: `payment-${payment.id}`,
          type: "payment",
          title: payment.status === "verified" ? "Payment Verified" : "Payment Received",
          description: `${payment.profiles?.full_name || "Customer"} submitted payment`,
          status: payment.status,
          amount: payment.amount,
          timestamp: payment.created_at,
        });
      });

      // Process customers
      (customers || []).forEach((customer: any) => {
        allActivities.push({
          id: `customer-${customer.id}`,
          type: "customer",
          title: "New Customer",
          description: `${customer.full_name || customer.email} signed up`,
          timestamp: customer.created_at,
        });
      });

      // Sort by timestamp
      allActivities.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setActivities(allActivities.slice(0, 15));
    } catch (error) {
      console.error("Error loading activities:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Package className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0"
                >
                  <div className="mt-0.5 p-2 bg-muted rounded-full">
                    {getActivityIcon(activity.type, activity.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm">{activity.title}</p>
                      {activity.status && getStatusBadge(activity.status)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {activity.amount !== undefined && (
                        <span className="text-xs font-semibold text-primary">
                          ${activity.amount.toFixed(2)}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityFeed;
