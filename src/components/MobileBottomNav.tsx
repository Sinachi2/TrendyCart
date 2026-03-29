import { useState } from "react";
import { Home, Search, ShoppingCart, User, Grid3X3 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import CartSidebar from "@/components/CartSidebar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import SearchAutocomplete from "@/components/SearchAutocomplete";

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const items = [
    { icon: Home, label: "Home", path: "/", action: () => navigate("/") },
    { icon: Grid3X3, label: "Shop", path: "/shop", action: () => navigate("/shop") },
    { icon: Search, label: "Search", path: "__search__", action: () => setSearchOpen(true) },
    { icon: ShoppingCart, label: "Cart", path: "__cart__", action: () => setCartOpen(true) },
    { icon: User, label: "Profile", path: "/user-dashboard", action: () => navigate("/user-dashboard") },
  ];

  return (
    <>
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-background/95 backdrop-blur-md border-t border-border lg:hidden">
        <div className="flex items-center justify-around h-16">
          {items.map(({ icon: Icon, label, path, action }) => {
            const active = pathname === path;
            return (
              <button
                key={label}
                onClick={action}
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

      {/* Cart Sidebar */}
      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Search Sheet */}
      <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
        <SheetContent side="top" className="h-auto max-h-[80vh]">
          <SheetHeader>
            <SheetTitle>Search Products</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <SearchAutocomplete
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search for products..."
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default MobileBottomNav;
