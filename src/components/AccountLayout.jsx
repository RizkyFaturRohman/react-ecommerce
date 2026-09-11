import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMapPin, FiPackage, FiBell, FiLogOut } from 'react-icons/fi';
import Swal from 'sweetalert2';

export default function AccountLayout() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    Swal.fire({
      title: 'Keluar Akun?',
      text: "Anda harus login kembali untuk mengakses profil.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        await logout();
        navigate('/login');
      }
    });
  };

  const menuItems = [
    { name: 'Profil Saya', path: '/profile', icon: <FiUser size={18} /> },
    { name: 'Alamat Saya', path: '/account/addresses', icon: <FiMapPin size={18} /> },
    { name: 'Pesanan Saya', path: '/my-orders', icon: <FiPackage size={18} /> },
    { name: 'Notifikasi', path: '/account/notifications', icon: <FiBell size={18} /> },
  ];

  // Placeholder jika foto belum ada
  const fallbackInitial = profile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-surface pt-10 pb-20">
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row gap-10">
        
        {/* KIRI: SIDEBAR MENU */}
        <aside className="w-full md:w-72 shrink-0 space-y-8 animate-fade-in">
          
          {/* PROFILE CARD KECIL */}
          <div className="flex items-center gap-4 px-2">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border-2 border-white shadow-sm shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-primary">{fallbackInitial}</span>
              )}
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Akun Saya</p>
              <p className="text-sm font-serif font-bold text-primary line-clamp-1">
                {profile?.full_name || 'User Name'}
              </p>
            </div>
          </div>

          <div className="w-full h-px bg-gray-100"></div>

          {/* MENU NAVIGASI */}
          <nav className="flex flex-col space-y-2">
            {menuItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-primary text-white shadow-md'
                      : 'text-gray-500 hover:bg-slate-50 hover:text-primary'
                  }`
                }
              >
                {item.icon}
                {item.name}
              </NavLink>
            ))}
          </nav>

          <div className="w-full h-px bg-gray-100 mt-4 mb-2"></div>

          {/* TOMBOL LOGOUT */}
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3.5 w-full text-left rounded-2xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all duration-300"
          >
            <FiLogOut size={18} />
            Keluar Akun
          </button>
        </aside>

        {/* KANAN: KONTEN UTAMA (Tempat Profile.jsx dll di-render) */}
        <main className="flex-1">
          <Outlet />
        </main>
        
      </div>
    </div>
  );
}