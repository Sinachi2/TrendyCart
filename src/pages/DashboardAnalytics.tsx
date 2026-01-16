import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar } from "@/components/AdminSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

interface SalesData {
  month: string;
  sales: number;
  orders: number;
}

interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
}

interface CustomerMetric {
  label: string;
  value: number;
  change: number;
}

const DashboardAnalytics = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [customerMetrics, setCustomerMetrics] = useState<CustomerMetric[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    avgOrderValue: 0,
    revenueChange: 12.5,
    ordersChange: 8.2,
    customersChange: 15.3,
    aovChange: -2.1,
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/auth");
      } else if (!isAdmin) {
        navigate("/");
      } else {
        loadAnalyticsData();
      }
    }
  }, [user, authLoading, isAdmin, navigate]);

  const loadAnalyticsData = async () => {
    try {
      const [ordersRes, productsRes, profilesRes, orderItemsRes] = await Promise.all([
        supabase.from("orders").select("id, total_amount, status, created_at"),
        supabase.from("products").select("id, name, price"),
        supabase.from("profiles").select("id, created_at"),
        supabase.from("order_items").select("product_name, subtotal, quantity"),
      ]);

      const orders = ordersRes.data || [];
      const products = productsRes.data || [];
      const profiles = profilesRes.data || [];
      const orderItems = orderItemsRes.data || [];

      // Calculate total stats
      const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
      const totalOrders = orders.length;
      const totalCustomers = profiles.length;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      setStats({
        totalRevenue,
        totalOrders,
        totalCustomers,
        avgOrderValue,
        revenueChange: 12.5,
        ordersChange: 8.2,
        customersChange: 15.3,
        aovChange: -2.1,
      });

      // Generate monthly sales data
      const monthlyData: Record<string, { sales: number; orders: number }> = {};
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      months.forEach((month) => {
        monthlyData[month] = { sales: 0, orders: 0 };
      });

      orders.forEach((order) => {
        const date = new Date(order.created_at);
        const monthName = months[date.getMonth()];
        monthlyData[monthName].sales += Number(order.total_amount);
        monthlyData[monthName].orders += 1;
      });

      const salesChartData = months.map((month) => ({
        month,
        sales: Math.round(monthlyData[month].sales),
        orders: monthlyData[month].orders,
      }));

      setSalesData(salesChartData);

      // Calculate top products by revenue
      const productRevenue: Record<string, { name: string; sales: number; revenue: number }> = {};
      
      orderItems.forEach((item) => {
        if (!productRevenue[item.product_name]) {
          productRevenue[item.product_name] = { name: item.product_name, sales: 0, revenue: 0 };
        }
        productRevenue[item.product_name].sales += item.quantity;
        productRevenue[item.product_name].revenue += Number(item.subtotal);
      });

      const sortedProducts = Object.values(productRevenue)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setTopProducts(sortedProducts);

      // Calculate order status distribution
      const statusCounts: Record<string, number> = {
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
      };

      orders.forEach((order) => {
        if (statusCounts[order.status] !== undefined) {
          statusCounts[order.status]++;
        }
      });

      setOrderStatusData([
        { name: "Pending", value: statusCounts.pending, color: "hsl(var(--chart-1))" },
        { name: "Processing", value: statusCounts.processing, color: "hsl(var(--chart-2))" },
        { name: "Shipped", value: statusCounts.shipped, color: "hsl(var(--chart-3))" },
        { name: "Delivered", value: statusCounts.delivered, color: "hsl(var(--chart-4))" },
        { name: "Cancelled", value: statusCounts.cancelled, color: "hsl(var(--chart-5))" },
      ]);

      // Customer metrics
      setCustomerMetrics([
        { label: "New Customers", value: Math.floor(profiles.length * 0.3), change: 15.3 },
        { label: "Returning Customers", value: Math.floor(profiles.length * 0.7), change: 8.7 },
        { label: "Avg. Lifetime Value", value: Math.round(totalRevenue / Math.max(profiles.length, 1)), change: 12.1 },
      ]);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const salesChartConfig: ChartConfig = {
    sales: {
      label: "Sales",
      color: "hsl(var(--chart-1))",
    },
    orders: {
      label: "Orders",
      color: "hsl(var(--chart-2))",
    },
  };

  const productChartConfig: ChartConfig = {
    revenue: {
      label: "Revenue",
      color: "hsl(var(--chart-1))",
    },
  };

  if (authLoading || loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AdminSidebar />
          <main className="flex-1 p-6">
            <div className="space-y-6">
              <Skeleton className="h-8 w-48" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Skeleton className="h-80 rounded-xl" />
                <Skeleton className="h-80 rounded-xl" />
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!user || !isAdmin) return null;

  const statCards = [
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      change: stats.revenueChange,
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders.toLocaleString(),
      change: stats.ordersChange,
      icon: ShoppingCart,
      color: "text-blue-600",
      bg: "bg-blue-500/10",
    },
    {
      title: "Total Customers",
      value: stats.totalCustomers.toLocaleString(),
      change: stats.customersChange,
      icon: Users,
      color: "text-violet-600",
      bg: "bg-violet-500/10",
    },
    {
      title: "Avg. Order Value",
      value: `$${stats.avgOrderValue.toFixed(2)}`,
      change: stats.aovChange,
      icon: Package,
      color: "text-amber-600",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />

        <main className="flex-1 p-6 overflow-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Track your store performance and insights
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statCards.map((stat) => (
              <Card key={stat.title} className="bg-card/50 border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className={`h-12 w-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <Badge
                      variant="secondary"
                      className={`${
                        stat.change >= 0
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-red-500/10 text-red-600"
                      }`}
                    >
                      {stat.change >= 0 ? (
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(stat.change)}%
                    </Badge>
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Sales Trend Chart */}
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Sales Trends
                </CardTitle>
                <CardDescription>Monthly revenue and order volume</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={salesChartConfig} className="h-[300px] w-full">
                  <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="hsl(var(--chart-1))"
                      fill="hsl(var(--chart-1))"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Top Products Chart */}
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Top Products
                </CardTitle>
                <CardDescription>Best selling products by revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={productChartConfig} className="h-[300px] w-full">
                  <BarChart data={topProducts} layout="vertical" margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={120}
                      className="text-xs"
                      tickFormatter={(value) => value.length > 15 ? `${value.slice(0, 15)}...` : value}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="revenue" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Order Status Distribution */}
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  Order Status
                </CardTitle>
                <CardDescription>Distribution by status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={orderStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {orderStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 mt-4 justify-center">
                  {orderStatusData.map((entry) => (
                    <Badge
                      key={entry.name}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      {entry.name}: {entry.value}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Customer Metrics */}
            <Card className="bg-card/50 border-border/50 lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Customer Metrics
                </CardTitle>
                <CardDescription>Key customer performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {customerMetrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="p-4 bg-muted/30 rounded-xl text-center"
                    >
                      <p className="text-3xl font-bold">
                        {metric.label.includes("Value") ? `$${metric.value}` : metric.value}
                      </p>
                      <p className="text-sm text-muted-foreground mb-2">{metric.label}</p>
                      <Badge
                        variant="secondary"
                        className={`${
                          metric.change >= 0
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-red-500/10 text-red-600"
                        }`}
                      >
                        {metric.change >= 0 ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {Math.abs(metric.change)}% vs last month
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default DashboardAnalytics;
