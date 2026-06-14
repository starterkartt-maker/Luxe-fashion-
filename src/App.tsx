/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Shop } from "./pages/Shop";
import { ProductDetails } from "./pages/ProductDetails";
import { AuthPage } from "./pages/Auth";
import { ProfilePage } from "./pages/Profile";
import { CartPage } from "./pages/Cart";
import { CheckoutPage } from "./pages/Checkout";
import { CheckoutSuccessPage } from "./pages/CheckoutSuccess";
import { WishlistPage } from "./pages/Wishlist";
import { AnimatedPage } from "./components/AnimatedPage";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<AnimatedPage><Home /></AnimatedPage>} />
            <Route path="shop" element={<AnimatedPage><Shop /></AnimatedPage>} />
            <Route path="product/:id" element={<AnimatedPage><ProductDetails /></AnimatedPage>} />
            <Route path="auth" element={<AnimatedPage><AuthPage /></AnimatedPage>} />
            <Route path="profile" element={<AnimatedPage><ProfilePage /></AnimatedPage>} />
            <Route path="cart" element={<AnimatedPage><CartPage /></AnimatedPage>} />
            <Route path="checkout" element={<AnimatedPage><CheckoutPage /></AnimatedPage>} />
            <Route path="checkout/success" element={<AnimatedPage><CheckoutSuccessPage /></AnimatedPage>} />
            <Route path="wishlist" element={<AnimatedPage><WishlistPage /></AnimatedPage>} />
            
            {/* Catch-all for categories/collections which map to shop */}
            <Route path="categories/:id" element={<AnimatedPage><Shop /></AnimatedPage>} />
            <Route path="collections/:id" element={<AnimatedPage><Shop /></AnimatedPage>} />
            
            <Route path="*" element={<AnimatedPage><div className="container mx-auto p-20 text-center font-editorial text-2xl">Page Coming Soon</div></AnimatedPage>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
