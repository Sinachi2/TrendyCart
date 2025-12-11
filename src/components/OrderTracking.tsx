import { useEffect, useState } from "react";
import { Package, Truck, CheckCircle, Clock, MapPin, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface OrderTrackingProps {
  orderId: string;
  status: string;
  trackingNumber?: string | null;
  carrier?: string | null;
  estimatedDelivery?: string | null;
  trackingUrl?: string | null;
}

const statusSteps = [
  { key: "pending", label: "Order Placed", icon: Clock },
  { key: "processing", label: "Processing", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle },
];

export const OrderTracking = ({
  orderId,
  status: initialStatus,
  trackingNumber: initialTracking,
  carrier: initialCarrier,
  estimatedDelivery: initialEstimated,
  trackingUrl: initialUrl,
}: OrderTrackingProps) => {
  const [status, setStatus] = useState(initialStatus);
  const [trackingNumber, setTrackingNumber] = useState(initialTracking);
  const [carrier, setCarrier] = useState(initialCarrier);
  const [estimatedDelivery, setEstimatedDelivery] = useState(initialEstimated);
  const [trackingUrl, setTrackingUrl] = useState(initialUrl);

  useEffect(() => {
    // Subscribe to real-time updates
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const updated = payload.new as any;
          setStatus(updated.status);
          setTrackingNumber(updated.tracking_number);
          setCarrier(updated.carrier);
          setEstimatedDelivery(updated.estimated_delivery);
          setTrackingUrl(updated.tracking_url);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const currentStepIndex = statusSteps.findIndex((s) => s.key === status);
  const isCancelled = status === "cancelled";

  const getStatusColor = (stepIndex: number) => {
    if (isCancelled) return "bg-destructive/20 text-destructive";
    if (stepIndex < currentStepIndex) return "bg-emerald-500 text-white";
    if (stepIndex === currentStepIndex) return "bg-primary text-primary-foreground";
    return "bg-muted text-muted-foreground";
  };

  const getLineColor = (stepIndex: number) => {
    if (isCancelled) return "bg-destructive/30";
    if (stepIndex < currentStepIndex) return "bg-emerald-500";
    return "bg-muted";
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Truck className="h-5 w-5 text-primary" />
            Order Tracking
          </CardTitle>
          {isCancelled && (
            <Badge variant="destructive">Cancelled</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Steps */}
        <div className="relative">
          <div className="flex justify-between">
            {statusSteps.map((step, index) => {
              const StepIcon = step.icon;
              return (
                <div key={step.key} className="flex flex-col items-center relative z-10">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${getStatusColor(index)}`}
                  >
                    <StepIcon className="h-5 w-5" />
                  </div>
                  <span className="text-xs mt-2 text-center text-muted-foreground">
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Progress Line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted -translate-y-1/2 flex">
            {statusSteps.slice(0, -1).map((_, index) => (
              <div
                key={index}
                className={`flex-1 h-full transition-all ${getLineColor(index)}`}
              />
            ))}
          </div>
        </div>

        {/* Tracking Details */}
        {(trackingNumber || carrier || estimatedDelivery) && (
          <div className="bg-muted/30 rounded-xl p-4 space-y-3">
            {carrier && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Carrier</span>
                <span className="font-medium">{carrier}</span>
              </div>
            )}
            {trackingNumber && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tracking Number</span>
                <span className="font-mono font-medium">{trackingNumber}</span>
              </div>
            )}
            {estimatedDelivery && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Estimated Delivery</span>
                <span className="font-medium">
                  {new Date(estimatedDelivery).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
            {trackingUrl && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2 rounded-xl gap-2"
                onClick={() => window.open(trackingUrl, "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
                Track with {carrier || "Carrier"}
              </Button>
            )}
          </div>
        )}

        {/* Status Message */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
          <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {status === "pending" && "Your order has been received and is being prepared."}
              {status === "processing" && "Your order is being processed and will ship soon."}
              {status === "shipped" && "Your order is on its way! Track it using the link above."}
              {status === "delivered" && "Your order has been delivered. Enjoy!"}
              {status === "cancelled" && "This order has been cancelled."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
