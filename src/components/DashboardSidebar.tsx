import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  CreditCard,
  Bell,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Heart,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useState } from "react";
import logo from "@/assets/trendycart-logo.png";
import ThemeToggle from "@/components/ThemeToggle";

interface DashboardSidebarProps {
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/user-dashboard" },
  { icon: Package, label: "My Orders", path: "/user-dashboard/orders" },
  { icon: User, label: "Profile", path: "/user-dashboard/profile" },
  { icon: Heart, label: "Wishlist", path: "/wishlist" },
];

const DashboardSidebar = ({ collapsed = false, onCollapse }: DashboardSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const isActive = (path: string) => {
    if (path === "/user-dashboard") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 p-4 border-b border-border/50",
        collapsed && !isMobile && "justify-center"
      )}>
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="TrendyCart" className="h-8 w-auto" />
          {(!collapsed || isMobile) && (
            <span className="font-bold text-lg">TrendyCart</span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="px-2 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive(item.path)
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                collapsed && !isMobile && "justify-center px-2"
              )}
              title={collapsed && !isMobile ? item.label : undefined}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", collapsed && !isMobile && "h-5 w-5")} />
              {(!collapsed || isMobile) && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>
      </ScrollArea>

      {/* Bottom section */}
      <div className="p-4 border-t border-border/50 space-y-2">
        <Link
          to="/shop"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all",
            collapsed && !isMobile && "justify-center px-2"
          )}
          title={collapsed && !isMobile ? "Continue Shopping" : undefined}
        >
          <ShoppingBag className="h-5 w-5 shrink-0" />
          {(!collapsed || isMobile) && <span>Continue Shopping</span>}
        </Link>
        
        <Separator className="my-2" />
        
        <div className={cn(
          "flex items-center gap-2",
          collapsed && !isMobile ? "justify-center" : "justify-between"
        )}>
          {(!collapsed || isMobile) && <ThemeToggle />}
          <Button
            variant="ghost"
            size={collapsed && !isMobile ? "icon" : "sm"}
            onClick={handleSignOut}
            className={cn(
              "text-destructive hover:text-destructive hover:bg-destructive/10",
              collapsed && !isMobile ? "w-10 h-10" : "flex-1"
            )}
            title={collapsed && !isMobile ? "Sign Out" : undefined}
          >
            <LogOut className="h-4 w-4" />
            {(!collapsed || isMobile) && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </div>

      {/* Collapse toggle - desktop only */}
      {!isMobile && onCollapse && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onCollapse(!collapsed)}
          className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-border bg-background shadow-sm hover:bg-muted"
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-card border-r border-border relative transition-all duration-300",
          collapsed ? "w-[72px]" : "w-64"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed top-4 left-4 z-50 bg-background/80 backdrop-blur-sm shadow-sm border border-border"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72">
          <SidebarContent isMobile />
        </SheetContent>
      </Sheet>
    </>
  );
};

export default DashboardSidebar;
