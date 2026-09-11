import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { FiGrid, FiBox, FiShoppingCart, FiUsers, FiBarChart2, FiSearch, FiBell, FiChevronRight, FiMenu, FiX, FiMessageCircle } from 'react-icons/fi';
import { supabase } from '../../supabaseClient';
import Swal from 'sweetalert2';

export default function SellerDashboard() {
  const { user, profile, logout } = useAuth(); 
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  
  const [pendingCount, setPendingCount] = useState(0);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const firstName = profile?.full_name?.split(' ')[0] || 'Seller';
  const shopName = profile?.shop_name || 'My Store';
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  // FETCH DATA & RADAR REAL-TIME
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user?.id) return;
      const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('seller_id', user.id).eq('status', 'Pending');
      if (orderCount !== null) setPendingCount(orderCount);

      const { count: notifCount } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('profile_id', user.id).eq('is_unread', true);
      if (notifCount !== null) setUnreadNotifCount(notifCount);
    };
    fetchInitialData();
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    const subscription = supabase
      .channel('seller-dashboard-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders', filter: `seller_id=eq.${user.id}` }, 
        () => setPendingCount((prev) => prev + 1)
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `profile_id=eq.${user.id}` }, 
        (payload) => {
          setUnreadNotifCount((prev) => prev + 1);
          Swal.fire({
            toast: true, position: 'top-end', icon: 'info',
            title: payload.new.title, text: payload.new.description,
            showConfirmButton: false, timer: 5000
          });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    if (e.target.value.trim() !== '') navigate('/products');
  };

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans overflow-hidden selection:bg-primary selection:text-white relative">
      
      {/* OVERLAY HITAM TRANSPARAN UNTUK MOBILE */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-white border-r border-slate-100 flex flex-col justify-between transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
        <div>
          <div className="h-24 flex items-center justify-between px-8 border-b md:border-b-0 border-slate-50 bg-slate-50/30 md:bg-transparent">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary text-white rounded-xl flex items-center justify-center font-serif font-bold text-xl mr-3 shadow-lg shadow-primary/30">M</div>
              <span className="font-serif text-xl tracking-widest text-slate-800">MYSTORE.</span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-slate-400 hover:text-red-500 bg-white border border-slate-200 rounded-full shadow-sm cursor-pointer">
              <FiX size={18}/>
            </button>
          </div>

          <nav className="px-5 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Dashboard Menu</p>
            {[
              { id: 'overview', path: '/seller-dashboard', icon: FiGrid, label: 'Overview', exact: true },
              { id: 'products', path: '/products', icon: FiBox, label: 'Products' },
              { id: 'orders', path: '/orders', icon: FiShoppingCart, label: 'Orders', badge: pendingCount > 0 ? pendingCount : null },
              
              // ==========================================
              // INI DIA MENU MESSAGES YANG BARU DITAMBAHKAN
              // ==========================================
              { id: 'messages', path: '/messages', icon: FiMessageCircle, label: 'Messages' }, 
              
              { id: 'customers', path: '/customers', icon: FiUsers, label: 'Customers' },
              { id: 'analytics', path: '/analytics', icon: FiBarChart2, label: 'Analytics' },
            ].map((item) => {
              const isActive = item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);

              return (
                <button
                  key={item.id}
                  onClick={() => { navigate(item.path); setSearchQuery(''); }}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 text-sm font-bold group ${
                    isActive ? 'bg-slate-900 text-white shadow-md hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={18} className={isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-500 transition-colors'} /> 
                    {item.label}
                  </div>
                  {item.badge && <span className={`text-[10px] py-1 px-2.5 rounded-full font-bold ${isActive ? 'bg-emerald-500 text-white' : 'bg-rose-100 text-rose-600'}`}>{item.badge}</span>}
                </button>
              )
            })}
          </nav>
        </div>
        
        <div className="p-6 bg-slate-50 md:bg-transparent mt-auto shrink-0">
          <div className="p-4 bg-white md:bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3 mb-4 group hover:bg-slate-100 transition-colors cursor-pointer shadow-sm md:shadow-none" onClick={() => navigate('/profile')}>
            <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-primary font-bold shadow-sm uppercase shrink-0 overflow-hidden">
              {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : firstName.charAt(0)}
            </div>
            <div className="flex flex-col overflow-hidden flex-1">
              <span className="text-sm font-bold text-slate-800 truncate">{shopName}</span>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider truncate">{profile?.role || 'Seller'}</span>
            </div>
            <FiChevronRight className="text-slate-400 group-hover:text-slate-600" />
          </div>
          <button onClick={handleLogout} className="w-full text-xs font-bold text-red-500 bg-white border border-red-100 md:border-none md:bg-transparent md:text-slate-400 hover:text-red-600 md:hover:bg-red-50 rounded-xl py-3 transition-colors shadow-sm md:shadow-none">Logout Account</button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen relative min-w-0">
        
        {/* HEADER ATAS */}
        <header className="h-20 md:h-24 bg-white md:bg-[#f8fafc]/80 md:backdrop-blur-md flex items-center justify-between px-5 md:px-10 shrink-0 sticky top-0 z-10 border-b md:border-none border-slate-100">
          
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2.5 bg-slate-50 text-slate-800 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors shadow-sm cursor-pointer">
               <FiMenu size={20}/>
            </button>
            <h1 className="text-lg md:text-xl font-bold text-slate-800 hidden sm:block">{today}</h1>
          </div>

          <div className="flex justify-end items-center gap-3 md:gap-5">
            <div className="relative w-full max-w-xs hidden lg:block">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" value={searchQuery} onChange={handleSearch} placeholder="Search products..." className="pl-11 pr-4 py-2.5 w-full bg-white border border-slate-100 rounded-full text-sm font-medium focus:ring-2 focus:ring-primary/20 shadow-sm outline-none transition-all" />
            </div>

            <button onClick={() => navigate('/account/notifications')} className="relative p-2.5 bg-slate-50 md:bg-white border border-slate-100 md:border-slate-200 rounded-full text-slate-500 hover:text-primary shadow-sm hover:shadow transition-all cursor-pointer">
              <FiBell size={20} />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold border-2 border-white animate-bounce">
                  {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                </span>
              )}
            </button>

            <div className="h-8 w-px bg-slate-200 hidden md:block"></div>

            <Link to={`/shop/${user?.id}`} className="text-[10px] md:text-xs font-bold uppercase md:capitalize text-white bg-slate-900 md:bg-primary px-4 md:px-6 py-2.5 rounded-xl md:rounded-full hover:bg-slate-800 shadow-md transition-all">
              View Store
            </Link>
          </div>
        </header>

        {/* AREA KONTEN DINAMIS */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 pt-4 md:pt-0 custom-scrollbar bg-slate-50 md:bg-transparent">
          <Outlet context={{ searchQuery }} />
        </div>
      </main>
    </div>
  );
}