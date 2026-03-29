import { useEffect, useState } from "react";
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
import { Package, Mail, RefreshCw, Search, Eye, ArrowUpDown } from "lucide-react";

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
  { value: "pending", label: "Pending", color: "bg-warning/10 text-warning-foreground border-warning/20" },
  { value: "processing", label: "Processing", color: "bg-primary/10 text-primary border-primary/20" },
  { value: "shipped", label: "Shipped", color: "bg-accent/10 text-accent-foreground border-accent/20" },
  { value: "delivered", label: "Delivered", color: "bg-success/10 text-success-foreground border-success/20" },
  { value: "completed", label: "Completed", color: "bg-success/10 text-success-foreground border-success/20" },
  { value: "cancelled", label: "Cancelled", color: "bg-destructive/10 text-destructive border-destructive/20" },
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

      // Fetch product images for order items
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
    return <Badge variant="outline" className={opt?.color || ""}>{opt?.label || status}</Badge>;
  };

  // Filter & sort
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

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  if (!user || !isAdmin) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border bg-background px-6">
            <SidebarTrigger />
            <h1 className="text-xl font-semibold">Orders Management</h1>
            <Button variant="outline" size="sm" onClick={loadOrders} className="ml-auto">
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
          </header>

          <main className="flex-1 p-6 space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders, customers, products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-44">
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

            <Card className="border-border/50 shadow-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="h-5 w-5 text-primary" />
                  All Orders ({filtered.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loadingOrders ? (
                  <div className="text-center py-12"><p className="text-muted-foreground">Loading orders...</p></div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
                    <p className="text-muted-foreground">No orders found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableHead className="w-28">Order ID</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Products</TableHead>
                          <TableHead>
                            <button onClick={() => toggleSort("total")} className="flex items-center gap-1 font-medium">
                              Total <ArrowUpDown className="h-3.5 w-3.5" />
                            </button>
                          </TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>
                            <button onClick={() => toggleSort("date")} className="flex items-center gap-1 font-medium">
                              Date <ArrowUpDown className="h-3.5 w-3.5" />
                            </button>
                          </TableHead>
                          <TableHead>Update</TableHead>
                          <TableHead className="w-16">View</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map((order, idx) => (
                          <TableRow key={order.id} className={idx % 2 === 0 ? "bg-background" : "bg-muted/10"}>
                            <TableCell className="font-mono text-xs">#{order.id.slice(0, 8).toUpperCase()}</TableCell>
                            <TableCell>
                              <p className="font-medium text-sm">{order.profiles?.full_name || "Anonymous"}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
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
                                      className="h-8 w-8 rounded object-cover border border-border/50"
                                    />
                                    <div className="min-w-0">
                                      <p className="text-xs font-medium truncate">{item.product_name}</p>
                                      <p className="text-[10px] text-muted-foreground">×{item.quantity}</p>
                                    </div>
                                  </div>
                                ))}
                                {order.order_items.length > 2 && (
                                  <p className="text-[10px] text-muted-foreground">+{order.order_items.length - 2} more</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold">${parseFloat(String(order.total_amount)).toFixed(2)}</TableCell>
                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                            <TableCell className="text-sm">{new Date(order.created_at).toLocaleDateString()}</TableCell>
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
                                className="h-8 w-8"
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
