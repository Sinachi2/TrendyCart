import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShoppingCart,
  DollarSign,
  Users,
  Package,
  Plus,
  ArrowUpRight,
  Bell,
  Search,
  TrendingUp,
} from "lucide-react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  processing: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  shipped: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  delivered: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  cancelled: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading, isAdmin } = useAuth();
  const [dataLoading, setDataLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    ordersCount: 0,
    customersCount: 0,
    productsCount: 0,
    pendingPayments: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
    else if (!loading && user && !isAdmin) navigate("/");
    else if (user && isAdmin) loadDashboardData();
  }, [user, loading, isAdmin, navigate]);

  const loadDashboardData = async () => {
    try {
      const [ordersRes, customersRes, productsRes, paymentsRes] = await Promise.all([
        supabase.from("orders").select("id, total_amount, status, created_at, user_id").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id, full_name, email"),
        supabase.from("products").select("id"),
        supabase.from("payment_proofs").select("id").eq("status", "pending"),
      ]);

      const orders = ordersRes.data || [];
      const profiles = customersRes.data || [];
      const totalRevenue = orders.reduce((s, o) => s + parseFloat(String(o.total_amount || "0")), 0);

      setStats({
        totalRevenue,
        ordersCount: orders.length,
        customersCount: profiles.length,
        productsCount: productsRes.data?.length || 0,
        pendingPayments: paymentsRes.data?.length || 0,
      });

      const profileMap = new Map(profiles.map((p) => [p.id, p]));
      setRecentOrders(
        orders.slice(0, 7).map((o) => ({ ...o, customer: profileMap.get(o.user_id) }))
      );

      // Last 7 days revenue
      const days: { day: string; sales: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push({
          day: d.toLocaleDateString("en-US", { weekday: "short" }),
          sales: 0,
        });
      }
      orders.forEach((o) => {
        const created = new Date(o.created_at);
        const diff = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24));
        if (diff >= 0 && diff < 7) days[6 - diff].sales += parseFloat(String(o.total_amount || "0"));
      });
      setSalesData(days);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setDataLoading(false);
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

  const chartConfig: ChartConfig = {
    sales: { label: "Revenue", color: "hsl(var(--primary))" },
  };

  const statsData = [
    { title: "Total Revenue", value: `$${stats.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, icon: DollarSign, accent: "bg-emerald-500" },
    { title: "Orders", value: stats.ordersCount.toLocaleString(), icon: ShoppingCart, accent: "bg-blue-500" },
    { title: "Customers", value: stats.customersCount.toLocaleString(), icon: Users, accent: "bg-violet-500" },
    { title: "Products", value: stats.productsCount.toLocaleString(), icon: Package, accent: "bg-amber-500" },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30 dark:bg-background">
        <AdminSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border bg-background/95 backdrop-blur px-4 lg:px-6">
            <SidebarTrigger />
            <div className="relative hidden md:block flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search orders, products, customers..." className="pl-9 h-9 bg-muted/50 border-0" />
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="ghost" size="icon" className="relative" asChild>
                <Link to="/dashboard/orders">
                  <Bell className="h-5 w-5" />
                  {stats.pendingPayments > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
                      {stats.pendingPayments}
                    </span>
                  )}
                </Link>
              </Button>
              <Button asChild size="sm" className="rounded-lg">
                <Link to="/dashboard/products">
                  <Plus className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Add Product</span>
                </Link>
              </Button>
            </div>
          </header>

          <main className="flex-1 p-4 lg:p-8 space-y-6 overflow-auto max-w-[1400px] w-full mx-auto">
            {/* Greeting */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Good day 👋</h1>
                <p className="text-sm text-muted-foreground mt-1">Here's a snapshot of your store today.</p>
              </div>
              <Badge variant="secondary" className="self-start md:self-auto bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 px-3 py-1.5">
                <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                Store healthy
              </Badge>
            </div>

            {/* KPI cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {statsData.map((s) => (
                <Card key={s.title} className="border-border/60 hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{s.title}</p>
                      <div className={`h-9 w-9 rounded-lg ${s.accent} bg-opacity-10 flex items-center justify-center`}>
                        <s.icon className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    {dataLoading ? <Skeleton className="h-8 w-24" /> : (
                      <p className="text-2xl lg:text-3xl font-bold tracking-tight">{s.value}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Chart + Quick links */}
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2 border-border/60">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-base">Revenue · last 7 days</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">Daily sales totals</p>
                  </div>
                </CardHeader>
                <CardContent>
                  {dataLoading ? <Skeleton className="h-64 w-full" /> : (
                    <ChartContainer config={chartConfig} className="h-64 w-full">
                      <AreaChart data={salesData}>
                        <defs>
                          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                        <YAxis tickLine={false} axisLine={false} fontSize={12} width={40} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#rev)" />
                      </AreaChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Quick actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { label: "Manage Orders", to: "/dashboard/orders", icon: ShoppingCart },
                    { label: "Add Product", to: "/dashboard/products", icon: Package },
                    { label: "View Customers", to: "/dashboard/customers", icon: Users },
                    { label: "Visit Storefront", to: "/", icon: ArrowUpRight },
                  ].map((a) => (
                    <Button key={a.to} variant="ghost" className="w-full justify-start h-11 rounded-lg" asChild>
                      <Link to={a.to}>
                        <a.icon className="h-4 w-4 mr-2 text-muted-foreground" />
                        {a.label}
                      </Link>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders Table */}
            <Card className="border-border/60">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-base">Recent orders</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/dashboard/orders">
                    View all
                    <ArrowUpRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {dataLoading ? (
                  <div className="p-6 space-y-3">
                    {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : recentOrders.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    No orders yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40">
                        <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                          <th className="px-6 py-3 font-medium">Order</th>
                          <th className="px-6 py-3 font-medium">Customer</th>
                          <th className="px-6 py-3 font-medium">Date</th>
                          <th className="px-6 py-3 font-medium">Status</th>
                          <th className="px-6 py-3 font-medium text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {recentOrders.map((o) => (
                          <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-3 font-mono text-xs">#{o.id.slice(0, 8)}</td>
                            <td className="px-6 py-3">
                              <div className="font-medium truncate max-w-[180px]">
                                {o.customer?.full_name || o.customer?.email || "Guest"}
                              </div>
                            </td>
                            <td className="px-6 py-3 text-muted-foreground text-xs">
                              {formatDistanceToNow(new Date(o.created_at), { addSuffix: true })}
                            </td>
                            <td className="px-6 py-3">
                              <Badge variant="outline" className={`capitalize border ${STATUS_STYLES[o.status] || "bg-muted"}`}>
                                {o.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-3 text-right font-semibold">
                              ${parseFloat(String(o.total_amount)).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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

export default Dashboard;
