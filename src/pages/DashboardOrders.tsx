import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Package, Mail, RefreshCw, Search, Eye, ArrowUpDown, ShoppingCart } from "lucide-react";

interface OrderItem {
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
  product_id: string | null;
  products?: { image_url: string | null } | null;
}

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
  order_items: OrderItem[];
}

const statusOptions = [
  { value: "pending", label: "Pending", color: "bg-warning/15 text-warning border-warning/30" },
  { value: "processing", label: "Processing", color: "bg-primary/15 text-primary border-primary/30" },
  { value: "shipped", label: "Shipped", color: "bg-accent/15 text-accent border-accent/30" },
  { value: "delivered", label: "Delivered", color: "bg-success/15 text-success border-success/30" },
  { value: "completed", label: "Completed", color: "bg-success/15 text-success border-success/30" },
  { value: "cancelled", label: "Cancelled", color: "bg-destructive/15 text-destructive border-destructive/30" },
];

const DashboardOrders = () => {
  const navigate = useNavigate();
  const { user, loading, isAdmin } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<"date" | "total">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
    else if (!loading && user && !isAdmin) navigate("/");
    else if (user && isAdmin) loadOrders();
  }, [user, loading, isAdmin, navigate]);

  const loadOrders = async () => {
    try {
      setLoadingOrders(true);
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id, user_id, total_amount, status, created_at, tracking_number, carrier,
          profiles ( email, full_name ),
          order_items ( product_name, product_price, quantity, subtotal, product_id )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const productIds = new Set<string>();
      (data || []).forEach((order: any) => {
        order.order_items?.forEach((item: any) => {
          if (item.product_id) productIds.add(item.product_id);
        });
      });

      let productImages: Record<string, string | null> = {};
      if (productIds.size > 0) {
        const { data: products } = await supabase
          .from("products")
          .select("id, image_url")
          .in("id", Array.from(productIds));
        (products || []).forEach(p => { productImages[p.id] = p.image_url; });
      }

      const ordersWithImages = (data || []).map((order: any) => ({
        ...order,
        order_items: (order.order_items || []).map((item: any) => ({
          ...item,
          products: item.product_id ? { image_url: productImages[item.product_id] || null } : null,
        })),
      }));

      setOrders(ordersWithImages as Order[]);
    } catch (error) {
      console.error("Error loading orders:", error);
      toast({ title: "Error", description: "Failed to load orders", variant: "destructive" });
    } finally {
      setLoadingOrders(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrder(orderId);
    try {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return;

      const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
      if (error) throw error;

      if (order.profiles?.email) {
        try {
          await supabase.functions.invoke("send-notification", {
            body: {
              type: "order_status",
              email: order.profiles.email,
              data: { orderId, orderStatus: newStatus, customerName: order.profiles.full_name },
            },
          });
          toast({ title: "Email sent", description: `Notification sent to ${order.profiles.email}` });
        } catch (e) { console.error("Notification error:", e); }
      }

      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
      toast({ title: "Order updated", description: `Status changed to ${newStatus}` });
    } catch (error) {
      console.error("Error updating order:", error);
      toast({ title: "Error", description: "Failed to update order status", variant: "destructive" });
    } finally {
      setUpdatingOrder(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const opt = statusOptions.find((s) => s.value === status);
    return (
      <Badge variant="outline" className={cn("font-medium capitalize", opt?.color || "")}>
        {opt?.label || status}
      </Badge>
    );
  };

  const filtered = orders
    .filter((o) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        o.id.toLowerCase().includes(q) ||
        (o.profiles?.full_name || "").toLowerCase().includes(q) ||
        (o.profiles?.email || "").toLowerCase().includes(q) ||
        o.order_items.some(i => i.product_name.toLowerCase().includes(q));
      const matchesStatus = statusFilter === "all" || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortField === "date") return dir * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      return dir * (a.total_amount - b.total_amount);
    });

  const toggleSort = (field: "date" | "total") => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30 dark:bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border bg-background/95 backdrop-blur px-4 lg:px-6">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <h1 className="text-lg lg:text-xl font-semibold">Orders Management</h1>
            </div>
            <Button variant="outline" size="sm" onClick={loadOrders} className="ml-auto gap-2">
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </header>

          <main className="flex-1 p-4 lg:p-6 space-y-5 overflow-auto">
            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Total Orders", value: orders.length, color: "text-primary" },
                { label: "Pending", value: orders.filter(o => o.status === "pending").length, color: "text-warning" },
                { label: "Processing", value: orders.filter(o => o.status === "processing").length, color: "text-primary" },
                { label: "Completed", value: orders.filter(o => o.status === "completed" || o.status === "delivered").length, color: "text-success" },
              ].map((stat) => (
                <Card key={stat.label} className="border-0 shadow-card">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className={cn("text-2xl font-bold mt-1", stat.color)}>{stat.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders, customers, products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-44 h-10">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {statusOptions.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Orders Table */}
            <Card className="border-0 shadow-card overflow-hidden">
              <CardHeader className="pb-3 px-4 lg:px-6">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="h-5 w-5 text-primary" />
                  All Orders ({filtered.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loadingOrders ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-16">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground font-medium">No orders found</p>
                    <p className="text-sm text-muted-foreground/60 mt-1">Try adjusting your search or filters</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                          <TableHead className="w-28 font-semibold">Order ID</TableHead>
                          <TableHead className="font-semibold">Customer</TableHead>
                          <TableHead className="font-semibold">Products</TableHead>
                          <TableHead className="font-semibold">
                            <button onClick={() => toggleSort("total")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                              Total <ArrowUpDown className="h-3.5 w-3.5" />
                            </button>
                          </TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="font-semibold">
                            <button onClick={() => toggleSort("date")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                              Date <ArrowUpDown className="h-3.5 w-3.5" />
                            </button>
                          </TableHead>
                          <TableHead className="font-semibold">Update</TableHead>
                          <TableHead className="w-16 font-semibold">View</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map((order, idx) => (
                          <TableRow
                            key={order.id}
                            className={cn(
                              "transition-colors duration-150",
                              idx % 2 === 0 ? "bg-background" : "bg-muted/15",
                              "hover:bg-primary/5"
                            )}
                          >
                            <TableCell className="font-mono text-xs font-medium">
                              #{order.id.slice(0, 8).toUpperCase()}
                            </TableCell>
                            <TableCell>
                              <p className="font-medium text-sm">{order.profiles?.full_name || "Anonymous"}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Mail className="h-3 w-3" />{order.profiles?.email || "N/A"}
                              </p>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1.5 max-w-[220px]">
                                {order.order_items.slice(0, 2).map((item, i) => (
                                  <div key={i} className="flex items-center gap-2">
                                    <img
                                      src={item.products?.image_url || "/placeholder.svg"}
                                      alt={item.product_name}
                                      className="h-9 w-9 rounded-lg object-cover border border-border/50 bg-muted"
                                    />
                                    <div className="min-w-0">
                                      <p className="text-xs font-medium truncate">{item.product_name}</p>
                                      <p className="text-[10px] text-muted-foreground">×{item.quantity} · ${item.subtotal.toFixed(2)}</p>
                                    </div>
                                  </div>
                                ))}
                                {order.order_items.length > 2 && (
                                  <p className="text-[10px] text-muted-foreground">+{order.order_items.length - 2} more items</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold text-sm">
                              ${parseFloat(String(order.total_amount)).toFixed(2)}
                            </TableCell>
                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Select
                                value={order.status}
                                onValueChange={(v) => updateOrderStatus(order.id, v)}
                                disabled={updatingOrder === order.id}
                              >
                                <SelectTrigger className="w-[130px] h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {statusOptions.map((s) => (
                                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 hover:bg-primary/10"
                                onClick={() => navigate(`/dashboard/orders/${order.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
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
