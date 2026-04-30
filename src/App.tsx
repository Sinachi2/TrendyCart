import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { LanguageProvider } from "@/hooks/useLanguage";
import { ProductCompareProvider } from "@/contexts/ProductCompareContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import ProductCompareBar from "@/components/ProductCompareBar";
import ChatWidget from "@/components/ChatWidget";
import BackToTop from "@/components/BackToTop";
import MobileBottomNav from "@/components/MobileBottomNav";
import ExitIntentPopup from "@/components/ExitIntentPopup";

// Eagerly load Home (most common landing) for fast first paint
import Home from "./pages/Home";

// Code-split all other routes to shrink the main bundle
const Shop = lazy(() => import("./pages/Shop"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DashboardProducts = lazy(() => import("./pages/DashboardProducts"));
const DashboardOrders = lazy(() => import("./pages/DashboardOrders"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Orders = lazy(() => import("./pages/Orders"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const Profile = lazy(() => import("./pages/Profile"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Auth = lazy(() => import("./pages/Auth"));
const UserDashboard = lazy(() => import("./pages/UserDashboard"));
const DashboardUserOrders = lazy(() => import("./pages/DashboardUserOrders"));
const DashboardUserPayments = lazy(() => import("./pages/DashboardUserPayments"));
const DashboardNotifications = lazy(() => import("./pages/DashboardNotifications"));
const DashboardUserProfile = lazy(() => import("./pages/DashboardUserProfile"));
const Compare = lazy(() => import("./pages/Compare"));
const DashboardCoupons = lazy(() => import("./pages/DashboardCoupons"));
const SharedWishlist = lazy(() => import("./pages/SharedWishlist"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const ViewOrders = lazy(() => import("./pages/ViewOrders"));
const DashboardCustomers = lazy(() => import("./pages/DashboardCustomers"));
const DashboardAnalytics = lazy(() => import("./pages/DashboardAnalytics"));
const DashboardPayments = lazy(() => import("./pages/DashboardPayments"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="h-10 w-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  </div>
);

const App = () => (
  <ThemeProvider defaultTheme="light" storageKey="trendycart-ui-theme">
    <LanguageProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CurrencyProvider>
        <ProductCompareProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/wishlist/shared/:userId" element={<SharedWishlist />} />
              <Route path="/user-dashboard" element={<UserDashboard />} />
              <Route path="/user-dashboard/orders" element={<DashboardUserOrders />} />
              <Route path="/user-dashboard/payments" element={<DashboardUserPayments />} />
              <Route path="/user-dashboard/notifications" element={<DashboardNotifications />} />
              <Route path="/user-dashboard/profile" element={<DashboardUserProfile />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/products" element={<DashboardProducts />} />
              <Route path="/dashboard/orders" element={<DashboardOrders />} />
              <Route path="/dashboard/payments" element={<DashboardPayments />} />
              <Route path="/dashboard/coupons" element={<DashboardCoupons />} />
              <Route path="/dashboard/customers" element={<DashboardCustomers />} />
              <Route path="/dashboard/analytics" element={<DashboardAnalytics />} />
              <Route path="/edit-profile" element={<EditProfile />} />
              <Route path="/view-orders" element={<ViewOrders />} />
              <Route path="/auth" element={<Auth />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
            <ProductCompareBar />
            <ChatWidget />
            <BackToTop />
            <MobileBottomNav />
            <ExitIntentPopup />
          </BrowserRouter>
        </ProductCompareProvider>
        </CurrencyProvider>
      </TooltipProvider>
    </QueryClientProvider>
    </LanguageProvider>
  </ThemeProvider>
);

export default App;
