import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  User,
  Package,
  Heart,
  Clock,
  TrendingUp,
  Settings,
  ChevronRight,
  ShoppingBag,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
        supabase
          .from("orders")
          .select("id, created_at, status, total_amount")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase.from("wishlist").select("id").eq("user_id", user.id),
      ]);

      if (profileRes.data) setProfile(profileRes.data);

      const orders = ordersRes.data || [];
      const totalSpent = orders.reduce(
        (sum, o) => sum + Number(o.total_amount),
        0
      );
      const pendingOrders = orders.filter(
        (o) => o.status === "pending" || o.status === "processing"
      ).length;

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
          <Skeleton className="h-32 w-full rounded-2xl" />
        </main>
      </div>
    );
  }

  if (!user) return null;

  const quickStats = [
    { label: "Total Orders", value: stats.totalOrders, icon: Package },
    { label: "Wishlist Items", value: stats.wishlistCount, icon: Heart },
    {
      label: "Total Spent",
      value: `$${stats.totalSpent.toFixed(0)}`,
      icon: TrendingUp,
    },
    { label: "In Progress", value: stats.pendingOrders, icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Welcome */}
        <Card className="mb-8">
          <CardContent className="p-6 flex items-center gap-4">
            <User className="h-10 w-10 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">
                Welcome back{profile?.full_name && `, ${profile.full_name}`}!
              </h1>
              <p className="text-muted-foreground">
                Manage your account & orders
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {quickStats.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <s.icon className="h-6 w-6 text-primary" />
                <div>
                  <p className="text-xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="addresses">Addresses</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="grid md:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <Card>
              <CardHeader className="flex justify-between flex-row">
                <CardTitle>Recent Orders</CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/orders">
                    View All <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardHeader>

              <CardContent className="space-y-3">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    to={`/order-confirmation/${order.id}`}
                    className="flex justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div>
                      <p className="font-medium">
                        Order #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                      <p className="font-semibold">
                        ${Number(order.total_amount).toFixed(2)}
                      </p>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-2">
                <Button
                  asChild
                  variant="ghost"
                  className="w-full justify-start rounded-xl h-12"
                >
                  <Link to="/profile" className="flex items-center w-full">
                    <User className="h-5 w-5 mr-3 text-blue-500" />
                    Edit My Profile
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="ghost"
                  className="w-full justify-start rounded-xl h-12"
                >
                  <Link to="/orders" className="flex items-center w-full">
                    <Package className="h-5 w-5 mr-3 text-emerald-500" />
                    View All My Orders
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  </Link>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start rounded-xl h-12"
                  onClick={() => navigate("/wishlist")}
                >
                  <Heart className="h-5 w-5 mr-3 text-rose-500" />
                  My Wishlist
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start rounded-xl h-12"
                  onClick={() => navigate("/shop")}
                >
                  <ShoppingBag className="h-5 w-5 mr-3 text-violet-500" />
                  Continue Shopping
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </Button>
              </CardContent>
            </Card>
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
