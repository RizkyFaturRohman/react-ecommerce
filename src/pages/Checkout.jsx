import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { formatRupiah } from '../currency';
import { FiMapPin, FiTruck, FiCreditCard, FiShield, FiArrowLeft, FiCheckCircle, FiX, FiPlus, FiTag } from 'react-icons/fi';
import Swal from 'sweetalert2';

export default function Checkout() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // === 1. STATE BUKU ALAMAT OTOMATIS ===
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(true);

  // === 2. STATE PENGIRIMAN & PEMBAYARAN ===
  const [shippingMethod, setShippingMethod] = useState('reguler');
  const [paymentMethod, setPaymentMethod] = useState('va_bca'); 
  const [useInsurance, setUseInsurance] = useState(true);

  // === 3. STATE VOUCHER DISKON ===
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [isCheckingVoucher, setIsCheckingVoucher] = useState(false);

  // === KALKULASI BIAYA TAMBAHAN ===
  const shippingCosts = { reguler: 25000, hemat: 15000, instant: 75000 };
  const insuranceCost = useInsurance ? 5000 : 0;
  const currentShippingFee = shippingCosts[shippingMethod];
  
  const voucherDiscount = appliedVoucher ? appliedVoucher.discount_amount : 0;
  const finalGrandTotal = Math.max(0, cartTotal + currentShippingFee + insuranceCost - voucherDiscount);

  // === AMBIL DATA ALAMAT ===
  useEffect(() => {
    const fetchAddresses = async () => {
      setIsLoadingAddress(true);
      try {
        const { data, error } = await supabase
          .from('user_addresses')
          .select('*')
          .eq('profile_id', user?.id)
          .order('is_main', { ascending: false })
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        if (data && data.length > 0) {
          setSavedAddresses(data);
          setSelectedAddress(data[0]); 
        }
      } catch (error) {
        console.error("Gagal mengambil alamat:", error);
      } finally {
        setIsLoadingAddress(false);
      }
    };

    if (user?.id) fetchAddresses();
  }, [user]);

  // === FUNGSI VALIDASI VOUCHER ===
  const handleApplyVoucher = async () => {
    if (!voucherCodeInput.trim()) return;
    setIsCheckingVoucher(true);
    
    try {
      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('code', voucherCodeInput.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (error || !data) {
        Swal.fire('Voucher Tidak Valid', 'Kode promo tidak ditemukan atau sudah tidak aktif.', 'error');
        setAppliedVoucher(null);
        return;
      }

      if (cartTotal < data.min_purchase) {
        Swal.fire('Belum Memenuhi Syarat', `Minimal belanja untuk voucher ini adalah ${formatRupiah(data.min_purchase)}.`, 'warning');
        setAppliedVoucher(null);
        return;
      }

      setAppliedVoucher(data);
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Voucher berhasil digunakan!', showConfirmButton: false, timer: 2000 });
    } catch (err) {
      console.error(err);
      Swal.fire('Terjadi Kesalahan', 'Gagal memvalidasi voucher.', 'error');
    } finally {
      setIsCheckingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCodeInput('');
  };

  // =========================================================
  // LOGIKA UTAMA: PROSES TRANSAKSI & POTONG STOK REAL-TIME
  // =========================================================
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    
    if (!selectedAddress) {
      Swal.fire('Alamat Kosong', 'Silakan tambah alamat pengiriman Anda terlebih dahulu.', 'warning');
      return;
    }
    if (cart.length === 0) {
      Swal.fire('Keranjang Kosong', 'Tidak ada barang untuk di-checkout.', 'error');
      return;
    }

    setIsSubmitting(true);
    Swal.fire({
      title: 'Memproses Pesanan...',
      text: 'Mengunci stok produk dan membuat invoice transaksi.',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    try {
      const groupedCart = cart.reduce((group, item) => {
        if (!group[item.seller_id]) group[item.seller_id] = [];
        group[item.seller_id].push(item);
        return group;
      }, {});

      let remainingDiscount = appliedVoucher ? appliedVoucher.discount_amount : 0;

      // ================= MULAI LOOP PER TOKO =================
      for (const sellerId of Object.keys(groupedCart)) {
        const sellerItems = groupedCart[sellerId];
        
        // PERBAIKAN: Gunakan quantity yang aman (Anti-NaN)
        const sellerSubtotal = sellerItems.reduce((acc, item) => {
          const qty = item.quantity || item.chosenQuantity || 1;
          return acc + (item.price * qty);
        }, 0);
        
        let currentDiscount = 0;
        if (remainingDiscount > 0) {
           currentDiscount = Math.min(sellerSubtotal, remainingDiscount);
           remainingDiscount -= currentDiscount;
        }

        const sellerTotalAmount = sellerSubtotal + currentShippingFee + insuranceCost - currentDiscount;

        // -----------------------------------------------------
        // SUB-SISTEM 1: PEMOTONGAN STOK REAL-TIME
        // -----------------------------------------------------
        for (const item of sellerItems) {
          const qty = item.quantity || item.chosenQuantity || 1; // Variabel quantity anti bocor

          const { data: prod, error: fetchErr } = await supabase
            .from('products')
            .select('stock, variations')
            .eq('id', item.id)
            .single();

          if (fetchErr || !prod) throw new Error(`Produk "${item.name}" gagal diverifikasi.`);

          let updatedGlobalStock = parseInt(prod.stock) || 0;
          let updatedVariations = prod.variations ? [...prod.variations] : [];

          if (item.chosenVariation) {
            const varIdx = updatedVariations.findIndex(v => v.name === item.chosenVariation);
            if (varIdx === -1) throw new Error(`Varian ${item.chosenVariation} tidak ditemukan.`);
            
            if (parseInt(updatedVariations[varIdx].stock) < qty) {
              throw new Error(`Stok varian "${item.chosenVariation}" untuk ${item.name} habis.`);
            }
            updatedVariations[varIdx].stock = parseInt(updatedVariations[varIdx].stock) - qty;
            updatedGlobalStock = Math.max(0, updatedGlobalStock - qty);
          } else {
            if (updatedGlobalStock < qty) {
              throw new Error(`Stok produk "${item.name}" tidak mencukupi.`);
            }
            updatedGlobalStock -= qty;
          }

          // KUNCI PERBAIKAN: .select() wajib dipanggil untuk mendeteksi pemblokiran RLS
          const { data: updateData, error: updateErr } = await supabase
            .from('products')
            .update({ stock: updatedGlobalStock, variations: updatedVariations })
            .eq('id', item.id)
            .select(); 

          if (updateErr) throw new Error(`Gagal mengamankan stok untuk ${item.name}.`);
          
          if (!updateData || updateData.length === 0) {
            throw new Error(`Keamanan Supabase (RLS) menolak pemotongan stok. Jalankan SQL Bypass di Supabase Anda terlebih dahulu!`);
          }
        }

        // -----------------------------------------------------
        // SUB-SISTEM 2: PENERBITAN NOTA PESANAN
        // -----------------------------------------------------
        const { data: newOrder, error: orderErr } = await supabase
          .from('orders')
          .insert([{
            buyer_id: user?.id,
            seller_id: sellerId,
            items: sellerItems, 
            total_amount: sellerTotalAmount,
            status: 'Pending',
            customer_name: selectedAddress.receiver_name, 
            phone_number: selectedAddress.phone,          
            shipping_address: `${selectedAddress.full_address}, ${selectedAddress.city}, ${selectedAddress.postal_code}`,
            payment_method: paymentMethod
          }])
          .select(); 

        if (orderErr) throw orderErr;

        // -----------------------------------------------------
        // SUB-SISTEM 3: KIRIM NOTIFIKASI KE PEMBELI & PENJUAL
        // -----------------------------------------------------
        if (newOrder && newOrder.length > 0) {
          const shortOrderId = newOrder[0].id.split('-')[0].toUpperCase();
          const payText = paymentMethod === 'va_bca' ? 'BCA Virtual Account' : paymentMethod === 'gopay' ? 'GoPay / QRIS' : 'COD';
          
          // 1. Notif Pembeli
          await supabase.from('notifications').insert([{
            profile_id: user?.id, title: 'Pesanan Dibuat 🛒',
            description: `Pesanan #${shortOrderId} berhasil dibuat. Selesaikan pembayaran menggunakan ${payText}.`,
            type: 'order', is_unread: true
          }]);
          
          // 2. Notif Penjual
          if (sellerId && sellerId !== 'undefined' && sellerId !== 'null') {
            await supabase.from('notifications').insert([{
              profile_id: sellerId, title: 'Pesanan Baru Masuk! 🎉',
              description: `Hore! Ada pesanan baru #${shortOrderId} yang menunggu untuk diproses.`,
              type: 'order', is_unread: true
            }]);
          }
        }
      } 
      // ================= AKHIR LOOP PER TOKO =================

      clearCart(); 
      Swal.fire({
        title: 'Checkout Berhasil!',
        text: 'Pesanan Anda telah diteruskan ke penjual dan stok berhasil dikurangi.',
        icon: 'success',
        confirmButtonColor: '#10b981'
      }).then(() => {
        navigate('/my-orders'); 
      });

    } catch (err) {
      console.error(err);
      Swal.fire('Transaksi Gagal', err.message || err.description, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-20 relative">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        <button onClick={() => navigate('/cart')} className="flex items-center gap-2 text-gray-400 hover:text-primary text-xs font-bold uppercase tracking-widest mb-10 transition-colors">
          <FiArrowLeft /> Kembali ke Keranjang
        </button>

        <h1 className="text-3xl md:text-4xl font-serif text-primary mb-12">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* KOLOM KIRI */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* ALAMAT PENGIRIMAN */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-repeating-linear-gradient"></div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 mt-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                  <FiMapPin className="text-emerald-500" /> Alamat Pengiriman
                </h2>
                {savedAddresses.length > 0 && (
                  <button 
                    onClick={() => setIsAddressModalOpen(true)}
                    className="text-xs font-bold text-gray-500 hover:text-primary border border-gray-200 hover:border-gray-300 px-4 py-2 rounded-xl transition-colors"
                  >
                    Pilih Alamat Lain
                  </button>
                )}
              </div>

              {isLoadingAddress ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : selectedAddress ? (
                <div className="bg-slate-50 border border-gray-100 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-bold text-primary text-base">{selectedAddress.receiver_name}</p>
                    <span className="text-gray-400 font-medium text-sm">({selectedAddress.phone})</span>
                    {selectedAddress.is_main && (
                      <span className="ml-2 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">Utama</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
                    {selectedAddress.full_address}, {selectedAddress.city}, {selectedAddress.postal_code}
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-2xl">
                  <p className="text-sm text-gray-500 mb-4">Anda belum memiliki alamat pengiriman.</p>
                  <Link to="/account/addresses" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase hover:bg-accent transition-colors">
                    <FiPlus /> Tambah Alamat Sekarang
                  </Link>
                </div>
              )}
            </div>

            {/* METODE PENGIRIMAN */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-primary mb-6 flex items-center gap-2">
                <FiTruck className="text-blue-500" /> Metode Pengiriman
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 'reguler', title: 'Reguler', desc: '2-3 Hari Kerja', price: 25000 },
                  { id: 'hemat', title: 'Hemat', desc: '4-6 Hari Kerja', price: 15000 },
                  { id: 'instant', title: 'Instant Courier', desc: '3 Jam Tiba', price: 75000 }
                ].map((method) => (
                  <button
                    key={method.id} type="button" onClick={() => setShippingMethod(method.id)}
                    className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${shippingMethod === method.id ? 'border-primary bg-slate-50 shadow-sm ring-1 ring-primary' : 'border-gray-100 bg-white hover:border-gray-300 hover:bg-slate-50/50'}`}
                  >
                    <div>
                      <p className={`text-sm font-bold ${shippingMethod === method.id ? 'text-primary' : 'text-gray-700'}`}>{method.title}</p>
                      <p className="text-xs text-gray-400 mt-1">{method.desc}</p>
                    </div>
                    <p className="text-sm font-bold text-emerald-600 mt-4">{formatRupiah(method.price)}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* METODE PEMBAYARAN */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-primary mb-6 flex items-center gap-2">
                <FiCreditCard className="text-purple-500" /> Metode Pembayaran
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 'va_bca', title: 'BCA Virtual Account' },
                  { id: 'gopay', title: 'GoPay / QRIS' },
                  { id: 'cod', title: 'Cash On Delivery (COD)' }
                ].map((pay) => (
                  <button
                    key={pay.id} type="button" onClick={() => setPaymentMethod(pay.id)}
                    className={`p-4 rounded-xl border text-center md:text-left text-sm font-bold transition-all cursor-pointer flex items-center justify-center md:justify-start ${paymentMethod === pay.id ? 'border-primary bg-slate-50 shadow-sm text-primary ring-1 ring-primary' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-300 hover:bg-slate-50/50'}`}
                  >
                    {pay.title}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* KOLOM KANAN: RINGKASAN INVOICE & TOMBOL BAYAR */}
          <div className="lg:col-span-5 space-y-6 sticky top-28">
            <div className="bg-white border border-gray-100 shadow-sm p-6 md:p-8 rounded-3xl">
              <h3 className="text-lg font-serif text-primary mb-6 border-b border-gray-100 pb-4">Ringkasan Pesanan</h3>
              
              {/* VOUCHER */}
              <div className="mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <label className="text-xs font-bold uppercase tracking-wider text-primary mb-3 flex items-center gap-2">
                  <FiTag className="text-amber-500"/> Kode Voucher Diskon
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={voucherCodeInput}
                    onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                    placeholder="Masukkan kode..."
                    disabled={appliedVoucher !== null}
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold tracking-wider uppercase focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-gray-100 disabled:text-gray-400 transition-all"
                  />
                  {appliedVoucher ? (
                    <button onClick={handleRemoveVoucher} className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-xs font-bold uppercase hover:bg-red-100 transition-colors cursor-pointer">Batal</button>
                  ) : (
                    <button onClick={handleApplyVoucher} disabled={isCheckingVoucher || !voucherCodeInput.trim()} className="bg-primary text-white px-5 py-3 rounded-xl text-xs font-bold uppercase hover:bg-accent disabled:opacity-50 transition-colors cursor-pointer">
                      {isCheckingVoucher ? 'Cek...' : 'Terapkan'}
                    </button>
                  )}
                </div>
                {appliedVoucher && (
                  <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1"><FiCheckCircle/> Voucher {appliedVoucher.code} berhasil digunakan!</p>
                )}
              </div>

              {/* ASURANSI TOGGLE */}
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 mb-6 hover:border-gray-200 transition-colors">
                <div className="flex items-start gap-2">
                  <FiShield size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-primary">Asuransi Pengiriman</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Proteksi penuh kehilangan & kerusakan</p>
                  </div>
                </div>
                <input type="checkbox" checked={useInsurance} onChange={(e) => setUseInsurance(e.target.checked)} className="w-5 h-5 accent-primary cursor-pointer rounded border-gray-300" />
              </div>

              {/* RINCIAN NOTA */}
              <div className="space-y-4 text-sm text-gray-500 mb-6 border-b border-gray-100 pb-6">
                <div className="flex justify-between">
                  <span>Total Harga ({cart.reduce((sum, item) => sum + (item.quantity || item.chosenQuantity || 1), 0)} Barang)</span>
                  <span className="font-medium text-primary">{formatRupiah(cartTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ongkos Kirim</span>
                  <span className="font-medium text-primary">{formatRupiah(currentShippingFee)}</span>
                </div>
                {useInsurance && (
                  <div className="flex justify-between">
                    <span>Biaya Asuransi</span>
                    <span className="font-medium text-primary">{formatRupiah(insuranceCost)}</span>
                  </div>
                )}
                {appliedVoucher && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Diskon Voucher ({appliedVoucher.code})</span>
                    <span>- {formatRupiah(voucherDiscount)}</span>
                  </div>
                )}
              </div>
              
              {/* GRAND TOTAL */}
              <div className="flex justify-between text-primary font-bold text-xl mb-8 items-end">
                <span className="text-sm uppercase tracking-wider">Total Tagihan</span>
                <span className="text-2xl text-emerald-600">{formatRupiah(finalGrandTotal)}</span>
              </div>
              
              <button 
                onClick={handlePlaceOrder}
                disabled={isSubmitting || !selectedAddress}
                className="w-full bg-primary text-white py-4 uppercase tracking-widest text-xs font-bold hover:bg-accent transition-colors duration-300 shadow-elegant rounded-xl flex justify-center items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <FiCheckCircle /> {isSubmitting ? 'Memproses...' : 'Bayar Sekarang'}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL POP-UP: PILIH ALAMAT LAIN */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAddressModalOpen(false)}></div>
          
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl z-10 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-base font-bold text-primary">Pilih Alamat Pengiriman</h3>
              <button onClick={() => setIsAddressModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors bg-white rounded-full p-1.5 border border-gray-200 cursor-pointer">
                <FiX size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 bg-white custom-scrollbar">
              {savedAddresses.map(addr => (
                <div 
                  key={addr.id}
                  onClick={() => {
                    setSelectedAddress(addr);
                    setIsAddressModalOpen(false);
                  }}
                  className={`border rounded-2xl p-5 cursor-pointer transition-all ${selectedAddress?.id === addr.id ? 'border-primary bg-primary/[0.02] shadow-sm ring-1 ring-primary' : 'border-gray-100 hover:border-gray-300'}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-slate-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md">{addr.label}</span>
                    {addr.is_main && (
                      <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">Utama</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-primary text-sm">{addr.receiver_name}</p>
                    <span className="text-gray-500 font-medium text-xs">{addr.phone}</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {addr.full_address}, {addr.city}, {addr.postal_code}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-5 border-t border-gray-100 bg-slate-50 text-center">
              <Link to="/account/addresses" className="text-sm font-bold text-primary hover:text-accent transition-colors flex items-center justify-center gap-2 cursor-pointer">
                <FiPlus /> Kelola / Tambah Alamat Baru
              </Link>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .bg-repeating-linear-gradient {
          background-image: repeating-linear-gradient(45deg, #10b981 0, #10b981 10px, transparent 10px, transparent 20px, #3b82f6 20px, #3b82f6 30px, transparent 30px, transparent 40px);
          opacity: 0.5;
        }
      `}</style>
    </div>
  );
}