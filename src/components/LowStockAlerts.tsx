import { useEffect, useState } from "react";
import { AlertTriangle, Package, ExternalLink, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface LowStockProduct {
  id: string;
  name: string;
  stock_quantity: number;
  category: string;
  image_url: string | null;
}

interface LowStockAlertsProps {
  threshold?: number;
  limit?: number;
}

const LowStockAlerts = ({ threshold = 10, limit = 5 }: LowStockAlertsProps) => {
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingAlert, setSendingAlert] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadLowStockProducts();
  }, [threshold, limit]);

  const loadLowStockProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, stock_quantity, category, image_url")
        .lte("stock_quantity", threshold)
        .order("stock_quantity", { ascending: true })
        .limit(limit);

      if (error) throw error;
      setLowStockProducts(data || []);
    } catch (error) {
      console.error("Error loading low stock products:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendEmailAlert = async () => {
    setSendingAlert(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-notification", {
        body: { type: "low_stock", threshold },
      });

      if (error) throw error;

      toast({
        title: "Alert Sent!",
        description: data.message || "Low stock alert has been sent to admins.",
      });
    } catch (error) {
      console.error("Error sending alert:", error);
      toast({
        title: "Error",
        description: "Failed to send low stock alert.",
        variant: "destructive",
      });
    } finally {
      setSendingAlert(false);
    }
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: "Out of Stock", variant: "destructive" as const };
    if (quantity <= 3) return { label: "Critical", variant: "destructive" as const };
    if (quantity <= 5) return { label: "Very Low", variant: "secondary" as const };
    return { label: "Low", variant: "outline" as const };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Low Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (lowStockProducts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-green-500" />
            Stock Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground">All products are well-stocked! ✓</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 dark:border-amber-900">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Low Stock Alerts
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{lowStockProducts.length} items</Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={sendEmailAlert}
              disabled={sendingAlert}
              className="text-xs"
            >
              <Mail className="h-3 w-3 mr-1" />
              {sendingAlert ? "Sending..." : "Email Alert"}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {lowStockProducts.map((product) => {
            const status = getStockStatus(product.stock_quantity);
            return (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm line-clamp-1">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={status.variant}>{status.label}: {product.stock_quantity}</Badge>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-border">
          <Button asChild variant="outline" className="w-full" size="sm">
            <Link to="/dashboard/products">
              Manage Inventory <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LowStockAlerts;
