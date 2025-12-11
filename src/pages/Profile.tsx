import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  User, Home, LogOut, Moon, Sun, Heart,
  ShoppingCart, Package, Settings, ChevronRight, Mail, Calendar, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/trendycart-logo.png";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AddressBook } from "@/components/AddressBook";

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [stats, setStats] = useState({ totalOrders: 0, totalSpent: 0, cartItems: 0, wishlistItems: 0 });
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
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFullName(data.full_name || "");
        setEmail(data.email || "");
      }

      const [ordersData, cartData, wishlistData] = await Promise.all([
        supabase.from("orders").select("total_amount").eq("user_id", user?.id),
        supabase.from("cart_items").select("quantity").eq("user_id", user?.id),
        supabase.from("wishlist").select("id").eq("user_id", user?.id),
      ]);

      const totalOrders = ordersData.data?.length || 0;
      const totalSpent = ordersData.data?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const cartItems = cartData.data?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      const wishlistItems = wishlistData.data?.length || 0;

      setStats({ totalOrders, totalSpent, cartItems, wishlistItems });
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
        .limit(3);

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
        title: "Profile updated",
        description: "Your changes have been saved successfully.",
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

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";
  };

  const quickActions = [
    { icon: Package, label: "My Orders", description: "Track your purchases", path: "/orders", color: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    { icon: Heart, label: "Wishlist", description: `${stats.wishlistItems} saved items`, path: "/wishlist", color: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400" },
    { icon: ShoppingCart, label: "My Cart", description: `${stats.cartItems} items`, path: "/cart", color: "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400" },
    { icon: Home, label: "Browse Shop", description: "Discover new products", path: "/shop", color: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400";
      case "shipped": return "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400";
      case "processing": return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="TrendyCart" className="h-8 w-auto" />
            </Link>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full h-9 w-9"
                onClick={toggleTheme}
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full h-9 w-9 text-muted-foreground hover:text-foreground" 
                onClick={signOut}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <Avatar className="h-20 w-20 ring-4 ring-background shadow-lg">
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-2xl font-semibold">
              {getInitials(fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Welcome back</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {fullName || "Hello there!"}
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {email}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="bg-card/50 backdrop-blur border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <p className="text-3xl font-bold text-foreground">{stats.totalOrders}</p>
              <p className="text-sm text-muted-foreground mt-1">Orders</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <p className="text-3xl font-bold text-foreground">${stats.totalSpent.toFixed(0)}</p>
              <p className="text-sm text-muted-foreground mt-1">Total Spent</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <p className="text-3xl font-bold text-foreground">{stats.cartItems}</p>
              <p className="text-sm text-muted-foreground mt-1">Cart Items</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <p className="text-3xl font-bold text-foreground">{stats.wishlistItems}</p>
              <p className="text-sm text-muted-foreground mt-1">Wishlist</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Card 
                key={action.label}
                className="group cursor-pointer bg-card/50 backdrop-blur border-border/50 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300"
                onClick={() => navigate(action.path)}
              >
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${action.color} transition-transform group-hover:scale-105`}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{action.label}</p>
                    <p className="text-sm text-muted-foreground truncate">{action.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Profile Settings */}
          <section className="lg:col-span-3">
            <Card className="bg-card/50 backdrop-blur border-border/50 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Settings className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">Profile Settings</h2>
                </div>
                
                <form onSubmit={handleUpdateProfile} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm text-muted-foreground">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="h-11 rounded-xl border-border/50 bg-background/50 focus:bg-background transition-colors"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm text-muted-foreground">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      disabled
                      className="h-11 rounded-xl bg-muted/50 border-0 text-muted-foreground"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Member Since</Label>
                    <div className="flex items-center gap-2 h-11 px-4 bg-muted/50 rounded-xl text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(user?.created_at || "").toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full sm:w-auto rounded-xl h-11 px-8 mt-2"
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </section>

          {/* Recent Orders */}
          <section className="lg:col-span-2">
            <Card className="bg-card/50 backdrop-blur border-border/50 shadow-sm h-full">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                      <Package className="h-5 w-5 text-accent" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">Recent Orders</h2>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-primary hover:text-primary"
                    onClick={() => navigate("/orders")}
                  >
                    View All
                  </Button>
                </div>

                <div className="space-y-3">
                  {recentOrders.length > 0 ? (
                    recentOrders.map((order) => (
                      <div 
                        key={order.id} 
                        className="flex items-center justify-between p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => navigate("/orders")}
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-foreground text-sm">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                          <span className="font-semibold text-foreground">
                            ${parseFloat(order.total_amount).toFixed(0)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Package className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">No orders yet</p>
                      <Button 
                        variant="link" 
                        className="text-primary mt-2" 
                        onClick={() => navigate("/shop")}
                      >
                        Start Shopping
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Address Book Section */}
        {user && (
          <section>
            <AddressBook userId={user.id} />
          </section>
        )}
      </main>
    </div>
  );
};

export default Profile;
