import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ArrowDownRight
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import LowStockAlerts from "@/components/LowStockAlerts";
import ActivityFeed from "@/components/ActivityFeed";

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

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (!loading && user && !isAdmin) {
      navigate("/");
    } else if (user && isAdmin) {
      loadDashboardData();
    }
  }, [user, loading, isAdmin, navigate]);

  const loadDashboardData = async () => {
    try {
      // Load stats in parallel
      const [ordersRes, customersRes, productsRes, paymentsRes] = await Promise.all([
        supabase.from("orders").select("total_amount"),
        supabase.from("profiles").select("id"),
        supabase.from("products").select("id"),
        supabase.from("payment_proofs").select("id").eq("status", "pending"),
      ]);

      const totalRevenue = ordersRes.data?.reduce(
        (sum, order) => sum + parseFloat(String(order.total_amount || 0)), 
        0
      ) || 0;

      setStats({
        totalRevenue,
        ordersCount: ordersRes.data?.length || 0,
        customersCount: customersRes.data?.length || 0,
        productsCount: productsRes.data?.length || 0,
        pendingPayments: paymentsRes.data?.length || 0,
      });

      // Load recent orders
      const { data: orders } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentOrders(orders || []);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
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

  const statsData = [
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toFixed(2)}`,
      change: "+20.1%",
      trend: "up",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Orders",
      value: stats.ordersCount.toString(),
      change: "+12.5%",
      trend: "up",
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Customers",
      value: stats.customersCount.toString(),
      change: "+8.2%",
      trend: "up",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Products",
      value: stats.productsCount.toString(),
      change: "+3.1%",
      trend: "up",
      icon: Package,
      color: "text-orange-600",
      bgColor: "bg-orange-500/10",
    },
  ];

  const quickActions = [
    { label: "Add Product", icon: Plus, href: "/dashboard/products", color: "bg-primary text-primary-foreground" },
    { label: "View Orders", icon: Eye, href: "/dashboard/orders", color: "bg-blue-600 text-white" },
    { label: "Manage Coupons", icon: Tag, href: "/dashboard/coupons", color: "bg-purple-600 text-white" },
    { label: "Verify Payments", icon: CreditCard, href: "/dashboard/payments", color: "bg-green-600 text-white", badge: stats.pendingPayments },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500/10 text-green-700";
      case "processing": return "bg-blue-500/10 text-blue-700";
      case "shipped": return "bg-purple-500/10 text-purple-700";
      case "cancelled": return "bg-red-500/10 text-red-700";
      default: return "bg-yellow-500/10 text-yellow-700";
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border bg-background/95 backdrop-blur px-6">
            <SidebarTrigger />
            <div className="flex-1">
              <h1 className="text-xl font-semibold">Dashboard Overview</h1>
              <p className="text-sm text-muted-foreground">Welcome back! Here's what's happening.</p>
            </div>
            <Button asChild>
              <Link to="/dashboard/products">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Link>
            </Button>
          </header>

          <main className="flex-1 p-6 space-y-6">
            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {statsData.map((stat) => (
                <Card key={stat.title} className="hover:shadow-card transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                      <div className={`flex items-center gap-1 text-xs font-medium ${
                        stat.trend === "up" ? "text-green-600" : "text-destructive"
                      }`}>
                        {stat.trend === "up" ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {stat.change}
                      </div>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-2xl font-bold">{stat.value}</h3>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {quickActions.map((action) => (
                    <Button
                      key={action.label}
                      asChild
                      variant="outline"
                      className="h-auto py-4 flex-col gap-2 relative"
                    >
                      <Link to={action.href}>
                        <div className={`p-2 rounded-lg ${action.color}`}>
                          <action.icon className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-medium">{action.label}</span>
                        {action.badge !== undefined && action.badge > 0 && (
                          <Badge variant="destructive" className="absolute -top-2 -right-2">
                            {action.badge}
                          </Badge>
                        )}
                      </Link>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Activity Feed */}
              <ActivityFeed />

              {/* Low Stock Alerts & Recent Orders */}
              <div className="space-y-6">
                <LowStockAlerts threshold={10} limit={4} />
                
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Recent Orders</CardTitle>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to="/dashboard/orders">View All</Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentOrders.map((order) => (
                        <div 
                          key={order.id} 
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div>
                            <p className="font-medium text-sm">Order #{order.id.slice(0, 8)}</p>
                            <Badge variant="secondary" className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${parseFloat(order.total_amount).toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      {recentOrders.length === 0 && (
                        <p className="text-muted-foreground text-center py-4 text-sm">No orders yet</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
