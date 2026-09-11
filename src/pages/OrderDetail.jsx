import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext'; 
import { formatRupiah } from '../currency';
import { 
  FiArrowLeft, FiMapPin, FiTruck, FiCreditCard, FiShoppingBag, FiCalendar, 
  FiFileText, FiPackage, FiCheckCircle, FiCheck, FiMessageSquare, FiStar, FiX, FiCamera 
} from 'react-icons/fi';
import Swal from 'sweetalert2';

export default function OrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth(); 
    const [order, setOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // === STATE MODAL ULASAN DENGAN BUKTI GAMBAR ===
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [hasReviewed, setHasReviewed] = useState(false); 
    
    // State Foto Bukti Ulasan
    const fileInputRef = useRef(null);
    const [reviewImages, setReviewImages] = useState([]);
    const [reviewPreviews, setReviewPreviews] = useState([]);

    useEffect(() => {
        const fetchOrderDetail = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase.from('orders').select('*').eq('id', id).single();
                if (error) throw error;
                setOrder(data);

                if (user?.id) {
                    const { data: revData } = await supabase.from('reviews').select('id').eq('order_id', id).eq('user_id', user.id).maybeSingle();
                    if (revData) setHasReviewed(true);
                }
            } catch (error) {
                console.error('Gagal mengambil detail pesanan:', error);
            } finally {
                setIsLoading(false);
            }
        };
        if (id) fetchOrderDetail();
    }, [id, user?.id]);

    const handleCompleteOrder = async () => {
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
                    const { error } = await supabase.from('orders').update({ status: 'Completed' }).eq('id', order.id);
                    if (error) throw error;
                    setOrder({ ...order, status: 'Completed' });

                    await supabase.from('notifications').insert([{
                        profile_id: user?.id,
                        title: 'Pesanan Selesai 🎉',
                        description: `Pesanan #${order.id.split('-')[0].toUpperCase()} telah Anda konfirmasi. Terima kasih telah berbelanja di MYSTORE!`,
                        type: 'order', 
                        is_unread: true
                    }]);

                    Swal.fire('Berhasil!', 'Terima kasih telah berbelanja.', 'success');
                } catch (error) {
                    Swal.fire('Gagal', error.message, 'error');
                }
            }
        });
    };

    // LOGIKA SELEKSI FOTO BUKTI ULASAN
    const handleImageSelect = (e) => {
      const files = Array.from(e.target.files);
      if (reviewImages.length + files.length > 5) {
        Swal.fire('Maksimal 5 Foto', 'Batas unggah foto bukti adalah 5 file.', 'warning');
        return;
      }
      setReviewImages(prev => [...prev, ...files]);
      setReviewPreviews(prev => [...prev, ...files.map(file => URL.createObjectURL(file))]);
    };

    const handleRemovePreview = (idxToRemove) => {
      setReviewImages(prev => prev.filter((_, idx) => idx !== idxToRemove));
      setReviewPreviews(prev => prev.filter((_, idx) => idx !== idxToRemove));
    };

    // FUNGSI KIRIM ULASAN + UPLOAD FOTO KE STORAGE
    const submitReview = async () => {
        setIsSubmittingReview(true);
        Swal.fire({ title: 'Mengirim Ulasan...', text: 'Mengunggah bukti gambar ke server.', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        
        try {
            const itemsData = getSafeItems(order.items);
            const productId = itemsData[0].id;

            // 1. Upload Foto ke Bucket review-images jika ada
            let uploadedUrls = [];
            for (const file of reviewImages) {
              const fileExt = file.name.split('.').pop();
              const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
              const filePath = `reviews/${fileName}`;

              const { error: uploadErr } = await supabase.storage.from('review-images').upload(filePath, file);
              if (uploadErr) throw uploadErr;

              const { data: { publicUrl } } = supabase.storage.from('review-images').getPublicUrl(filePath);
              uploadedUrls.push(publicUrl);
            }

            // 2. Simpan Data Ulasan ke Database
            const { error } = await supabase.from('reviews').insert([{
                product_id: productId,
                user_id: user.id,
                order_id: order.id,
                rating: reviewForm.rating,
                comment: reviewForm.comment,
                image_urls: uploadedUrls // Masuk ke kolom array
            }]);

            if (error) throw error;

            Swal.fire({ title: 'Terima Kasih! 🌟', text: 'Ulasan berfoto Anda berhasil disimpan.', icon: 'success', confirmButtonColor: '#252525' });
            setIsReviewModalOpen(false); 
            setHasReviewed(true); 
        } catch (error) {
            Swal.fire('Gagal Menyimpan', error.message, 'error');
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const getSafeItems = (itemsData) => {
        if(!itemsData) return[];
        if (typeof itemsData === 'string') {
            try { return JSON.parse(itemsData); } catch { return []; }
        }
        return itemsData;
    };

    if (isLoading) return <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
    if (!order) return <div className="text-center py-12"><p className="text-gray-500 font-bold">Pesanan tidak ditemukan.</p></div>;

    const items = getSafeItems(order.items);
    const statusSteps = ['Pending', 'Processing', 'Shipped', 'Completed'];
    const currentStepIndex = statusSteps.indexOf(order.status);
    const shippingFeeSimulated = order.total_amount > 5000000 ? 75000 : 25000;
    const insuranceFeeSimulated = 5000;
    const productSubtotalSimulated = order.total_amount - shippingFeeSimulated - insuranceFeeSimulated;

    return (
    <div className="w-full animate-fade-in space-y-8 pb-10 relative">
      
      {/* Header navigasi */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <button onClick={() => navigate('/my-orders')} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-primary transition-colors cursor-pointer">
          <FiArrowLeft size={16} /> Kembali
        </button>
        <div className="text-right">
          <p className="text-xs text-gray-400 font-medium">ID PESANAN</p>
          <p className="text-xs font-bold text-primary">#{order.id.split('-')[0].toUpperCase()}</p>
        </div>
      </div>

      {/* 1. TIMELINE PROGRESS TRACKER */}
      <div className="bg-slate-50 rounded-2xl p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-center relative gap-8 md:gap-2">
          <div className="hidden md:block absolute left-[12%] right-[12%] top-5 h-0.5 bg-gray-200 z-0">
            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(Math.max(0, currentStepIndex) / (statusSteps.length - 1)) * 100}%` }}></div>
          </div>
          
          <div className="flex flex-row md:flex-col items-center gap-4 md:gap-2 z-10 w-full md:w-auto">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all ${currentStepIndex >= 0 ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' : 'bg-white border-gray-200 text-gray-400'}`}><FiFileText size={16} /></div>
            <div className="text-left md:text-center"><p className={`text-xs font-bold ${currentStepIndex >= 0 ? 'text-primary' : 'text-gray-400'}`}>Pesanan Dibuat</p></div>
          </div>
          <div className="flex flex-row md:flex-col items-center gap-4 md:gap-2 z-10 w-full md:w-auto">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all ${currentStepIndex >= 1 ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' : 'bg-white border-gray-200 text-gray-400'}`}><FiPackage size={16} /></div>
            <div className="text-left md:text-center"><p className={`text-xs font-bold ${currentStepIndex >= 1 ? 'text-primary' : 'text-gray-400'}`}>Sedang Dikemas</p></div>
          </div>
          <div className="flex flex-row md:flex-col items-center gap-4 md:gap-2 z-10 w-full md:w-auto">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all ${currentStepIndex >= 2 ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' : 'bg-white border-gray-200 text-gray-400'}`}><FiTruck size={16} /></div>
            <div className="text-left md:text-center"><p className={`text-xs font-bold ${currentStepIndex >= 2 ? 'text-primary' : 'text-gray-400'}`}>Sedang Dikirim</p></div>
          </div>
          <div className="flex flex-row md:flex-col items-center gap-4 md:gap-2 z-10 w-full md:w-auto">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all ${currentStepIndex >= 3 ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' : 'bg-white border-gray-200 text-gray-400'}`}><FiCheckCircle size={16} /></div>
            <div className="text-left md:text-center"><p className={`text-xs font-bold ${currentStepIndex >= 3 ? 'text-primary' : 'text-gray-400'}`}>Selesai</p></div>
          </div>
        </div>
      </div>

      {/* 2. LOGISTIK & ALAMAT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-gray-100 rounded-2xl p-6 shadow-sm bg-white">
          <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2"><FiMapPin size={16} /> Alamat Pengiriman</h3>
          <div className="text-sm space-y-1">
            <p className="font-bold text-primary">{order.customer_name}</p>
            <p className="text-gray-500 font-medium">{order.phone_number}</p>
            <p className="text-gray-400 text-xs leading-relaxed pt-2 border-t border-gray-50 mt-2">{order.shipping_address}</p>
          </div>
        </div>

        <div className="border border-gray-100 rounded-2xl p-6 shadow-sm bg-white flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2"><FiTruck size={16} /> Informasi Logistik</h3>
            <div className="text-sm space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs">Kurir Pengiriman</span>
                <span className="font-bold text-primary text-xs uppercase">{order.courier ? order.courier : 'MENUNGGU KURIR'}</span>
              </div>
              {order.tracking_number && (
                <div className="flex justify-between items-center border-t border-gray-50 pt-2">
                  <span className="text-gray-400 text-xs">Nomor Resi</span>
                  <span className="font-bold tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 text-[10px]">{order.tracking_number}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. LIST ITEM */}
      <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm bg-white">
        <div className="px-6 py-4 border-b border-gray-50 bg-slate-50/50">
          <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2"><FiShoppingBag size={16} /> Detail Produk Yang Dibeli</h3>
        </div>
        <div className="divide-y divide-gray-100 px-6">
          {items.map((item, idx) => (
              <div key={idx} className="py-5 flex items-center gap-5">
                <div className="w-20 h-20 bg-white rounded-xl overflow-hidden shrink-0 border border-gray-200 p-1 shadow-sm"><img src={item?.chosenImage || item?.image} alt={item?.name} className="w-full h-full object-contain" /></div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-primary mb-1">{item?.name}</h4>
                  <p className="text-xs text-gray-400 mt-2 font-medium">{item?.quantity || item?.chosenQuantity || 1} x {formatRupiah(item?.price || 0)}</p>
                </div>
                <div className="text-right"><p className="text-sm font-bold text-primary">{formatRupiah((item?.price || 0) * (item?.quantity || item?.chosenQuantity || 1))}</p></div>
              </div>
          ))}
        </div>
      </div>

      {/* 4. TOTAL & ACTION BUTTONS */}
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-end">
        <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-3">
            {order.status === 'Shipped' && (
                <button onClick={handleCompleteOrder} className="px-8 py-3.5 rounded-xl bg-emerald-500 text-white text-xs font-bold uppercase tracking-widest hover:bg-emerald-600 shadow-elegant transition-colors flex items-center justify-center gap-2 cursor-pointer">
                    <FiCheck size={16} /> Pesanan Diterima
                </button>
            )}
            {order.status === 'Completed' && (
                <button 
                  onClick={() => !hasReviewed && setIsReviewModalOpen(true)} 
                  disabled={hasReviewed}
                  className={`w-full px-8 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                    hasReviewed ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-not-allowed shadow-none' : 'bg-primary text-white hover:bg-accent shadow-elegant'
                  }`}
                >
                    {hasReviewed ? <><FiCheckCircle size={16} /> Penilaian Tersimpan</> : <><FiStar size={16} /> Beri Penilaian Berfoto</>}
                </button>
            )}
        </div>

        <div className="border border-gray-100 rounded-2xl p-6 shadow-sm bg-white w-full lg:max-w-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2 border-b border-gray-50 pb-2"><FiCreditCard size={16} /> Rincian Pembayaran</h3>
            <div className="space-y-3 text-xs text-gray-500">
                <div className="flex justify-between"><span>Subtotal Produk</span><span className="font-medium text-primary">{formatRupiah(productSubtotalSimulated > 0 ? productSubtotalSimulated : order.total_amount)}</span></div>
                <div className="flex justify-between"><span>Subtotal Pengiriman</span><span className="font-medium text-primary">{formatRupiah(shippingFeeSimulated)}</span></div>
                <div className="flex justify-between border-t border-dashed border-gray-100 pt-3 text-sm font-bold text-primary"><span>Total Pembayaran</span><span className="text-emerald-600 text-base">{formatRupiah(order.total_amount)}</span></div>
            </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* MODAL POP-UP PENILAIAN / REVIEW DENGAN STRUKTUR MULTI-FOTO */}
      {/* ========================================================== */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsReviewModalOpen(false)}></div>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg z-10 overflow-hidden flex flex-col relative max-h-[90vh]">
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                    <h3 className="text-base font-bold text-primary">Nilai & Upload Foto Bukti</h3>
                    <button onClick={() => setIsReviewModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors bg-white rounded-full p-1.5 border border-gray-200 cursor-pointer"><FiX size={20} /></button>
                </div>
                <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white rounded-xl border border-gray-200 p-1 flex-shrink-0 shadow-sm"><img src={items[0]?.chosenImage || items[0]?.image} alt="Product" className="w-full h-full object-contain" /></div>
                        <div>
                             <p className="font-bold text-primary text-sm line-clamp-1">{items[0]?.name}</p>
                             <p className="text-xs text-gray-400 mt-0.5">Bagaimana kualitas produk yang Anda terima?</p>
                        </div>
                    </div>

                    {/* SELEKSI BINTANG RATING */}
                    <div className="flex justify-center gap-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button key={star} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: star })} className="focus:outline-none transform hover:scale-110 transition-transform cursor-pointer">
                                <FiStar size={36} className={`transition-colors duration-200 ${star <= reviewForm.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-200'}`} />
                            </button>
                        ))}
                    </div>

                    {/* FITUR BARU: AREA MULTI-UPLOAD FOTO BUKTI BARANG */}
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tambahkan Foto Bukti Produk (Maks 5)</label>
                      <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleImageSelect} className="hidden" />
                      
                      <div className="grid grid-cols-4 gap-3">
                        {reviewPreviews.length < 5 && (
                          <button type="button" onClick={() => fileInputRef.current.click()} className="aspect-square border-2 border-dashed border-gray-200 hover:border-primary/50 bg-slate-50 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:text-primary transition-all cursor-pointer">
                            <FiCamera size={20} />
                            <span className="text-[9px] font-bold uppercase tracking-wider mt-1">Ambil Foto</span>
                          </button>
                        )}
                        {reviewPreviews.map((src, idx) => (
                          <div key={idx} className="relative aspect-square border border-gray-100 rounded-2xl overflow-hidden group">
                            <img src={src} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => handleRemovePreview(idx)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-red-500 transition-colors cursor-pointer"><FiX size={10} /></button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tuliskan Komentar Ulasan</label>
                        <textarea rows="3" value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} placeholder="Bagikan kepuasan Anda mengenai produk ini..." className="w-full bg-slate-50 border border-transparent focus:border-primary focus:bg-white rounded-2xl py-3 px-4 text-sm transition-colors outline-none resize-none shadow-inner"></textarea>
                    </div>

                    <button onClick={submitReview} disabled={isSubmittingReview} className="w-full bg-primary text-white py-4 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-accent transition-colors shadow-elegant disabled:opacity-50 flex items-center justify-center cursor-pointer">
                        {isSubmittingReview ? 'Sedang Memproses...' : 'Kirim Ulasan Resmi'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}