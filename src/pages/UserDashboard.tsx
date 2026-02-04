import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Package,
  Heart,
  Clock,
  TrendingUp,
  ShoppingBag,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";

interface DashboardStats {
  totalOrders: number;
  wishlistCount: number;
  totalSpent: number;
  pendingOrders: number;
}

interface RecentOrder {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
}

const UserDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    wishlistCount: 0,
    totalSpent: 0,
    pendingOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      const [profileRes, ordersRes, wishlistRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("orders").select("id, created_at, status, total_amount").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("wishlist").select("id").eq("user_id", user.id),
      ]);

      if (profileRes.data) setProfile(profileRes.data);

      const orders = ordersRes.data || [];
      const totalSpent = orders.reduce((sum, o) => sum + parseFloat(String(o.total_amount)), 0);
      const pendingOrders = orders.filter((o) => o.status === "pending" || o.status === "processing").length;

      setStats({
        totalOrders: orders.length,
        wishlistCount: wishlistRes.data?.length || 0,
        totalSpent,
        pendingOrders,
      });

      setRecentOrders(orders.slice(0, 5));
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
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

  const quickStats = [
    { label: "Total Orders", value: stats.totalOrders, icon: Package, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10" },
    { label: "Wishlist Items", value: stats.wishlistCount, icon: Heart, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10" },
    { label: "Total Spent", value: `$${stats.totalSpent.toFixed(0)}`, icon: TrendingUp, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "In Progress", value: stats.pendingOrders, icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
  ];

  if (loading) {
    return (
      <DashboardLayout title="Dashboard" description="Welcome back!">
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Welcome Banner */}
      <Card className="mb-8 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20 overflow-hidden">
        <CardContent className="p-6 lg:p-8">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 lg:h-16 lg:w-16 rounded-2xl bg-primary/20 flex items-center justify-center">
              <User className="h-7 w-7 lg:h-8 lg:w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-foreground">
                Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}!
              </h1>
              <p className="text-muted-foreground text-sm lg:text-base">
                Here's what's happening with your account
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {quickStats.map((stat, index) => (
          <Card 
            key={stat.label} 
            className="bg-card/50 backdrop-blur border-border/50 hover:shadow-md transition-all animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xl lg:text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Recent Orders
          </CardTitle>
          <Button variant="ghost" size="sm" className="rounded-xl gap-1" asChild>
            <Link to="/user-dashboard/orders">
              View All
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                <ShoppingBag className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h3 className="font-semibold mb-2">No orders yet</h3>
              <p className="text-muted-foreground text-sm mb-4">Start shopping to see your orders here</p>
              <Button asChild className="rounded-xl">
                <Link to="/shop">Browse Products</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order, index) => (
                <Link
                  key={order.id}
                  to={`/order-confirmation/${order.id}`}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div>
                    <p className="font-medium text-sm text-foreground">
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={`${getStatusColor(order.status)} text-xs border`}>
                      {order.status}
                    </Badge>
                    <span className="font-semibold text-sm">
                      ${parseFloat(String(order.total_amount)).toFixed(2)}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default UserDashboard;
