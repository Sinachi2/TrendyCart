import { useState } from "react";
import { Clock, Zap, X, Calendar, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DealManagementProps {
  productId: string;
  productName: string;
  currentPrice: number;
  originalPrice: number | null;
  isActive: boolean;
  expiresAt: string | null;
  onUpdate: () => void;
}

const DealManagement = ({
  productId,
  productName,
  currentPrice,
  originalPrice,
  isActive,
  expiresAt,
  onUpdate,
}: DealManagementProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dealType, setDealType] = useState<string>("custom");
  const [customDate, setCustomDate] = useState("");
  const [customTime, setCustomTime] = useState("");
  const [salePrice, setSalePrice] = useState(currentPrice.toString());

  const quickDealOptions = [
    { label: "24 Hours", value: "24h", hours: 24 },
    { label: "48 Hours", value: "48h", hours: 48 },
    { label: "3 Days", value: "3d", hours: 72 },
    { label: "1 Week", value: "1w", hours: 168 },
    { label: "Custom", value: "custom", hours: 0 },
  ];

  const calculateExpirationDate = (): string | null => {
    if (dealType === "custom") {
      if (!customDate || !customTime) return null;
      return new Date(`${customDate}T${customTime}`).toISOString();
    }

    const option = quickDealOptions.find((o) => o.value === dealType);
    if (!option) return null;

    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + option.hours);
    return expirationDate.toISOString();
  };

  const handleStartDeal = async () => {
    const expirationDate = calculateExpirationDate();
    if (!expirationDate) {
      toast({
        title: "Invalid date",
        description: "Please select a valid expiration date",
        variant: "destructive",
      });
      return;
    }

    const newPrice = parseFloat(salePrice);
    if (isNaN(newPrice) || newPrice <= 0) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid sale price",
        variant: "destructive",
      });
      return;
    }

    if (newPrice >= (originalPrice || currentPrice)) {
      toast({
        title: "Invalid sale price",
        description: "Sale price must be less than the original price",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("products")
        .update({
          price: newPrice,
          original_price: originalPrice || currentPrice,
          is_deal_active: true,
          deal_expires_at: expirationDate,
        })
        .eq("id", productId);

      if (error) throw error;

      toast({
        title: "Deal started!",
        description: `${productName} is now on sale`,
      });
      setOpen(false);
      onUpdate();
    } catch (error) {
      console.error("Error starting deal:", error);
      toast({
        title: "Error",
        description: "Failed to start deal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEndDeal = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("products")
        .update({
          price: originalPrice || currentPrice,
          original_price: null,
          is_deal_active: false,
          deal_expires_at: null,
        })
        .eq("id", productId);

      if (error) throw error;

      toast({
        title: "Deal ended",
        description: `${productName} is back to regular price`,
      });
      onUpdate();
    } catch (error) {
      console.error("Error ending deal:", error);
      toast({
        title: "Error",
        description: "Failed to end deal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isActive) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 px-2 py-1 bg-destructive/10 text-destructive rounded text-xs font-medium">
          <Clock className="h-3 w-3" />
          Deal Active
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleEndDeal}
          disabled={loading}
        >
          <X className="h-3 w-3 mr-1" />
          End Deal
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Zap className="h-3 w-3 mr-1" />
          Start Deal
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start Limited-Time Deal</DialogTitle>
          <DialogDescription>
            Set up a limited-time offer for {productName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-xs">Current Price</Label>
              <p className="text-lg font-semibold">${currentPrice.toFixed(2)}</p>
            </div>
            <div>
              <Label htmlFor="salePrice">Sale Price</Label>
              <Input
                id="salePrice"
                type="number"
                step="0.01"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="Enter sale price"
              />
            </div>
          </div>

          {parseFloat(salePrice) < currentPrice && (
            <Alert className="bg-green-50 dark:bg-green-950 border-green-200">
              <AlertTriangle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                {Math.round(((currentPrice - parseFloat(salePrice)) / currentPrice) * 100)}% discount
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label>Deal Duration</Label>
            <Select value={dealType} onValueChange={setDealType}>
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                {quickDealOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {dealType === "custom" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customDate">End Date</Label>
                <Input
                  id="customDate"
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div>
                <Label htmlFor="customTime">End Time</Label>
                <Input
                  id="customTime"
                  type="time"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStartDeal} disabled={loading}>
              <Zap className="h-4 w-4 mr-2" />
              {loading ? "Starting..." : "Start Deal"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DealManagement;
