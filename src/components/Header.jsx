import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiSearch, FiUser, FiShoppingBag, FiLogOut, FiSettings, FiPackage, FiHeart, FiBell, FiMenu, FiX, FiChevronRight, FiGrid } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import Swal from 'sweetalert2';

export default function Header() {
  const { cartCount } = useCart();
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); 
  
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchBadgeCounts = async () => {
      if (!user?.id) {
        setUnreadNotifCount(0);
        setWishlistCount(0);
        return;
      }
      try {
        const { count: notifCount } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('profile_id', user.id).eq('is_unread', true);
        if (notifCount !== null) setUnreadNotifCount(notifCount);

        const { count: wishCount } = await supabase.from('wishlists').select('*', { count: 'exact', head: true }).eq('profile_id', user.id);
        if (wishCount !== null) setWishlistCount(wishCount);
      } catch (error) {
        console.error("Gagal mengambil data badge:", error);
      }
    };
    fetchBadgeCounts();
  }, [user, location.pathname]); 

  // RADAR NOTIFIKASI REAL-TIME
  useEffect(() => {
    if (!user?.id) return;
    const notifSubscription = supabase
      .channel('realtime-notif-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `profile_id=eq.${user.id}` },
        (payload) => {
          setUnreadNotifCount((prev) => prev + 1);
          Swal.fire({
            toast: true, position: 'top-end', icon: 'info',
            title: payload.new.title, text: payload.new.description,
            showConfirmButton: false, timer: 5000, timerProgressBar: true,
            didOpen: (toast) => {
              toast.addEventListener('mouseenter', Swal.stopTimer)
              toast.addEventListener('mouseleave', Swal.resumeTimer)
            }
          });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(notifSubscription);
  }, [user?.id]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false); 
  }, [location]);

  // ==========================================
  // PERBAIKAN: FUNGSI LOGOUT DENGAN SWEETALERT
  // ==========================================
  const handleLogout = () => {
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    
    Swal.fire({
      title: 'Keluar Akun?',
      text: "Anda harus login kembali untuk melakukan transaksi.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#10B981', // Warna emerald primary
      cancelButtonColor: '#ef4444',  // Warna merah
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Batal',
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        await logout();
        navigate('/login');
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Berhasil Keluar', showConfirmButton: false, timer: 1500 });
      }
    });
  };

  // Cek apakah user adalah seller (Mendukung bahasa indo 'penjual' atau inggris 'seller')
  const isUserSeller = profile?.role === 'seller' || profile?.role === 'penjual';
  const firstName = profile?.full_name?.split(' ')[0] || 'User';

  return (
    <header className="py-6 px-6 md:px-12 flex items-center justify-between bg-surface sticky top-0 z-50 border-b border-gray-100 shadow-sm relative">
      
      {/* KIRI: Hamburger Menu (Mobile) & Navigasi (Desktop) */}
      <div className="flex items-center gap-4 w-1/3">
        <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-primary p-2 -ml-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer">
          <FiMenu size={24} />
        </button>
        <nav className="hidden md:flex gap-8 text-xs uppercase tracking-widest font-medium text-primary">
          <Link to="/" className="hover:text-accent transition-colors">Home</Link>
          <Link to="/shop" className="hover:text-accent transition-colors">Shop</Link>
          <Link to="/about" className="hover:text-accent transition-colors">About</Link>
          
          {/* PERBAIKAN: Kondisi pengecekan Role Penjual */}
          {isUserSeller && (
            <Link to="/seller-dashboard" className="text-accent hover:text-primary transition-colors font-bold ml-4">Seller Dashboard</Link>
          )}
        </nav>
      </div>

      {/* TENGAH: Logo */}
      <div className="w-1/3 flex justify-center">
        <Link to="/" className="font-serif text-2xl md:text-3xl tracking-widest text-primary font-bold">
          MYSTORE.
        </Link>
      </div>

      {/* KANAN: Ikon & Profil */}
      <div className="flex items-center justify-end gap-4 md:gap-5 text-primary w-1/3">
        <FiSearch className="hover:text-accent transition-colors cursor-pointer hidden md:block" size={20} />

        {user && (
          <Link to="/wishlist" className="relative hover:text-accent transition-colors hidden sm:block">
            <FiHeart size={20} />
            {wishlistCount > 0 && <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold shadow-sm border border-white">{wishlistCount > 99 ? '99+' : wishlistCount}</span>}
          </Link>
        )}

        {user && (
          <Link to="/account/notifications" className="relative hover:text-accent transition-colors">
            <FiBell size={20} />
            {unreadNotifCount > 0 && <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold shadow-sm border border-white animate-bounce">{unreadNotifCount > 99 ? '99+' : unreadNotifCount}</span>}
          </Link>
        )}

        <Link to="/cart" className="relative hover:text-accent transition-colors md:mr-2">
          <FiShoppingBag size={20} />
          {cartCount > 0 && <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold shadow-sm border border-white">{cartCount > 99 ? '99+' : cartCount}</span>}
        </Link>

        <div className="h-6 w-px bg-gray-200 hidden md:block"></div>

        {user ? (
          <div className="relative hidden md:block" ref={dropdownRef}>
            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 hover:text-accent transition-all focus:outline-none cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-gray-200 overflow-hidden shadow-sm">
                {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <FiUser size={18} className="text-gray-500" />}
              </div>
              <span className="text-xs font-bold uppercase tracking-widest hidden lg:block">{firstName}</span>
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-4 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 animate-fade-in overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50 bg-slate-50/50">
                  <p className="text-sm font-bold text-primary truncate">{profile?.full_name}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-tighter truncate mt-0.5">{user.email}</p>
                </div>
                <div className="py-2">
                  <Link to="/profile" className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-slate-50 hover:text-primary transition-colors"><FiSettings size={16} /> Edit Profile</Link>
                  <Link to="/my-orders" className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-slate-50 hover:text-primary transition-colors"><FiPackage size={16} /> Pesanan Saya</Link>
                </div>
                <div className="border-t border-gray-50 pt-2 pb-1">
                  <button onClick={handleLogout} className="flex items-center gap-3 px-5 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 w-full text-left transition-colors cursor-pointer"><FiLogOut size={16} /> Logout Keluar</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" className="hover:text-accent transition-colors hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-widest cursor-pointer">
            <FiUser size={20} /> <span>Login</span>
          </Link>
        )}
      </div>

      {/* ========================================= */}
      {/* AREA MOBILE DRAWER MENU (HANYA UNTUK HP) */}
      {/* ========================================= */}
      <div className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 md:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} onClick={() => setIsMobileMenuOpen(false)}></div>
      
      <div className={`fixed inset-y-0 left-0 w-[85%] max-w-sm bg-white z-50 md:hidden transform transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-2xl flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <Link to="/" className="text-xl font-serif font-bold tracking-widest text-primary flex items-center gap-2">MYSTORE.</Link>
          <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-red-500 p-2 bg-white border border-slate-200 rounded-full shadow-sm transition-colors cursor-pointer"><FiX size={20} /></button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
          <form className="relative mb-8" onSubmit={(e) => { e.preventDefault(); }}>
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Cari produk..." className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-primary/30 outline-none shadow-inner transition-all" />
          </form>
          
          <nav className="flex flex-col gap-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">Menu Navigasi</p>
            {['Home', 'Shop', 'Collections', 'About'].map(item => (
              <Link key={item} to={item === 'Home' ? '/' : `/${item.toLowerCase()}`} className="text-sm font-bold uppercase tracking-widest text-slate-600 hover:text-primary hover:bg-slate-50 px-4 py-3.5 rounded-2xl flex items-center justify-between transition-colors">
                {item} <FiChevronRight size={16} className="text-slate-300" />
              </Link>
            ))}
          </nav>

          {user && (
            <div className="mt-8 pt-8 border-t border-slate-100">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">Akun Saya</p>
               <div className="flex items-center gap-3 px-4 mb-6">
                 <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 overflow-hidden"><img src={profile?.avatar_url || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" /></div>
                 <div>
                   <p className="font-bold text-primary text-sm">{profile?.full_name}</p>
                   <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                 </div>
               </div>
               <Link to="/profile" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:text-primary hover:bg-slate-50 rounded-2xl transition-colors"><FiSettings className="text-slate-400"/> Edit Profil</Link>
               <Link to="/my-orders" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:text-primary hover:bg-slate-50 rounded-2xl transition-colors"><FiPackage className="text-slate-400"/> Pesanan Saya</Link>
               <Link to="/wishlist" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:text-primary hover:bg-slate-50 rounded-2xl transition-colors">
                  <FiHeart className="text-slate-400"/> Wishlist Favorit <span className="ml-auto bg-primary text-white text-[10px] px-2 py-0.5 rounded-full">{wishlistCount}</span>
               </Link>
               
               {/* PERBAIKAN: Kondisi pengecekan Role Penjual */}
               {isUserSeller && (
                 <Link to="/seller-dashboard" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 rounded-2xl transition-colors mt-2"><FiGrid className="text-emerald-500"/> Buka Dashboard Toko</Link>
               )}
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-slate-100 bg-slate-50">
          {!user ? (
            <Link to="/login" className="w-full bg-primary text-white py-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center hover:bg-accent transition-colors">Login / Daftar</Link>
          ) : (
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-xs font-bold text-red-500 hover:bg-red-50 border border-red-100 uppercase tracking-widest py-4 rounded-xl transition-colors cursor-pointer shadow-sm">
              <FiLogOut size={16} /> Keluar Akun
            </button>
          )}
        </div>
      </div>
    </header>
  );
}