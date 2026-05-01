import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Heart,
  Clock,
  TrendingUp,
  ShoppingBag,
  ArrowUpRight,
  User as UserIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { formatDistanceToNow } from "date-fns";
import { formatUSD } from "@/lib/currency";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  processing: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  shipped: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  delivered: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  cancelled: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  reversed: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
};

const UserDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    wishlistCount: 0,
    totalSpent: 0,
    pendingOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    try {
      const [profileRes, ordersRes, wishlistRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("orders").select("id, created_at, status, total_amount").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("wishlist").select("id").eq("user_id", user.id),
      ]);
      if (profileRes.data) setProfile(profileRes.data);
      const orders = ordersRes.data || [];
      const totalSpent = orders.reduce((s, o) => s + parseFloat(String(o.total_amount)), 0);
      const pendingOrders = orders.filter((o) => o.status === "pending" || o.status === "processing").length;
      setStats({
        totalOrders: orders.length,
        wishlistCount: wishlistRes.data?.length || 0,
        totalSpent,
        pendingOrders,
      });
      setRecentOrders(orders.slice(0, 5));
    } catch (e) {
      console.error("Error loading dashboard:", e);
    } finally {
      setLoading(false);
    }
  };

  const firstName = profile?.full_name?.split(" ")[0];

  const quickStats = [
    { label: "Orders", value: stats.totalOrders, icon: Package, accent: "bg-blue-500" },
    { label: "Wishlist", value: stats.wishlistCount, icon: Heart, accent: "bg-rose-500" },
    { label: "Total spent", value: formatUSD(stats.totalSpent), icon: TrendingUp, accent: "bg-emerald-500" },
    { label: "In progress", value: stats.pendingOrders, icon: Clock, accent: "bg-amber-500" },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-[1200px] mx-auto space-y-6">
        {/* Greeting bar */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
              Welcome back{firstName ? `, ${firstName}` : ""} 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track your orders, manage your profile and discover new arrivals.
            </p>
          </div>
          <Button asChild size="sm" className="rounded-lg self-start md:self-auto">
            <Link to="/shop">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Continue shopping
            </Link>
          </Button>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStats.map((s) => (
            <Card key={s.label} className="border-border/60 hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{s.label}</p>
                  <div className={`h-9 w-9 rounded-lg ${s.accent} bg-opacity-10 flex items-center justify-center`}>
                    <s.icon className="h-4 w-4 text-white" />
                  </div>
                </div>
                {loading ? <Skeleton className="h-8 w-20" /> : (
                  <p className="text-2xl lg:text-3xl font-bold tracking-tight">{s.value}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Orders + Account card */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                Recent orders
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/user-dashboard/orders">
                  View all
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-muted/50 flex items-center justify-center">
                    <ShoppingBag className="h-7 w-7 text-muted-foreground/60" />
                  </div>
                  <h3 className="font-semibold mb-1">No orders yet</h3>
                  <p className="text-muted-foreground text-sm mb-4">Start shopping to see your orders here</p>
                  <Button asChild size="sm" className="rounded-lg">
                    <Link to="/shop">Browse products</Link>
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40">
                      <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                        <th className="px-6 py-3 font-medium">Order</th>
                        <th className="px-6 py-3 font-medium">Date</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 font-medium text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {recentOrders.map((o) => (
                        <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-3">
                            <Link to={`/order-confirmation/${o.id}`} className="font-mono text-xs hover:text-primary">
                              #{o.id.slice(0, 8)}
                            </Link>
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
                            {formatUSD(parseFloat(String(o.total_amount)))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account card */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{profile?.full_name || "Your account"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start rounded-lg" asChild>
                  <Link to="/user-dashboard/profile">
                    <UserIcon className="h-4 w-4 mr-2" />
                    Edit profile
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start rounded-lg" asChild>
                  <Link to="/wishlist">
                    <Heart className="h-4 w-4 mr-2" />
                    My wishlist
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start rounded-lg" asChild>
                  <Link to="/user-dashboard/orders">
                    <Package className="h-4 w-4 mr-2" />
                    My orders
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserDashboard;
