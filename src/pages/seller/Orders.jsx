import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { formatRupiah } from '../../currency';
import { 
  FiPackage, FiTruck, FiCheckCircle, FiClock, 
  FiArrowLeft, FiMapPin, FiCreditCard, FiUser, FiPhone, FiFileText, FiClipboard
} from 'react-icons/fi';
import Swal from 'sweetalert2';

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const fetchSellerOrders = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('seller_id', user?.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (error) {
        console.error('Gagal memuat pesanan:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) fetchSellerOrders();
  }, [user?.id]);

  // FUNGSI EKSEKUSI UPDATE KE DATABASE
  const executeStatusUpdate = async (order, newStatus, courier = null, trackingNumber = null) => {
    try {
      // 1. Siapkan data yang akan diupdate
      const updateData = { status: newStatus };
      if (courier) updateData.courier = courier.toUpperCase();
      if (trackingNumber) updateData.tracking_number = trackingNumber.toUpperCase();

      const { error } = await supabase.from('orders').update(updateData).eq('id', order.id);
      if (error) throw error;

      // 2. Kirim Notifikasi Lengkap dengan Resi (Jika ada)
      const shortOrderId = order.id.split('-')[0].toUpperCase();
      let notifTitle = '';
      let notifMessage = '';

      if (newStatus === 'Processing') {
        notifTitle = 'Pesanan Diproses 📦';
        notifMessage = `Hore! Penjual sedang menyiapkan pesanan #${shortOrderId} Anda.`;
      } else if (newStatus === 'Shipped') {
        notifTitle = 'Pesanan Dikirim 🚚';
        notifMessage = `Pesanan #${shortOrderId} telah dikirim via ${updateData.courier}. Nomor Resi: ${updateData.tracking_number}`;
      }

      if (notifTitle && order.buyer_id) {
        await supabase.from('notifications').insert([{
          profile_id: order.buyer_id,
          title: notifTitle,
          description: notifMessage,
          type: 'order',
          is_unread: true
        }]);
      }

      // 3. Update Tampilan (State)
      const updatedOrders = orders.map(o => o.id === order.id ? { ...o, ...updateData } : o);
      setOrders(updatedOrders);
      if (selectedOrder && selectedOrder.id === order.id) {
        setSelectedOrder({ ...selectedOrder, ...updateData });
      }
      
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: `Status menjadi ${newStatus}`, showConfirmButton: false, timer: 2000 });
    } catch (error) {
      Swal.fire('Gagal', error.message, 'error');
    }
  };

  // LOGIKA TOMBOL AKSI
  const handleUpdateStatus = async (order, newStatus) => {
    // Jika tombol yang ditekan adalah "KIRIM PESANAN"
    if (newStatus === 'Shipped') {
      const { value: formValues } = await Swal.fire({
        title: 'Masukkan Resi Pengiriman',
        html: `
          <div class="space-y-4 text-left mt-4">
            <div>
              <label class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nama Kurir Pengiriman</label>
              <input id="swal-input-courier" class="w-full border border-gray-200 rounded-xl px-4 py-3 mt-1 text-sm font-bold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none uppercase transition-all" placeholder="Misal: J&T, JNE, GOSEND">
            </div>
            <div>
              <label class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nomor Resi / Pelacakan</label>
              <input id="swal-input-resi" class="w-full border border-gray-200 rounded-xl px-4 py-3 mt-1 text-sm font-bold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none uppercase transition-all" placeholder="Masukkan nomor resi valid...">
            </div>
          </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Konfirmasi & Kirim',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#10b981', // emerald
        cancelButtonColor: '#ef4444', // red
        preConfirm: () => {
          const courier = document.getElementById('swal-input-courier').value.trim();
          const resi = document.getElementById('swal-input-resi').value.trim();
          if (!courier || !resi) {
            Swal.showValidationMessage('Nama Kurir dan Nomor Resi wajib diisi!');
          }
          return { courier, trackingNumber: resi };
        }
      });

      // Jika penjual mengisi resi dan menekan Konfirmasi
      if (formValues) {
        executeStatusUpdate(order, newStatus, formValues.courier, formValues.trackingNumber);
      }
      
    } else {
      // Jika tombol yang ditekan adalah "PROSES PESANAN" (Tanpa Input Resi)
      Swal.fire({
        title: 'Proses Pesanan?',
        text: "Pembeli akan otomatis mendapatkan notifikasi pesanan sedang disiapkan.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#252525',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Ya, Proses Sekarang'
      }).then((result) => {
        if (result.isConfirmed) {
          executeStatusUpdate(order, newStatus);
        }
      });
    }
  };

  const getSafeItems = (itemsData) => {
    if (!itemsData) return [];
    if (typeof itemsData === 'string') {
      try { return JSON.parse(itemsData); } catch { return []; }
    }
    return itemsData;
  };

  // Komponen Status Badge
  const StatusBadge = ({ status }) => {
    switch(status) {
      case 'Pending': return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-200"><FiClock /> Perlu Diproses</span>;
      case 'Processing': return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-200"><FiPackage /> Sedang Dikemas</span>;
      case 'Shipped': return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-600 border border-purple-200"><FiTruck /> Dikirim</span>;
      case 'Completed': return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200"><FiCheckCircle /> Selesai</span>;
      default: return null;
    }
  };

  // =====================================================================
  // RENDER 1: MODE DETAIL PESANAN
  // =====================================================================
  if (selectedOrder) {
    const items = getSafeItems(selectedOrder.items);
    const shortId = selectedOrder.id.split('-')[0].toUpperCase();
    
    return (
      <div className="space-y-6 animate-fade-in pb-10">
        <button 
          onClick={() => setSelectedOrder(null)}
          className="flex items-center gap-2 text-gray-500 hover:text-primary text-xs font-bold uppercase tracking-widest transition-colors mb-4"
        >
          <FiArrowLeft size={16} /> Kembali ke Daftar Pesanan
        </button>

        <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-10 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-50 pb-6 mb-8">
            <div>
              <h2 className="text-2xl font-serif text-primary flex items-center gap-3">Pesanan #{shortId}</h2>
              <p className="text-xs text-gray-400 mt-1.5 font-medium">
                Dibuat pada {new Date(selectedOrder.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <StatusBadge status={selectedOrder.status} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Kolom Kiri */}
            <div className="lg:col-span-5 space-y-8">
              
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <FiUser className="text-primary" /> Informasi Pembeli
                </h3>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3">
                  <p className="text-sm font-bold text-primary">{selectedOrder.customer_name}</p>
                  <p className="text-sm text-gray-600 flex items-center gap-2"><FiPhone className="text-gray-400" size={14}/> {selectedOrder.phone_number}</p>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <FiMapPin className="text-primary" /> Rincian Pengiriman
                </h3>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Alamat Tujuan</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{selectedOrder.shipping_address}</p>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Metode Pembayaran</p>
                    <div className="flex items-center gap-2 text-sm font-bold text-primary">
                      <FiCreditCard /> {selectedOrder.payment_method?.replace('_', ' ').toUpperCase() || 'TRANSFER'}
                    </div>
                  </div>
                </div>
              </div>

              {/* FITUR BARU: INFO LACAK RESI AKAN MUNCUL JIKA STATUS DIKIRIM/SELESAI */}
              {(selectedOrder.status === 'Shipped' || selectedOrder.status === 'Completed') && selectedOrder.tracking_number && (
                <div className="animate-fade-in">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <FiClipboard className="text-emerald-500" /> Pelacakan Logistik
                  </h3>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 space-y-3">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] text-emerald-600 font-bold uppercase">Kurir Pengiriman</p>
                      <p className="text-sm font-bold text-emerald-700">{selectedOrder.courier}</p>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-emerald-200/50">
                      <p className="text-[10px] text-emerald-600 font-bold uppercase">Nomor Resi / Lacak</p>
                      <p className="text-sm font-bold tracking-widest text-emerald-700 bg-emerald-100/50 px-3 py-1 rounded-lg border border-emerald-200">{selectedOrder.tracking_number}</p>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Kolom Kanan */}
            <div className="lg:col-span-7 space-y-8">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <FiFileText className="text-primary" /> Daftar Produk ({items.reduce((sum, i) => sum + (i.quantity || 1), 0)} Item)
                </h3>
                <div className="border border-gray-100 rounded-2xl overflow-hidden">
                  {items.map((item, idx) => (
                    <div key={idx} className={`p-4 flex gap-4 items-center ${idx !== items.length - 1 ? 'border-b border-gray-50' : ''}`}>
                      <img src={item.chosenImage || item.image || item.image_urls?.[0]} alt={item.name} className="w-16 h-16 object-contain bg-slate-50 rounded-xl border border-gray-100 p-1 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-primary line-clamp-2 leading-snug">{item.name}</p>
                        {(item.chosenVariation || item.chosenColor) && (
                          <div className="flex gap-2 mt-1.5">
                            {item.chosenVariation && <span className="bg-slate-100 text-gray-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{item.chosenVariation}</span>}
                            {item.chosenColor && <span className="bg-slate-100 text-gray-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{item.chosenColor}</span>}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-gray-500 mb-0.5">{item.quantity || item.chosenQuantity || 1} x {formatRupiah(item.price)}</p>
                        <p className="text-sm font-bold text-emerald-600">{formatRupiah(item.price * (item.quantity || item.chosenQuantity || 1))}</p>
                      </div>
                    </div>
                  ))}
                  
                  <div className="bg-slate-50 p-5 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Total Pendapatan</span>
                    <span className="text-2xl font-bold text-emerald-600">{formatRupiah(selectedOrder.total_amount)}</span>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS DINAMIS */}
              <div className="pt-4">
                {selectedOrder.status === 'Pending' && (
                  <button onClick={() => handleUpdateStatus(selectedOrder, 'Processing')} className="w-full bg-primary text-white py-4 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-accent transition-colors shadow-elegant flex justify-center items-center gap-2">
                    <FiPackage size={18} /> Konfirmasi & Proses Pesanan
                  </button>
                )}
                {selectedOrder.status === 'Processing' && (
                  <button onClick={() => handleUpdateStatus(selectedOrder, 'Shipped')} className="w-full bg-emerald-500 text-white py-4 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-emerald-600 transition-colors shadow-elegant flex justify-center items-center gap-2">
                    <FiTruck size={18} /> Masukkan Resi & Kirim Pesanan
                  </button>
                )}
                {selectedOrder.status === 'Shipped' && (
                  <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-center">
                    <p className="text-sm font-bold text-purple-700">Barang Sedang Dalam Perjalanan 🚚</p>
                    <p className="text-xs text-purple-600 mt-1">Pembeli bisa melacak pesanan dengan resi <span className="font-bold">{selectedOrder.tracking_number}</span></p>
                  </div>
                )}
                {selectedOrder.status === 'Completed' && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                    <p className="text-sm font-bold text-emerald-700 flex items-center justify-center gap-2"><FiCheckCircle size={18}/> Transaksi Selesai</p>
                    <p className="text-xs text-emerald-600 mt-1">Dana telah diteruskan ke saldo Anda.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================================
  // RENDER 2: MODE DAFTAR (LIST VIEW)
  // =====================================================================
  const filteredOrders = filter === 'All' ? orders : orders.filter(o => o.status === filter);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-primary">Manajemen Pesanan</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola dan pantau pesanan dari pelanggan Anda.</p>
        </div>

        <div className="flex overflow-x-auto custom-scrollbar gap-2 bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
          {['All', 'Pending', 'Processing', 'Shipped', 'Completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                filter === tab ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:bg-slate-50'
              }`}
            >
              {tab === 'All' ? 'Semua' : tab === 'Pending' ? 'Baru' : tab === 'Processing' ? 'Dikemas' : tab === 'Shipped' ? 'Dikirim' : 'Selesai'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <FiPackage size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-bold">Belum ada pesanan di kategori ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredOrders.map((order) => {
            const items = getSafeItems(order.items);
            return (
              <div key={order.id} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col lg:flex-row gap-6 hover:shadow-md transition-shadow">
                
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-start border-b border-gray-50 pb-4">
                    <div>
                      <p className="text-xs font-mono text-gray-400 mb-1">
                        #{order.id.split('-')[0].toUpperCase()}
                        {/* FITUR BARU: TAMPILKAN RESI DI DAFTAR JIKA SUDAH DIKIRIM */}
                        {order.tracking_number && (
                          <span className="ml-2 text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded uppercase">
                            Resi: {order.tracking_number}
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Pembeli</p>
                      <p className="text-sm font-bold text-primary">{order.customer_name}</p>
                      <p className="text-xs font-medium text-gray-500 mt-0.5">{order.shipping_address.split(',')[1] || order.shipping_address}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Pendapatan</p>
                      <p className="text-base font-bold text-emerald-600">{formatRupiah(order.total_amount)}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">{order.payment_method?.replace('_', ' ') || 'Transfer'}</p>
                    </div>
                  </div>
                </div>

                <div className="w-full lg:w-4/12 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex -space-x-3 overflow-hidden">
                      {items.slice(0, 3).map((item, idx) => (
                        <img key={idx} src={item.chosenImage || item.image || item.image_urls?.[0]} alt="Item" className="inline-block h-10 w-10 rounded-full ring-2 ring-white bg-slate-50 object-cover border border-gray-200" />
                      ))}
                    </div>
                    <p className="text-xs font-medium text-gray-500">
                      {items.length} Macam Barang
                    </p>
                  </div>

                  <button 
                    onClick={() => setSelectedOrder(order)}
                    className="w-full bg-slate-50 text-primary border border-gray-200 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-primary hover:text-white hover:border-primary transition-all flex justify-center items-center gap-2 cursor-pointer"
                  >
                    <FiFileText size={16} /> Lihat Detail Pesanan
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}