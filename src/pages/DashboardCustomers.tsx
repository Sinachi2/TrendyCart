import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Search,
  Mail,
  Calendar,
  ShoppingBag,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  UserCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Customer {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  avatar_url: string | null;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string | null;
}

const DashboardCustomers = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"totalSpent" | "totalOrders" | "created_at">("totalSpent");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/auth");
      } else if (!isAdmin) {
        navigate("/");
      } else {
        loadCustomers();
      }
    }
  }, [user, authLoading, isAdmin, navigate]);

  const loadCustomers = async () => {
    try {
      setLoading(true);

      // Get all profiles (customers)
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name, created_at, avatar_url");

      if (profilesError) throw profilesError;

      // Get all orders with user info
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("user_id, total_amount, created_at");

      if (ordersError) throw ordersError;

      // Aggregate order data by user
      const ordersByUser = (orders || []).reduce((acc, order) => {
        if (!acc[order.user_id]) {
          acc[order.user_id] = { totalOrders: 0, totalSpent: 0, lastOrderDate: null };
        }
        acc[order.user_id].totalOrders += 1;
        acc[order.user_id].totalSpent += parseFloat(String(order.total_amount));
        if (!acc[order.user_id].lastOrderDate || new Date(order.created_at) > new Date(acc[order.user_id].lastOrderDate)) {
          acc[order.user_id].lastOrderDate = order.created_at;
        }
        return acc;
      }, {} as Record<string, { totalOrders: number; totalSpent: number; lastOrderDate: string | null }>);

      // Combine profile and order data
      const customersData = (profiles || []).map((profile) => ({
        ...profile,
        totalOrders: ordersByUser[profile.id]?.totalOrders || 0,
        totalSpent: ordersByUser[profile.id]?.totalSpent || 0,
        lastOrderDate: ordersByUser[profile.id]?.lastOrderDate || null,
      }));

      setCustomers(customersData);
    } catch (error) {
      console.error("Error loading customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      customer.email.toLowerCase().includes(searchLower) ||
      (customer.full_name?.toLowerCase() || "").includes(searchLower)
    );
  });

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    let aVal: number | string = 0;
    let bVal: number | string = 0;

    switch (sortField) {
      case "totalSpent":
        aVal = a.totalSpent;
        bVal = b.totalSpent;
        break;
      case "totalOrders":
        aVal = a.totalOrders;
        bVal = b.totalOrders;
        break;
      case "created_at":
        aVal = new Date(a.created_at).getTime();
        bVal = new Date(b.created_at).getTime();
        break;
    }

    if (sortDirection === "asc") {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });

  const handleSort = (field: "totalSpent" | "totalOrders" | "created_at") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  const stats = {
    totalCustomers: customers.length,
    activeCustomers: customers.filter((c) => c.totalOrders > 0).length,
    totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent, 0),
    avgOrderValue:
      customers.reduce((sum, c) => sum + c.totalSpent, 0) /
      Math.max(customers.reduce((sum, c) => sum + c.totalOrders, 0), 1),
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />

        <main className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <Users className="h-8 w-8 text-primary" />
                  Customer Management
                </h1>
                <p className="text-muted-foreground mt-1">
                  View and manage your customer base
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.totalCustomers}</p>
                      <p className="text-xs text-muted-foreground">Total Customers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <ShoppingBag className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.activeCustomers}</p>
                      <p className="text-xs text-muted-foreground">Active Customers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-violet-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">${stats.totalRevenue.toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">Total Revenue</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">${stats.avgOrderValue.toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">Avg Order Value</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search customers by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 rounded-xl bg-background/50"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Customers Table */}
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">
                  Customers ({sortedCustomers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))}
                  </div>
                ) : sortedCustomers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      {searchQuery ? "No customers match your search" : "No customers yet"}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead
                            className="cursor-pointer select-none"
                            onClick={() => handleSort("created_at")}
                          >
                            <div className="flex items-center gap-1">
                              Joined {getSortIcon("created_at")}
                            </div>
                          </TableHead>
                          <TableHead
                            className="cursor-pointer select-none text-right"
                            onClick={() => handleSort("totalOrders")}
                          >
                            <div className="flex items-center justify-end gap-1">
                              Orders {getSortIcon("totalOrders")}
                            </div>
                          </TableHead>
                          <TableHead
                            className="cursor-pointer select-none text-right"
                            onClick={() => handleSort("totalSpent")}
                          >
                            <div className="flex items-center justify-end gap-1">
                              Total Spent {getSortIcon("totalSpent")}
                            </div>
                          </TableHead>
                          <TableHead className="text-right">Last Order</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedCustomers.map((customer) => (
                          <TableRow key={customer.id} className="hover:bg-muted/30">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  {customer.avatar_url ? (
                                    <img
                                      src={customer.avatar_url}
                                      alt={customer.full_name || ""}
                                      className="h-10 w-10 rounded-full object-cover"
                                    />
                                  ) : (
                                    <UserCircle className="h-6 w-6 text-primary" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {customer.full_name || "Anonymous"}
                                  </p>
                                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {customer.email}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {new Date(customer.created_at).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                variant={customer.totalOrders > 0 ? "default" : "secondary"}
                                className="font-mono"
                              >
                                {customer.totalOrders}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              ${customer.totalSpent.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">
                              {customer.lastOrderDate
                                ? new Date(customer.lastOrderDate).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })
                                : "Never"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default DashboardCustomers;
