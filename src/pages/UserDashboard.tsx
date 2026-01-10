import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  User,
  Package,
  Heart,
  MapPin,
  CreditCard,
  Settings,
  ChevronRight,
  ShoppingBag,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { AddressBook } from "@/components/AddressBook";
import { PaymentMethods } from "@/components/PaymentMethods";
import { Skeleton } from "@/components/ui/skeleton";

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
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
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
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (user) {
      loadDashboardData();
    }
  }, [user, authLoading, navigate]);

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

      setRecentOrders(orders.slice(0, 3));
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
      case "processing":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      case "shipped":
        return "bg-violet-500/10 text-violet-700 dark:text-violet-400";
      case "delivered":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  const quickStats = [
    { label: "Total Orders", value: stats.totalOrders, icon: Package, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10" },
    { label: "Wishlist Items", value: stats.wishlistCount, icon: Heart, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10" },
    { label: "Total Spent", value: `$${stats.totalSpent.toFixed(0)}`, icon: TrendingUp, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "In Progress", value: stats.pendingOrders, icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Welcome Banner */}
        <Card className="mb-8 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20 overflow-hidden relative">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}!
                </h1>
                <p className="text-muted-foreground mt-1">
                  Here's what's happening with your account
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {quickStats.map((stat) => (
            <Card key={stat.label} className="bg-card/50 backdrop-blur border-border/50 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-background">
              Overview
            </TabsTrigger>
            <TabsTrigger value="addresses" className="rounded-lg data-[state=active]:bg-background">
              Addresses
            </TabsTrigger>
            <TabsTrigger value="payments" className="rounded-lg data-[state=active]:bg-background">
              Payments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Recent Orders */}
              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Recent Orders
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => navigate("/orders")}>
                    View All
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {recentOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground mb-4">No orders yet</p>
                      <Button variant="outline" className="rounded-xl" onClick={() => navigate("/shop")}>
                        Start Shopping
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentOrders.map((order) => (
                        <Link
                          key={order.id}
                          to={`/order-confirmation/${order.id}`}
                          className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div>
                            <p className="font-medium text-sm text-foreground">
                              Order #{order.id.slice(0, 8).toUpperCase()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right flex items-center gap-3">
                            <Badge className={`${getStatusColor(order.status)} text-xs`}>
                              {order.status}
                            </Badge>
                            <span className="font-semibold text-sm">
                              ${parseFloat(String(order.total_amount)).toFixed(2)}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start rounded-xl h-12 hover:bg-muted/50"
                    onClick={() => navigate("/profile")}
                  >
                    <User className="h-5 w-5 mr-3 text-blue-500" />
                    Edit My Profile
                    <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start rounded-xl h-12 hover:bg-muted/50"
                    onClick={() => navigate("/orders")}
                  >
                    <Package className="h-5 w-5 mr-3 text-emerald-500" />
                    View All My Orders
                    <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start rounded-xl h-12 hover:bg-muted/50"
                    onClick={() => navigate("/wishlist")}
                  >
                    <Heart className="h-5 w-5 mr-3 text-rose-500" />
                    My Wishlist
                    <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start rounded-xl h-12 hover:bg-muted/50"
                    onClick={() => navigate("/shop")}
                  >
                    <ShoppingBag className="h-5 w-5 mr-3 text-violet-500" />
                    Continue Shopping
                    <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="addresses">
            <AddressBook userId={user.id} />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentMethods userId={user.id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default UserDashboard;
