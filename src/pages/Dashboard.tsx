import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, DollarSign, Users, Package } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    ordersCount: 0,
    customersCount: 0,
    productsCount: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);

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
      // Load stats
      const [ordersRes, customersRes, productsRes] = await Promise.all([
        supabase.from("orders").select("total_amount"),
        supabase.from("profiles").select("id"),
        supabase.from("products").select("id"),
      ]);

      const totalRevenue = ordersRes.data?.reduce((sum, order) => sum + parseFloat(String(order.total_amount || 0)), 0) || 0;

      setStats({
        totalRevenue,
        ordersCount: ordersRes.data?.length || 0,
        customersCount: customersRes.data?.length || 0,
        productsCount: productsRes.data?.length || 0,
      });

      // Load recent orders
      const { data: orders } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(4);

      setRecentOrders(orders || []);

      // Load top products
      const { data: products } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(4);

      setTopProducts(products || []);
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
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Orders",
      value: stats.ordersCount.toString(),
      change: "+12.5%",
      icon: ShoppingCart,
      color: "text-blue-600",
    },
    {
      title: "Customers",
      value: stats.customersCount.toString(),
      change: "+8.2%",
      icon: Users,
      color: "text-purple-600",
    },
    {
      title: "Products",
      value: stats.productsCount.toString(),
      change: "+3.1%",
      icon: Package,
      color: "text-orange-600",
    },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border bg-background px-6">
            <SidebarTrigger />
            <h1 className="text-xl font-semibold">Dashboard Overview</h1>
          </header>

          <main className="flex-1 p-6">
            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              {statsData.map((stat) => (
                <Card key={stat.title} className="hover:shadow-card transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="text-green-600">{stat.change}</span> from last month
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between pb-4 border-b border-border last:border-0 last:pb-0">
                        <div>
                          <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">{order.status}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${parseFloat(order.total_amount).toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {recentOrders.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">No orders yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topProducts.map((product, i) => (
                      <div key={product.id} className="flex items-center justify-between pb-4 border-b border-border last:border-0 last:pb-0">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">${parseFloat(product.price).toFixed(2)}</p>
                        </div>
                        <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${100 - (i * 15)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    {topProducts.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">No products yet</p>
                    )}
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
