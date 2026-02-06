import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { LanguageProvider } from "@/hooks/useLanguage";
import { ProductCompareProvider } from "@/contexts/ProductCompareContext";
import ProductCompareBar from "@/components/ProductCompareBar";
import ChatWidget from "@/components/ChatWidget";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Dashboard from "./pages/Dashboard";
import DashboardProducts from "./pages/DashboardProducts";
import DashboardOrders from "./pages/DashboardOrders";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderConfirmation from "./pages/OrderConfirmation";
import Profile from "./pages/Profile";
import Wishlist from "./pages/Wishlist";
import Auth from "./pages/Auth";
import UserDashboard from "./pages/UserDashboard";
import DashboardUserOrders from "./pages/DashboardUserOrders";
import DashboardUserPayments from "./pages/DashboardUserPayments";
import DashboardNotifications from "./pages/DashboardNotifications";
import DashboardUserProfile from "./pages/DashboardUserProfile";
import Compare from "./pages/Compare";
import DashboardCoupons from "./pages/DashboardCoupons";
import SharedWishlist from "./pages/SharedWishlist";
import EditProfile from "./pages/EditProfile";
import ViewOrders from "./pages/ViewOrders";
import DashboardCustomers from "./pages/DashboardCustomers";
import DashboardAnalytics from "./pages/DashboardAnalytics";
import DashboardPayments from "./pages/DashboardPayments";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="light" storageKey="trendycart-ui-theme">
    <LanguageProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ProductCompareProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
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
            <ProductCompareBar />
            <ChatWidget />
          </BrowserRouter>
        </ProductCompareProvider>
      </TooltipProvider>
    </QueryClientProvider>
    </LanguageProvider>
  </ThemeProvider>
);

export default App;
