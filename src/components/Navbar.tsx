import { ShoppingCart, Menu, X, LogOut, Heart, LayoutDashboard, ChevronDown, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/trendycart-logo.png";
import { CartSidebar } from "@/components/CartSidebar";
import NotificationBell from "@/components/NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import SearchAutocomplete from "@/components/SearchAutocomplete";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (user) {
      loadCartCount();
      loadProfile();
      
      const handleCartUpdate = () => loadCartCount();
      const handleAvatarUpdate = (e: CustomEvent) => setAvatarUrl(e.detail.avatarUrl);
      
      window.addEventListener("cartUpdated", handleCartUpdate);
      window.addEventListener("avatarUpdated", handleAvatarUpdate as EventListener);
      
      return () => {
        window.removeEventListener("cartUpdated", handleCartUpdate);
        window.removeEventListener("avatarUpdated", handleAvatarUpdate as EventListener);
      };
    } else {
      setCartCount(0);
      setAvatarUrl(null);
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url, full_name")
        .eq("id", user?.id)
        .maybeSingle();
      if (data) {
        setAvatarUrl(data.avatar_url);
        setFullName(data.full_name || "");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const loadCartCount = async () => {
    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select("quantity");

      if (error) throw error;

      const total = data?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      setCartCount(total);
    } catch (error) {
      console.error("Error loading cart count:", error);
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U";
  };

  const navLinks = [
    { name: t("nav.home"), path: "/" },
    { name: t("nav.shop"), path: "/shop" },
    { name: t("nav.about"), path: "/about" },
    { name: t("nav.contact"), path: "/contact" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav 
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        isScrolled 
          ? "bg-background/95 backdrop-blur-xl shadow-sm border-b border-border/50" 
          : "bg-background/80 backdrop-blur-md"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-18">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <img src={logo} alt="TrendyCart" className="h-9 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive(link.path)
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {link.name}
              </Link>
            ))}
            {user && (
              <Link
                to="/user-dashboard"
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive("/user-dashboard")
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {t("nav.dashboard")}
              </Link>
            )}
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            {user && <NotificationBell />}
            
            {/* Cart Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative hover:bg-muted/50" 
              onClick={() => setCartOpen(true)}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-scale-in">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="gap-2 px-2 hover:bg-muted/50"
                  >
                    <Avatar className="h-8 w-8 ring-2 ring-border">
                      {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                        {getInitials(fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{fullName || "User"}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/user-dashboard")} className="cursor-pointer">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    {t("nav.myDashboard")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/wishlist")} className="cursor-pointer">
                    <Heart className="mr-2 h-4 w-4" />
                    {t("nav.myWishlist")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCartOpen(true)} className="cursor-pointer">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {t("nav.myCart")}
                    {cartCount > 0 && (
                      <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {cartCount}
                      </span>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("nav.signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild size="sm" className="hidden sm:inline-flex shadow-sm">
                <Link to="/auth">{t("nav.signIn")}</Link>
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden hover:bg-muted/50"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div 
          className={cn(
            "lg:hidden overflow-hidden transition-all duration-300 ease-out",
            isMenuOpen ? "max-h-96 opacity-100 pb-4" : "max-h-0 opacity-0"
          )}
        >
          <div className="flex flex-col gap-1 pt-2 border-t border-border/50">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive(link.path)
                    ? "text-primary bg-primary/10"
                    : "text-foreground hover:bg-muted/50"
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            {user && (
              <Link
                to="/user-dashboard"
                className={cn(
                  "px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive("/user-dashboard")
                    ? "text-primary bg-primary/10"
                    : "text-foreground hover:bg-muted/50"
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                {t("nav.dashboard")}
              </Link>
            )}
            {!user && (
              <Link
                to="/auth"
                className="px-4 py-3 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {t("nav.signIn")}
              </Link>
            )}
          </div>
        </div>
      </div>

      <CartSidebar open={cartOpen} onOpenChange={setCartOpen} />
    </nav>
  );
};

export default Navbar;
