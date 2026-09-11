import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { formatRupiah } from '../currency';
import { FiPackage, FiClock, FiTruck, FiCheckCircle, FiShoppingBag, FiAlertCircle, FiCheck, FiChevronRight, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

export default function MyOrders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Semua');
  
  // STATE BARU: Untuk melacak pesanan mana yang sedang di-expand (dibuka)
  const [expandedOrders, setExpandedOrders] = useState({});

  const tabs = [
    { id: 'Semua', label: 'Semua' },
    { id: 'Pending', label: 'Belum Bayar' },
    { id: 'Processing', label: 'Sedang Dikemas' },
    { id: 'Shipped', label: 'Dikirim' },
    { id: 'Completed', label: 'Selesai' }
  ];

  useEffect(() => {
    const fetchMyOrders = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('buyer_id', user?.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (error) {
        console.error("Error fetching my orders:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) fetchMyOrders();
  }, [user]);

  const getSafeItems = (itemsData) => {
    if (!itemsData) return [];
    if (typeof itemsData === 'string') {
      try { return JSON.parse(itemsData); } 
      catch (err) { console.error(err); return []; }
    }
    return itemsData;
  };

  const handleCompleteOrder = async (orderId) => {
    Swal.fire({
      title: 'Pesanan Diterima?',
      text: "Pastikan barang yang Anda terima sudah sesuai. Dana akan diteruskan ke penjual.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Ya, Selesai!',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const { data, error } = await supabase
            .from('orders')
            .update({ status: 'Completed' })
            .eq('id', orderId)
            .select();

          if (error) throw error;
          if (!data || data.length === 0) throw new Error("Akses ditolak oleh Database.");

          // --- PERBAIKAN: KIRIM NOTIFIKASI PESANAN SELESAI ---
          await supabase.from('notifications').insert([{
              profile_id: user?.id,
              title: 'Pesanan Selesai 🎉',
              description: `Pesanan #${orderId.split('-')[0].toUpperCase()} telah Anda konfirmasi. Terima kasih telah berbelanja di MYSTORE!`,
              type: 'order',
              is_unread: true
          }]);

          setOrders(orders.map(order => order.id === orderId ? { ...order, status: 'Completed' } : order));
          Swal.fire('Berhasil!', 'Terima kasih telah berbelanja.', 'success');
        } catch (error) {
          Swal.fire('Gagal', error.message, 'error');
        }
      }
    });
  };

  const handleComplain = () => {
    Swal.fire('Pusat Bantuan', 'Silakan hubungi WhatsApp Penjual untuk kendala pesanan Anda.', 'info');
  };

  const toggleExpand = (e, orderId) => {
    e.stopPropagation(); 
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const StatusBadge = ({ status }) => {
    switch (status) {
      case 'Pending': return <span className="text-amber-600 font-bold flex items-center gap-1.5 uppercase text-[10px] tracking-wider"><FiClock size={14} /> Belum Bayar</span>;
      case 'Processing': return <span className="text-blue-600 font-bold flex items-center gap-1.5 uppercase text-[10px] tracking-wider"><FiPackage size={14} /> Sedang Dikemas</span>;
      case 'Shipped': return <span className="text-purple-600 font-bold flex items-center gap-1.5 uppercase text-[10px] tracking-wider"><FiTruck size={14} /> Sedang Dikirim</span>;
      case 'Completed': return <span className="text-emerald-600 font-bold flex items-center gap-1.5 uppercase text-[10px] tracking-wider"><FiCheckCircle size={14} /> Selesai</span>;
      default: return <span className="text-gray-600 font-bold uppercase text-[10px] tracking-wider">{status}</span>;
    }
  };

  const filteredOrders = orders.filter(order => activeTab === 'Semua' ? true : order.status === activeTab);

  return (
    <div className="w-full animate-fade-in">
      
      {/* TABS MENU */}
      <div className="flex border-b border-gray-200 mb-8 overflow-x-auto custom-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-4 text-sm font-bold border-b-2 whitespace-nowrap px-4 transition-colors duration-300 ${
              activeTab === tab.id 
                ? 'border-primary text-primary' 
                : 'border-transparent text-gray-400 hover:text-primary hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
      ) : filteredOrders.length > 0 ? (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const items = getSafeItems(order.items);
            const firstItem = items[0]; 
            const itemImage = firstItem?.chosenImage || firstItem?.image || (firstItem?.image_urls && firstItem?.image_urls[0]) || 'https://via.placeholder.com/150';
            const isExpanded = expandedOrders[order.id]; 

            return (
              <div key={order.id} className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all bg-white flex flex-col">
                
                {/* HEADER KARTU */}
                <div className="bg-slate-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <FiShoppingBag className="text-primary" size={16} />
                    <span className="text-xs font-bold text-primary tracking-wide">Toko Partner</span>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                {/* BODY KARTU */}
                <div className="p-6 cursor-pointer hover:bg-slate-50/50 transition-colors" onClick={() => navigate(`/order-detail/${order.id}`)}>
                  
                  {/* BARANG PERTAMA */}
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
                    <div className="w-24 h-24 bg-white rounded-xl overflow-hidden shrink-0 border border-gray-200 p-1 shadow-sm">
                      <img src={itemImage} alt={firstItem?.name} className="w-full h-full object-contain hover:scale-105 transition-transform duration-500" />
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="text-base font-bold text-primary mb-1">{firstItem?.name}</h4>
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {firstItem?.chosenVariation && <p className="text-xs text-gray-500">Varian: <span className="font-medium text-gray-700">{firstItem.chosenVariation}</span></p>}
                        {firstItem?.chosenColor && <p className="text-xs text-gray-500">Warna: <span className="font-medium text-gray-700">{firstItem.chosenColor}</span></p>}
                      </div>
                      <p className="text-xs font-medium text-gray-400 mt-2">Kuantitas: {firstItem?.quantity || firstItem?.chosenQuantity || 1}x</p>
                    </div>

                    <div className="text-left md:text-right w-full md:w-auto mt-2 md:mt-0">
                      <p className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg inline-block border border-emerald-100">
                        {formatRupiah(firstItem?.price || 0)}
                      </p>
                    </div>
                  </div>

                  {/* BARANG TAMBAHAN JIKA DI-EXPAND */}
                  {isExpanded && items.length > 1 && (
                    <div className="mt-5 space-y-4 border-t border-gray-100 pt-5">
                      {items.slice(1).map((item, idx) => {
                        const img = item?.chosenImage || item?.image || (item?.image_urls && item?.image_urls[0]) || 'https://via.placeholder.com/150';
                        return (
                          <div key={idx} className="flex flex-col md:flex-row items-start md:items-center gap-5 pl-0 md:pl-4">
                            <div className="w-20 h-20 bg-white rounded-xl overflow-hidden shrink-0 border border-gray-200 p-1 shadow-sm">
                              <img src={img} alt={item?.name} className="w-full h-full object-contain" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-bold text-primary mb-1">{item?.name}</h4>
                              <div className="flex flex-wrap gap-x-4 gap-y-1">
                                {item?.chosenVariation && <p className="text-xs text-gray-500">Varian: <span className="font-medium text-gray-700">{item.chosenVariation}</span></p>}
                                {item?.chosenColor && <p className="text-xs text-gray-500">Warna: <span className="font-medium text-gray-700">{item.chosenColor}</span></p>}
                              </div>
                              <p className="text-xs font-medium text-gray-400 mt-1">Kuantitas: {item?.quantity || item?.chosenQuantity || 1}x</p>
                            </div>
                            <div className="text-left md:text-right w-full md:w-auto mt-2 md:mt-0">
                              <p className="text-xs font-bold text-emerald-600">
                                {formatRupiah(item?.price || 0)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* TOMBOL EXPAND/COLLAPSE */}
                  {items.length > 1 && (
                    <div 
                      className="mt-5 pt-3 border-t border-dashed border-gray-200 flex justify-center"
                      onClick={(e) => toggleExpand(e, order.id)}
                    >
                      <button className="flex items-center gap-1 text-xs text-gray-400 font-bold hover:text-primary transition-colors py-1">
                        {isExpanded ? (
                          <><FiChevronUp size={16} /> Sembunyikan produk</>
                        ) : (
                          <><FiChevronDown size={16} /> Tampilkan {items.length - 1} produk lainnya</>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* FOOTER KARTU */}
                <div className="bg-white px-6 py-4 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
                    <span className="text-sm text-gray-500 font-medium">Total Pesanan:</span>
                    <span className="text-xl font-bold text-primary">{formatRupiah(order.total_amount)}</span>
                  </div>

                  <div className="flex gap-3 w-full md:w-auto justify-end">
                    {order.status === 'Shipped' && (
                      <>
                        <button onClick={handleComplain} className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-colors">
                          Ajukan Komplain
                        </button>
                        <button onClick={() => handleCompleteOrder(order.id)} className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 shadow-sm transition-colors flex items-center gap-2">
                          <FiCheck size={14} /> Pesanan Diterima
                        </button>
                      </>
                    )}
                    <button onClick={() => navigate(`/order-detail/${order.id}`)} className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-accent shadow-elegant transition-colors flex items-center gap-2">
                      Rincian <FiChevronRight size={14} />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-24 text-center flex flex-col items-center bg-slate-50/50 rounded-3xl border border-dashed border-gray-200">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
            <FiShoppingBag size={32} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-400">Belum Ada Pesanan</h3>
          <p className="text-sm text-gray-400 mt-1">Tidak ada pesanan di kategori ini.</p>
        </div>
      )}
    </div>
  );
}