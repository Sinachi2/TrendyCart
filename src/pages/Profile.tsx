import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { 
  User, Mail, Calendar, ShoppingBag, Package, Home, 
  BarChart3, Settings, LogOut, CreditCard, TrendingUp,
  ShoppingCart, DollarSign, CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/trendycart-logo.png";

const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [stats, setStats] = useState({ totalOrders: 0, totalSpent: 0, cartItems: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadProfile();
    loadRecentOrders();
  }, [user, navigate]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setFullName(data.full_name || "");
        setEmail(data.email || "");
      }

      const [ordersData, cartData] = await Promise.all([
        supabase.from("orders").select("total_amount").eq("user_id", user?.id),
        supabase.from("cart_items").select("quantity").eq("user_id", user?.id),
      ]);

      const totalOrders = ordersData.data?.length || 0;
      const totalSpent = ordersData.data?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const cartItems = cartData.data?.reduce((sum, item) => sum + item.quantity, 0) || 0;

      setStats({ totalOrders, totalSpent, cartItems });
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const loadRecentOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentOrders(data || []);
    } catch (error) {
      console.error("Error loading orders:", error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sidebarItems = [
    { icon: Home, label: "Dashboard", path: "/profile" },
    { icon: ShoppingBag, label: "Orders", path: "/orders" },
    { icon: ShoppingCart, label: "Shop", path: "/shop" },
    { icon: Settings, label: "Settings", path: "/profile" },
  ];

  return (
    <div className="min-h-screen bg-secondary/30 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-card border-r border-border min-h-screen p-6 hidden lg:block">
        <Link to="/" className="flex items-center gap-2 mb-10">
          <img src={logo} alt="TrendyCart" className="h-8 w-auto" />
        </Link>

        <nav className="space-y-2">
          {sidebarItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                location.pathname === item.path
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="bg-gradient-to-br from-primary to-accent rounded-2xl p-6 text-primary-foreground">
            <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-lg mb-1">Shop More</h4>
            <p className="text-sm opacity-80 mb-4">Explore our latest collection</p>
            <Button 
              variant="secondary" 
              className="w-full bg-white text-primary hover:bg-white/90"
              onClick={() => navigate("/shop")}
            >
              Browse Shop
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-10 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-muted-foreground mb-1">Welcome back,</p>
            <h1 className="text-3xl font-bold text-foreground">
              {fullName || "User"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card shadow-sm border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-sm border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-green-500/10 flex items-center justify-center">
                  <DollarSign className="h-7 w-7 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold text-foreground">${stats.totalSpent.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-sm border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center">
                  <ShoppingCart className="h-7 w-7 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cart Items</p>
                  <p className="text-2xl font-bold text-foreground">{stats.cartItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-sm border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                  <CreditCard className="h-7 w-7 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saved</p>
                  <p className="text-2xl font-bold text-foreground">$0.00</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="lg:col-span-2 bg-card shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <span>Account Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-muted-foreground">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      disabled
                      className="bg-muted border-0 h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-muted-foreground">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="border-border h-12 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Member Since</Label>
                    <Input
                      type="text"
                      value={new Date(user?.created_at || "").toLocaleDateString()}
                      disabled
                      className="bg-muted border-0 h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="flex items-center gap-2 h-12 px-4 bg-green-500/10 rounded-xl">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-green-600 font-medium">Active</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="submit" disabled={loading} className="rounded-xl h-12 px-8">
                    {loading ? "Updating..." : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/orders")}
                    className="rounded-xl h-12 px-8"
                  >
                    View Orders
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-card shadow-sm border-0">
            <CardHeader>
              <CardTitle className="text-lg">Recent Orders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                    <div>
                      <p className="font-medium text-foreground">${Number(order.total_amount).toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      order.status === 'completed' 
                        ? 'bg-green-500/10 text-green-600' 
                        : order.status === 'pending'
                        ? 'bg-yellow-500/10 text-yellow-600'
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No orders yet</p>
                  <Button 
                    variant="link" 
                    onClick={() => navigate("/shop")}
                    className="text-primary"
                  >
                    Start Shopping
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;
