import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatRupiah } from '../currency';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag, FiArrowLeft, FiBox, FiShield } from 'react-icons/fi';

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  // Efek simulasi loading skeleton agar transisi terasa mewah (premium feel)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800); // 0.8 detik skeleton loading
    return () => clearTimeout(timer);
  }, []);

  // Mengelompokkan barang berdasarkan ID Penjual & Mengambil Nama Asli Toko
  const groupedCart = cart.reduce((group, item) => {
    if (!group[item.seller_id]) {
      group[item.seller_id] = {
        sellerName: item.seller_name || `Toko Partner ${item.seller_id?.substring(0, 4).toUpperCase() || ''}`,
        items: []
      };
    }
    group[item.seller_id].items.push(item);
    return group;
  }, {});

  // ================= KOMPONEN SKELETON LOADING =================
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          {/* Skeleton Judul */}
          <div className="w-48 h-10 bg-slate-200 rounded-xl animate-pulse mb-12"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-8 space-y-6">
              {/* Skeleton Kartu Toko (Loop 2x) */}
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm space-y-6">
                  <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                    <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse"></div>
                    <div className="w-32 h-4 rounded-full bg-slate-200 animate-pulse"></div>
                  </div>
                  <div className="flex gap-6">
                    <div className="w-24 h-24 rounded-2xl bg-slate-200 animate-pulse shrink-0"></div>
                    <div className="flex-1 space-y-3">
                      <div className="w-3/4 h-5 rounded-full bg-slate-200 animate-pulse"></div>
                      <div className="w-1/2 h-4 rounded-full bg-slate-200 animate-pulse"></div>
                      <div className="w-1/4 h-6 rounded-full bg-slate-200 animate-pulse mt-4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Skeleton Ringkasan Harga */}
            <div className="lg:col-span-4 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6 sticky top-28">
              <div className="w-40 h-6 rounded-full bg-slate-200 animate-pulse mb-4"></div>
              <div className="w-full h-24 rounded-2xl bg-slate-100 animate-pulse"></div>
              <div className="flex justify-between">
                <div className="w-20 h-5 rounded-full bg-slate-200 animate-pulse"></div>
                <div className="w-32 h-6 rounded-full bg-slate-200 animate-pulse"></div>
              </div>
              <div className="w-full h-14 rounded-xl bg-slate-200 animate-pulse mt-4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================= UI UTAMA KERANJANG =================
  return (
    <div className="min-h-screen bg-surface pt-28 pb-20 animate-fade-in">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        <h1 className="text-4xl font-serif text-primary mb-12">Shopping Bag</h1>

        {cart.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-gray-300 mb-6 border border-gray-100">
              <FiShoppingBag size={40} />
            </div>
            <h2 className="text-xl font-bold text-primary mb-2">Keranjang Anda Kosong</h2>
            <p className="text-gray-500 mb-8 max-w-sm">Temukan berbagai produk gadget dan teknologi terbaik di toko kami.</p>
            <Link to="/shop" className="bg-primary text-white px-8 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-accent transition-colors shadow-elegant">
              Mulai Belanja
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start">
            
            {/* KOLOM DAFTAR BARANG */}
            <div className="lg:col-span-8 space-y-8">
              {Object.keys(groupedCart).map((sellerId) => {
                const sellerGroup = groupedCart[sellerId];
                
                return (
                  <div key={sellerId} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
                    {/* Header Nama Toko Penjual */}
                    <div className="bg-slate-50/50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-primary shadow-sm">
                        <FiBox size={14} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-primary capitalize">{sellerGroup.sellerName}</h3>
                        <p className="text-[10px] text-gray-400 font-mono">ID: {sellerId.substring(0, 8).toUpperCase()}</p>
                      </div>
                    </div>

                    {/* Daftar Item per Toko */}
                    <div className="p-6 md:p-8 space-y-8">
                      {sellerGroup.items.map((item) => (
                        <div key={`${item.id}-${item.chosenVariation}-${item.chosenColor}`} className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                          <div className="w-24 h-24 bg-white rounded-2xl border border-gray-200 p-2 shrink-0 shadow-sm">
                            <img src={item.chosenImage || item.image_urls?.[0]} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                          </div>
                          
                          <div className="flex-1 space-y-2 w-full">
                            <div className="flex justify-between items-start gap-4">
                              <h3 className="font-bold text-primary line-clamp-2 leading-snug">{item.name}</h3>
                              <p className="font-bold text-emerald-600 whitespace-nowrap">{formatRupiah(item.price)}</p>
                            </div>
                            
                            {(item.chosenVariation || item.chosenColor) && (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {item.chosenVariation && <span className="bg-slate-50 border border-gray-200 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{item.chosenVariation}</span>}
                                {item.chosenColor && <span className="bg-slate-50 border border-gray-200 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{item.chosenColor}</span>}
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-4 w-full">
                              <div className="flex items-center bg-slate-50 border border-gray-200 rounded-lg overflow-hidden h-9">
                                <button onClick={() => updateQuantity(item.id, item.chosenVariation, item.chosenColor, Math.max(1, item.quantity - 1))} className="w-9 h-full flex items-center justify-center text-gray-500 hover:text-primary hover:bg-gray-100 transition-colors"><FiMinus size={14}/></button>
                                <span className="w-10 text-center font-bold text-primary text-xs">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.id, item.chosenVariation, item.chosenColor, item.quantity + 1)} className="w-9 h-full flex items-center justify-center text-gray-500 hover:text-primary hover:bg-gray-100 transition-colors"><FiPlus size={14}/></button>
                              </div>
                              
                              <button onClick={() => removeFromCart(item.id, item.chosenVariation, item.chosenColor)} className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Hapus Barang">
                                <FiTrash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* KOLOM RINGKASAN HARGA */}
            <div className="lg:col-span-4 bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm sticky top-28">
              <h3 className="text-lg font-serif text-primary mb-6 border-b border-gray-100 pb-4">Ringkasan Belanja</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Total Harga Barang</span>
                  <span className="font-bold text-primary">{formatRupiah(cartTotal)}</span>
                </div>
              </div>

              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 mb-8 flex gap-3 items-start">
                <FiShield className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                <p className="text-[10px] text-emerald-700 leading-relaxed font-medium">Pengiriman, Asuransi, Diskon Voucher, dan Metode Pembayaran akan dipilih pada halaman Checkout selanjutnya.</p>
              </div>

              <div className="flex justify-between items-end mb-8 pt-4 border-t border-gray-100">
                <span className="text-sm font-bold text-primary uppercase tracking-wider">Subtotal</span>
                <span className="text-2xl font-bold text-emerald-600">{formatRupiah(cartTotal)}</span>
              </div>
              
              <button onClick={() => navigate('/checkout')} className="w-full bg-primary text-white py-4 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-accent transition-colors shadow-elegant flex justify-center items-center gap-2">
                Lanjutkan Ke Checkout <FiArrowLeft className="rotate-180" />
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}