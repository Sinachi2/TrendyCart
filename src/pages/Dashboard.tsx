import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ShoppingCart,
  DollarSign,
  Users,
  Package,
  Plus,
  Eye,
  Tag,
  CreditCard,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  Search,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  BarChart3,
} from "lucide-react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    ordersCount: 0,
    customersCount: 0,
    productsCount: 0,
    pendingPayments: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
    else if (!loading && user && !isAdmin) navigate("/");
    else if (user && isAdmin) loadDashboardData();
  }, [user, loading, isAdmin, navigate]);

  const loadDashboardData = async () => {
    try {
      const [ordersRes, customersRes, productsRes, paymentsRes, orderItemsRes] = await Promise.all([
        supabase.from("orders").select("id, total_amount, status, created_at, user_id"),
        supabase.from("profiles").select("id, full_name, created_at"),
        supabase.from("products").select("id, name, image_url"),
        supabase.from("payment_proofs").select("id").eq("status", "pending"),
        supabase.from("order_items").select("product_name, subtotal, quantity"),
      ]);

      const orders = ordersRes.data || [];
      const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(String(o.total_amount || "0")), 0);

      setStats({
        totalRevenue,
        ordersCount: orders.length,
        customersCount: customersRes.data?.length || 0,
        productsCount: productsRes.data?.length || 0,
        pendingPayments: paymentsRes.data?.length || 0,
      });

      // Recent orders
      setRecentOrders(orders.slice(0, 6));

      // Monthly sales
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthlyData: Record<string, number> = {};
      months.forEach(m => monthlyData[m] = 0);
      orders.forEach(o => {
        const m = months[new Date(o.created_at).getMonth()];
        monthlyData[m] += Number(o.total_amount);
      });
      setSalesData(months.map(m => ({ month: m, sales: Math.round(monthlyData[m]) })));

      // Order status pie
      const statusCounts: Record<string, number> = { pending: 0, processing: 0, shipped: 0, completed: 0, cancelled: 0 };
      orders.forEach(o => { if (statusCounts[o.status] !== undefined) statusCounts[o.status]++; });
      setOrderStatusData([
        { name: "Pending", value: statusCounts.pending, color: "hsl(var(--warning))" },
        { name: "Processing", value: statusCounts.processing, color: "hsl(var(--primary))" },
        { name: "Shipped", value: statusCounts.shipped, color: "hsl(var(--accent))" },
        { name: "Completed", value: statusCounts.completed, color: "hsl(var(--success))" },
        { name: "Cancelled", value: statusCounts.cancelled, color: "hsl(var(--destructive))" },
      ]);

      // Top products
      const productRevenue: Record<string, { name: string; sales: number; revenue: number }> = {};
      (orderItemsRes.data || []).forEach(item => {
        if (!productRevenue[item.product_name]) productRevenue[item.product_name] = { name: item.product_name, sales: 0, revenue: 0 };
        productRevenue[item.product_name].sales += item.quantity;
        productRevenue[item.product_name].revenue += Number(item.subtotal);
      });
      setTopProducts(Object.values(productRevenue).sort((a, b) => b.revenue - a.revenue).slice(0, 5));

      // Activity
      const acts = orders.slice(0, 8).map(o => ({
        id: o.id,
        title: `Order #${o.id.slice(0, 8)}`,
        status: o.status,
        amount: parseFloat(String(o.total_amount)),
        time: o.created_at,
      }));
      setActivities(acts);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  const salesChartConfig: ChartConfig = {
    sales: { label: "Revenue", color: "hsl(var(--primary))" },
  };

  const statsData = [
    { title: "Total Revenue", value: `$${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, change: "+20.1%", trend: "up", icon: DollarSign, gradient: "from-emerald-500 to-emerald-600" },
    { title: "Total Orders", value: stats.ordersCount.toString(), change: "+12.5%", trend: "up", icon: ShoppingCart, gradient: "from-blue-500 to-blue-600" },
    { title: "Customers", value: stats.customersCount.toString(), change: "+8.2%", trend: "up", icon: Users, gradient: "from-violet-500 to-violet-600" },
    { title: "Products", value: stats.productsCount.toString(), change: "+3.1%", trend: "up", icon: Package, gradient: "from-amber-500 to-amber-600" },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4 text-success" />;
      case "shipped": return <Truck className="h-4 w-4 text-primary" />;
      case "cancelled": return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-warning" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-success/10 text-success";
      case "processing": return "bg-primary/10 text-primary";
      case "shipped": return "bg-accent/10 text-accent";
      case "cancelled": return "bg-destructive/10 text-destructive";
      default: return "bg-warning/10 text-warning";
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30 dark:bg-background">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top navbar */}
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border bg-background/95 backdrop-blur px-6">
            <SidebarTrigger />
            <div className="flex-1 flex items-center gap-4">
              <div className="relative hidden md:block max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search anything..." className="pl-9 h-9 bg-muted/50" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative" asChild>
                <Link to="/dashboard/payments">
                  <Bell className="h-5 w-5" />
                  {stats.pendingPayments > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
                      {stats.pendingPayments}
                    </span>
                  )}
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/dashboard/products">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Product
                </Link>
              </Button>
            </div>
          </header>

          <main className="flex-1 p-4 lg:p-6 space-y-6 overflow-auto">
            {/* Welcome */}
            <div>
              <h1 className="text-2xl font-bold">Dashboard Overview</h1>
              <p className="text-sm text-muted-foreground">Welcome back! Here's what's happening with your store.</p>
            </div>

            {/* Stats Grid - Berry Vue style */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {statsData.map((stat) => (
                <Card key={stat.title} className="overflow-hidden border-0 shadow-card hover:shadow-card-hover transition-shadow duration-300">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                        <stat.icon className="h-5 w-5 text-white" />
                      </div>
                      <Badge variant="secondary" className={`text-xs ${
                        stat.trend === "up" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                      }`}>
                        {stat.trend === "up" ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                        {stat.change}
                      </Badge>
                    </div>
                    <h3 className="text-2xl font-bold">{stat.value}</h3>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Sales Overview - 2/3 width */}
              <Card className="lg:col-span-2 border-0 shadow-card">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        Sales Overview
                      </CardTitle>
                      <CardDescription>Monthly revenue trend</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/dashboard/analytics">View Details</Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={salesChartConfig} className="h-[280px] w-full">
                    <AreaChart data={salesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area type="monotone" dataKey="sales" stroke="hsl(var(--primary))" fill="url(#salesGradient)" strokeWidth={2} />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Order Status Pie */}
              <Card className="border-0 shadow-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    Order Status
                  </CardTitle>
                  <CardDescription>Distribution breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[180px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={orderStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                          {orderStatusData.map((entry, idx) => (
                            <Cell key={idx} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2 justify-center">
                    {orderStatusData.map((entry) => (
                      <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-muted-foreground">{entry.name}</span>
                        <span className="font-semibold">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Row */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Recent Orders Table */}
              <Card className="lg:col-span-2 border-0 shadow-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Recent Orders</CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/dashboard/orders">View All</Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-2 text-muted-foreground font-medium">Order ID</th>
                          <th className="text-left py-3 px-2 text-muted-foreground font-medium">Date</th>
                          <th className="text-left py-3 px-2 text-muted-foreground font-medium">Status</th>
                          <th className="text-right py-3 px-2 text-muted-foreground font-medium">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentOrders.map((order) => (
                          <tr key={order.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                            <td className="py-3 px-2 font-medium">#{order.id.slice(0, 8)}</td>
                            <td className="py-3 px-2 text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</td>
                            <td className="py-3 px-2">
                              <Badge variant="secondary" className={getStatusColor(order.status)}>
                                {order.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-2 text-right font-semibold">${parseFloat(order.total_amount).toFixed(2)}</td>
                          </tr>
                        ))}
                        {recentOrders.length === 0 && (
                          <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No orders yet</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Activity Timeline */}
              <Card className="border-0 shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Activity Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[320px] pr-2">
                    <div className="relative pl-6">
                      {/* Vertical line */}
                      <div className="absolute left-[9px] top-0 bottom-0 w-px bg-border" />
                      
                      {activities.map((act, idx) => (
                        <div key={act.id} className="relative pb-5 last:pb-0">
                          {/* Dot */}
                          <div className="absolute -left-[15px] top-1 h-5 w-5 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{act.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className={`text-[10px] ${getStatusColor(act.status)}`}>
                                {act.status}
                              </Badge>
                              <span className="text-xs font-semibold text-primary">${act.amount.toFixed(2)}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(act.time), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      ))}
                      {activities.length === 0 && (
                        <p className="text-muted-foreground text-sm text-center py-4">No activity yet</p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Top Products & Quick Actions */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Top Products */}
              <Card className="border-0 shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Top Products
                  </CardTitle>
                  <CardDescription>Best sellers by revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topProducts.map((product, idx) => (
                      <div key={product.name} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-sm font-bold text-primary">
                          #{idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.sales} sold</p>
                        </div>
                        <p className="font-semibold text-sm">${product.revenue.toFixed(2)}</p>
                      </div>
                    ))}
                    {topProducts.length === 0 && (
                      <p className="text-muted-foreground text-center py-4 text-sm">No sales data yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-0 shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                  <CardDescription>Common admin tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Add Product", icon: Plus, href: "/dashboard/products", gradient: "from-primary to-blue-600" },
                      { label: "View Orders", icon: Eye, href: "/dashboard/orders", gradient: "from-emerald-500 to-emerald-600" },
                      { label: "Manage Coupons", icon: Tag, href: "/dashboard/coupons", gradient: "from-violet-500 to-violet-600" },
                      { label: "Verify Payments", icon: CreditCard, href: "/dashboard/payments", gradient: "from-amber-500 to-amber-600", badge: stats.pendingPayments },
                    ].map((action) => (
                      <Button key={action.label} asChild variant="outline" className="h-auto py-5 flex-col gap-2 relative hover-lift border-border/50">
                        <Link to={action.href}>
                          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${action.gradient} shadow-lg`}>
                            <action.icon className="h-5 w-5 text-white" />
                          </div>
                          <span className="text-sm font-medium">{action.label}</span>
                          {action.badge !== undefined && action.badge > 0 && (
                            <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                              {action.badge}
                            </Badge>
                          )}
                        </Link>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
