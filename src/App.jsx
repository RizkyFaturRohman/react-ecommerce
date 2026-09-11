import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Header from './components/Header';
import Footer from './components/Footer';

// Halaman Toko Pembeli
import Home from './pages/Home';
import Shop from './pages/Shop';
import Collections from './pages/Collections';
import About from './pages/About';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Register from './pages/Register';
import Login from './pages/Login';
import OrderDetail from './pages/OrderDetail';
import AccountLayout from './components/AccountLayout';
import Checkout from './pages/Checkout';
import MyOrders from './pages/MyOrders';
import Wishlist from './pages/Wishlist';
import Invoice from './pages/Invoice';

// Halaman Toko Pembeli Profile
import Profile from './pages/account/Profile';
import Addresses from './pages/account/Adresses';
import Notifications from './pages/account/Notifications';

// Komponen Pembungkus
import CartProvider from './components/CartProvider';
import { AuthProvider } from './context/AuthContext'; 

// Halaman Dashboard Seller
import SellerProfile from './pages/seller/SellerProfile';
import SellerDashboard from './pages/seller/SellerDashboard';
import DashboardOverview from './pages/seller/DashboardOverview'; 
import Products from './pages/seller/Products'; 
import Orders from './pages/seller/Orders';
import Customers from './pages/seller/Customers';
import Analytics from './pages/seller/Analytics';
import SellerChat from './pages/seller/SellerChat';

function MainLayout() {
  const location = useLocation();
  
  // Deteksi Halaman Login/Register
  const isAuthPage = location.pathname === '/register' || location.pathname === '/login';
  
  // Deteksi JIKA URL saat ini adalah bagian dari Dashboard Seller
  const dashboardRoutes = ['/seller-dashboard', '/products', '/orders', '/customers', '/analytics', '/messages'];
  const isDashboardPage = dashboardRoutes.some(route => location.pathname.startsWith(route));

  const hideMainLayout = isAuthPage || isDashboardPage;

  return (
    <div className="font-sans antialiased text-primary flex flex-col min-h-screen">
      {!hideMainLayout && <Header />}
      
      <main className="flex-grow">
        <Routes>
          {/* --- RUTE TOKO UTAMA --- */}
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          
          {/* RUTE HALAMAN PUBLIK TOKO PENJUAL */}
          <Route path="/shop/:id" element={<SellerProfile />} />
          
          <Route path="/collections" element={<Collections />} />
          <Route path="/about" element={<About />} />            
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/invoice/:id" element={<Invoice />} />
          
          {/* --- RUTE DASHBOARD PEMBELI (MENGGUNAKAN ACCOUNT LAYOUT) --- */}
          <Route element={<AccountLayout />}>
            <Route path="/my-orders" element={<MyOrders />} />
            <Route path="/order-detail/:id" element={<OrderDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/account/profile" element={<Profile />} />
            <Route path="/account/addresses" element={<Addresses/>} />
            <Route path="/account/notifications" element={<Notifications/>} />
          </Route>

          {/* --- RUTE DASHBOARD SELLER --- */}
          <Route element={<SellerDashboard />}>
            <Route path="/seller-dashboard" element={<DashboardOverview />} />
            <Route path="/products/*" element={<Products />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/analytics" element={<Analytics />} />
            {/* PERBAIKAN: Rute disamakan menjadi /messages */}
            <Route path="/messages" element={<SellerChat />} />
          </Route>
          
        </Routes>
      </main>

      {!hideMainLayout && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <ScrollToTop />
          <MainLayout />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}