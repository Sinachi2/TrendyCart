import { useCurrency } from "@/contexts/CurrencyContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Coins, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const LABELS: Record<"usd" | "ngn" | "both", string> = {
  usd: "USD ($)",
  ngn: "NGN (₦)",
  both: "USD + NGN",
};

const SHORT: Record<"usd" | "ngn" | "both", string> = {
  usd: "$",
  ngn: "₦",
  both: "$/₦",
};

const CurrencyToggle = () => {
  const { mode, setMode } = useCurrency();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-2.5 gap-1.5 hover:bg-muted/50 font-medium"
          aria-label="Change currency"
        >
          <Coins className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs sm:text-sm">{SHORT[mode]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-xs">Currency</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(["usd", "ngn", "both"] as const).map((m) => (
          <DropdownMenuItem
            key={m}
            onClick={() => setMode(m)}
            className="cursor-pointer flex items-center justify-between"
          >
            <span className={cn(mode === m && "font-semibold text-primary")}>
              {LABELS[m]}
            </span>
            {mode === m && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CurrencyToggle;