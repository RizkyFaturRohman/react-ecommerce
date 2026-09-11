import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import { FiBell, FiPackage, FiPercent, FiCheckCircle, FiInfo } from 'react-icons/fi';
import Swal from 'sweetalert2';

export default function Notifications() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Semua');
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const tabs = [
    { id: 'Semua', label: 'Semua Notifikasi' },
    { id: 'Pesanan', label: 'Status Pesanan' },
    { id: 'Promo', label: 'Promo & Info' }
  ];

  // MENGAMBIL DATA NOTIFIKASI DARI SUPABASE
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('profile_id', user?.id)
        .order('created_at', { ascending: false }); // Yang paling baru di atas

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Gagal mengambil notifikasi:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) fetchNotifications();
  }, [user?.id, fetchNotifications]);

  // FUNGSI TANDAI SEMUA SUDAH DIBACA KE DATABASE
  const handleMarkAllRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_unread: false })
        .eq('profile_id', user?.id)
        .eq('is_unread', true); // Hanya update yang masih unread

      if (error) throw error;
      
      // Update UI seketika menggunakan prev state agar lebih aman
      setNotifications(prev => prev.map(notif => ({ ...notif, is_unread: false })));
      
      Swal.fire({
        toast: true, position: 'top-end', icon: 'success', title: 'Semua ditandai sudah dibaca', showConfirmButton: false, timer: 2000
      });
    } catch (error) {
      Swal.fire('Gagal Memperbarui', error.message, 'error');
    }
  };

  const filteredNotifs = notifications.filter(notif => activeTab === 'Semua' ? true : notif.type === activeTab);

  // Helper untuk menentukan Ikon berdasarkan tipe notifikasi
  const getIcon = (type) => {
    if (type === 'Pesanan') return <FiPackage className="text-blue-500" />;
    if (type === 'Promo') return <FiPercent className="text-amber-500" />;
    if (type === 'Sistem') return <FiCheckCircle className="text-emerald-500" />;
    return <FiInfo className="text-gray-500" />;
  };

  // Helper Format Tanggal
  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full animate-fade-in space-y-6">
      
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <h2 className="text-2xl font-serif text-primary">Notifikasi</h2>
          <p className="text-sm text-gray-400 mt-1">Dapatkan pembaruan terkini mengenai aktivitas belanja dan promo spesial.</p>
        </div>
        {notifications.some(n => n.is_unread) && (
          <button 
            onClick={handleMarkAllRead}
            className="text-xs font-bold text-primary hover:text-accent border border-gray-200 px-4 py-2.5 rounded-xl bg-white transition-colors shadow-sm"
          >
            Tandai Semua Sudah Dibaca
          </button>
        )}
      </div>

      {/* TABS FILTER */}
      <div className="flex gap-2 border-b border-gray-100 pb-1 overflow-x-auto custom-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 text-xs font-bold border-b-2 whitespace-nowrap px-4 transition-colors duration-300 ${
              activeTab === tab.id 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-400 hover:text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* DAFTAR NOTIFIKASI */}
      {isLoading ? (
        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
      ) : filteredNotifs.length > 0 ? (
        <div className="divide-y divide-gray-100">
          {filteredNotifs.map((notif) => (
            <div 
              key={notif.id} 
              className={`py-5 flex gap-5 items-start transition-colors relative rounded-xl px-2 ${
                notif.is_unread ? 'bg-primary/[0.02]' : ''
              }`}
            >
              {/* Bulatan Merah Indikator Unread */}
              {notif.is_unread && (
                <span className="absolute top-8 left-0 w-2 h-2 bg-red-500 rounded-full"></span>
              )}

              {/* Ikon Kategori Notifikasi */}
              <div className={`w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center shrink-0 text-xl ${notif.is_unread ? 'ml-4' : ''}`}>
                {getIcon(notif.type)}
              </div>

              {/* Teks Pesan */}
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start gap-4">
                  <h4 className={`text-sm ${notif.is_unread ? 'font-bold text-primary' : 'font-medium text-gray-700'}`}>
                    {notif.title}
                  </h4>
                  <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">{formatTime(notif.created_at)}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed max-w-3xl">
                  {notif.description}
                </p>
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-dashed border-gray-200">
            <FiBell size={24} className="text-gray-300" />
          </div>
          <h3 className="text-base font-bold text-gray-400">Belum Ada Notifikasi</h3>
          <p className="text-xs text-gray-400 mt-1">Seluruh kabar terbaru mengenai aktivitas belanjamu akan mendarat di sini.</p>
        </div>
      )}

    </div>
  );
}