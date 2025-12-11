import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Package, Mail, RefreshCw } from "lucide-react";

interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: string;
  created_at: string;
  tracking_number: string | null;
  carrier: string | null;
  profiles: {
    email: string;
    full_name: string | null;
  } | null;
}

const statusOptions = [
  { value: "pending", label: "Pending", color: "bg-yellow-500/10 text-yellow-700" },
  { value: "processing", label: "Processing", color: "bg-blue-500/10 text-blue-700" },
  { value: "shipped", label: "Shipped", color: "bg-purple-500/10 text-purple-700" },
  { value: "delivered", label: "Delivered", color: "bg-green-500/10 text-green-700" },
  { value: "completed", label: "Completed", color: "bg-emerald-500/10 text-emerald-700" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-500/10 text-red-700" },
];

const DashboardOrders = () => {
  const navigate = useNavigate();
  const { user, loading, isAdmin } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (!loading && user && !isAdmin) {
      navigate("/");
    } else if (user && isAdmin) {
      loadOrders();
    }
  }, [user, loading, isAdmin, navigate]);

  const loadOrders = async () => {
    try {
      setLoadingOrders(true);
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          user_id,
          total_amount,
          status,
          created_at,
          tracking_number,
          carrier,
          profiles (
            email,
            full_name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data as unknown as Order[]);
    } catch (error) {
      console.error("Error loading orders:", error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setLoadingOrders(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrder(orderId);
    try {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return;

      // Update order status
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      // Send email notification
      if (order.profiles?.email) {
        try {
          const { error: notifError } = await supabase.functions.invoke(
            "send-notification",
            {
              body: {
                type: "order_status",
                email: order.profiles.email,
                data: {
                  orderId: orderId,
                  orderStatus: newStatus,
                  customerName: order.profiles.full_name,
                },
              },
            }
          );

          if (notifError) {
            console.error("Error sending notification:", notifError);
          } else {
            toast({
              title: "Email sent",
              description: `Status update notification sent to ${order.profiles.email}`,
            });
          }
        } catch (notifError) {
          console.error("Error sending notification:", notifError);
        }
      }

      // Update local state
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );

      toast({
        title: "Order updated",
        description: `Order status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    } finally {
      setUpdatingOrder(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find((s) => s.value === status);
    return (
      <Badge variant="secondary" className={statusOption?.color || ""}>
        {statusOption?.label || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />

        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border bg-background px-6">
            <SidebarTrigger />
            <h1 className="text-xl font-semibold">Orders Management</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={loadOrders}
              className="ml-auto"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </header>

          <main className="flex-1 p-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  All Orders ({orders.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingOrders ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading orders...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No orders yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Update Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-mono">
                              #{order.id.slice(0, 8).toUpperCase()}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {order.profiles?.full_name || "Anonymous"}
                                </p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {order.profiles?.email || "N/A"}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              ${parseFloat(String(order.total_amount)).toFixed(2)}
                            </TableCell>
                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                            <TableCell>
                              {new Date(order.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Select
                                value={order.status}
                                onValueChange={(value) =>
                                  updateOrderStatus(order.id, value)
                                }
                                disabled={updatingOrder === order.id}
                              >
                                <SelectTrigger className="w-[140px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {statusOptions.map((status) => (
                                    <SelectItem
                                      key={status.value}
                                      value={status.value}
                                    >
                                      {status.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardOrders;