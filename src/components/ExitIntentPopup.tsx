import { useEffect, useState } from "react";
import { X, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ExitIntentPopup = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const shown = sessionStorage.getItem("exit-intent-shown");
    if (shown) return;

    const handler = (e: MouseEvent) => {
      if (e.clientY <= 5) {
        setShow(true);
        sessionStorage.setItem("exit-intent-shown", "1");
        document.removeEventListener("mouseout", handler);
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener("mouseout", handler);
    }, 5000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseout", handler);
    };
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-card rounded-2xl shadow-elegant p-8 max-w-md w-full text-center animate-scale-in border border-border">
        <button
          onClick={() => setShow(false)}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Gift className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Wait! Don't Leave Yet</h3>
        <p className="text-muted-foreground mb-6">
          Get <span className="font-bold text-primary">10% OFF</span> your first order with code:
        </p>
        <div className="bg-muted rounded-lg py-3 px-6 inline-block mb-6">
          <code className="text-xl font-bold tracking-widest text-primary">WELCOME10</code>
        </div>
        <div className="space-y-3">
          <Button className="w-full" size="lg" onClick={() => setShow(false)}>
            Claim My Discount
          </Button>
          <button
            onClick={() => setShow(false)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            No thanks, I'll pay full price
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExitIntentPopup;
