import { Home, Search, ShoppingCart, User, Grid3X3 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const items = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Grid3X3, label: "Shop", path: "/shop" },
  { icon: Search, label: "Search", path: "/shop?search=true" },
  { icon: ShoppingCart, label: "Cart", path: "/cart" },
  { icon: User, label: "Profile", path: "/profile" },
];

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur-md border-t border-border lg:hidden">
      <div className="flex items-center justify-around h-16">
        {items.map(({ icon: Icon, label, path }) => {
          const active = pathname === path || (path === "/" && pathname === "/");
          return (
            <button
              key={label}
              onClick={() => navigate(path)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
