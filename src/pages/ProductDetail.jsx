import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatRupiah } from '../currency';
import { FiArrowLeft, FiMinus, FiPlus, FiShoppingCart, FiStar, FiUser, FiMessageSquare, FiMessageCircle } from 'react-icons/fi';
import Swal from 'sweetalert2';

// IMPORT KOMPONEN CHAT BOX YANG BARU DIBUAT
import ChatBox from '../components/ChatBox';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  
  // STATE PRODUK UMUM
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mainImage, setMainImage] = useState('');
  
  // STATE PENJUAL
  const [sellerProfile, setSellerProfile] = useState(null);
  
  // STATE INTERAKSI PEMBELI
  const [quantity, setQuantity] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null); 

  // STATE KHUSUS WISHLIST
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);

  // STATE KHUSUS ULASAN
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);

  // STATE KHUSUS CHAT WIDGET
  const [isChatOpen, setIsChatOpen] = useState(false);

  // 1. MENGAMBIL DATA PRODUK, PENJUAL, & ULASAN
  useEffect(() => {
    const fetchProductAndReviews = async () => {
      setIsLoading(true);
      try {
        // A. Tarik Data Detail Produk
        const { data: prodData, error: prodError } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (prodError) throw prodError;
        setProduct(prodData);
        
        if (prodData.image_urls && prodData.image_urls.length > 0) {
          setMainImage(prodData.image_urls[0]);
        } else if (prodData.image) {
          setMainImage(prodData.image);
        }

        // B. Tarik Data Profil Penjual
        if (prodData.seller_id) {
          const { data: sellerData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', prodData.seller_id)
            .maybeSingle();
            
          if (sellerData) setSellerProfile(sellerData);
        }

        // C. Tarik Data Ulasan
        const { data: revData, error: revError } = await supabase
          .from('reviews')
          .select(`
            id, rating, comment, created_at, image_urls,
            profiles (full_name, avatar_url)
          `)
          .eq('product_id', id)
          .order('created_at', { ascending: false });

        if (revError) throw revError;
        setReviews(revData || []);

        if (revData && revData.length > 0) {
          const totalRating = revData.reduce((sum, item) => sum + item.rating, 0);
          const avg = totalRating / revData.length;
          setAverageRating(avg.toFixed(1)); 
        }

      } catch (err) {
        console.error("Gagal memuat detail produk/ulasan:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchProductAndReviews();
  }, [id]);

  // 2. MENGAMBIL STATUS WISHLIST
  useEffect(() => {
    const checkWishlistStatus = async () => {
      const currentUserId = user?.id;
      if (!currentUserId || !id) return;
      
      try {
        const { data, error } = await supabase
          .from('wishlists')
          .select('id')
          .eq('profile_id', currentUserId)
          .eq('product_id', id)
          .maybeSingle();

        if (error) throw error;
        if (data) setIsWishlisted(true);
      } catch (err) {
        console.error("Gagal memeriksa status wishlist:", err);
      }
    };

    checkWishlistStatus();
  }, [user?.id, id]);

  // 3. FUNGSI TOGGLE WISHLIST
  const handleToggleWishlist = async () => {
    if (!user?.id) {
      Swal.fire({
        title: 'Login Diperlukan',
        text: 'Silakan login terlebih dahulu untuk menyimpan produk favorit.',
        icon: 'warning',
        confirmButtonText: 'Login Sekarang',
        showCancelButton: true,
        cancelButtonText: 'Nanti saja'
      }).then((result) => {
        if (result.isConfirmed) navigate('/login');
      });
      return;
    }

    setIsWishlistLoading(true);
    try {
      if (isWishlisted) {
        const { error } = await supabase.from('wishlists').delete().eq('profile_id', user.id).eq('product_id', id);
        if (error) throw error;
        setIsWishlisted(false);
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Dihapus dari Wishlist', showConfirmButton: false, timer: 1500 });
      } else {
        const { error } = await supabase.from('wishlists').insert([{ profile_id: user.id, product_id: id }]);
        if (error) throw error;
        setIsWishlisted(true);
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Disimpan ke Wishlist ❤️', showConfirmButton: false, timer: 1500 });
      }
    } catch (err) {
      Swal.fire('Gagal', err.message, 'error');
    } finally {
      setIsWishlistLoading(false);
    }
  };

  const activeVariationObject = product?.variations?.find(v => v.name === selectedVariation);
  const displayPrice = activeVariationObject ? activeVariationObject.price : product?.price;
  const displayStock = activeVariationObject && activeVariationObject.stock !== undefined ? activeVariationObject.stock : product?.stock;

  useEffect(() => {
    setQuantity((prevQuantity) => {
      if (prevQuantity > displayStock) {
        return Math.max(1, displayStock);
      }
      return prevQuantity;
    });
  }, [displayStock]);

  const handleAddToCart = () => {
    if (!product) return;
    
    if (product.variations?.length > 0 && !selectedVariation) {
      Swal.fire('Pilih Varian', 'Silakan pilih varian produk terlebih dahulu.', 'info');
      return;
    }

    if (product.colors?.length > 0 && !selectedColor) {
      Swal.fire('Pilih Warna', 'Silakan pilih warna produk terlebih dahulu.', 'info');
      return;
    }

    const cartItem = {
      ...product,
      quantity: quantity,
      price: displayPrice,
      chosenVariation: selectedVariation,
      chosenColor: selectedColor,
      chosenImage: mainImage,
      seller_name: sellerProfile?.full_name || 'Toko Partner',
    };

    addToCart(cartItem);
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Dimasukkan ke keranjang', showConfirmButton: false, timer: 1500 });
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center pt-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  if (!product) {
    return <div className="min-h-screen flex items-center justify-center pt-20"><p className="text-gray-500 font-bold">Produk tidak ditemukan.</p></div>;
  }

  return (
    <div className="min-h-screen bg-surface pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-16">
        
        <div>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-primary-light hover:text-primary text-xs font-bold uppercase tracking-widest mb-8 transition-colors cursor-pointer">
            <FiArrowLeft /> Kembali
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 bg-white p-6 md:p-10 rounded-3xl border border-gray-100 shadow-sm">
            
            {/* GALERI GAMBAR */}
            <div className="space-y-6">
              <div className="aspect-square bg-slate-50 rounded-2xl overflow-hidden border border-gray-100 flex items-center justify-center p-8">
                <img src={mainImage || 'https://via.placeholder.com/600'} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
              </div>
              
              {product.image_urls && product.image_urls.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                  {product.image_urls.map((url, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setMainImage(url)}
                      className={`w-24 h-24 shrink-0 rounded-xl border-2 overflow-hidden cursor-pointer p-2 transition-all ${mainImage === url ? 'border-primary' : 'border-transparent hover:border-gray-200 bg-slate-50'}`}
                    >
                      <img src={url} alt={`Thumbnail ${idx}`} className="w-full h-full object-contain mix-blend-multiply" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* DETAIL INFO PRODUK */}
            <div className="flex flex-col justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-serif text-primary mb-2">{product.name}</h1>
                
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex items-center text-amber-400 gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100 text-xs font-bold">
                    <FiStar className="fill-current" /> {averageRating > 0 ? averageRating : '0.0'}
                  </div>
                  <span className="text-xs text-gray-400 font-medium">({reviews.length} Ulasan Pembeli)</span>
                </div>

                <p className="text-2xl md:text-3xl font-bold text-emerald-600 mb-6">{formatRupiah(displayPrice)}</p>
                
                <div className="prose prose-sm text-gray-500 mb-8 leading-relaxed">
                  {product.description || 'Tidak ada deskripsi untuk produk ini.'}
                </div>

                {product.variations && product.variations.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Pilih Varian</h3>
                    <div className="flex flex-wrap gap-3">
                      {product.variations.map((v, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedVariation(v.name)}
                          disabled={v.stock <= 0}
                          className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                            v.stock <= 0 ? 'bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed' :
                            selectedVariation === v.name ? 'border-primary bg-primary/5 text-primary shadow-sm' : 'border-gray-200 text-gray-600 hover:border-primary'
                          }`}
                        >
                          {v.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {product.colors && product.colors.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Pilih Warna</h3>
                    <div className="flex flex-wrap gap-3">
                      {product.colors.map((c, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedColor(c);
                            if (product.image_urls && product.image_urls[idx]) {
                              setMainImage(product.image_urls[idx]);
                            }
                          }}
                          className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                            selectedColor === c ? 'border-primary bg-primary/5 text-primary shadow-sm' : 'border-gray-200 text-gray-600 hover:border-primary'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-4 mt-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Kuantitas</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center bg-slate-50 border border-gray-200 rounded-xl overflow-hidden h-12 w-32">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-primary hover:bg-gray-100 transition-colors cursor-pointer"><FiMinus /></button>
                      <span className="flex-1 text-center font-bold text-primary text-sm">{quantity}</span>
                      <button onClick={() => setQuantity(Math.min(quantity + 1, displayStock))} className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-primary hover:bg-gray-100 transition-colors cursor-pointer"><FiPlus /></button>
                    </div>
                    <span className="text-xs font-medium text-gray-400">
                      Sisa Stok: <span className="text-primary font-bold">{displayStock}</span>
                    </span>
                  </div>
                </div>

                {/* ============================================================== */}
                {/* FITUR BARU: INFO PENJUAL & TOMBOL CHAT */}
                {/* ============================================================== */}
                <div className="flex flex-wrap items-center justify-between pt-6 border-t border-gray-100 mt-8 mb-6 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-50 border border-gray-200 overflow-hidden shrink-0">
                      <img src={sellerProfile?.avatar_url || 'https://via.placeholder.com/150'} alt="Seller" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Dijual Oleh</p>
                      <Link 
                        to={`/shop/${product.seller_id}`} 
                        className="text-sm font-bold text-primary hover:text-emerald-600 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        {sellerProfile?.full_name || 'Toko Partner'}
                      </Link>
                    </div>
                  </div>

                  {/* Tombol akan muncul HANYA JIKA yang melihat produk ini BUKAN si penjual itu sendiri */}
                  {user && user.id !== product.seller_id && (
                    <button 
                      onClick={() => setIsChatOpen(true)}
                      className="flex items-center gap-2 bg-emerald-50 text-emerald-600 border border-emerald-200 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-100 transition-colors cursor-pointer shadow-sm"
                    >
                      <FiMessageCircle size={16} /> Chat Penjual
                    </button>
                  )}
                  
                  {/* Pesan login jika belum login */}
                  {!user && (
                    <button onClick={() => navigate('/login')} className="flex items-center gap-2 text-gray-400 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                       Login Untuk Chat
                    </button>
                  )}
                </div>

              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-4 items-center pt-6 border-t border-gray-100 mt-2">
                <button 
                  onClick={handleAddToCart}
                  disabled={displayStock <= 0}
                  className="flex-1 bg-primary text-white h-14 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-accent transition-colors shadow-elegant flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <FiShoppingCart size={16} /> {displayStock > 0 ? 'Masukkan Keranjang' : 'Stok Habis'}
                </button>

                <button
                  type="button"
                  disabled={isWishlistLoading}
                  onClick={handleToggleWishlist}
                  className={`h-14 w-14 shrink-0 rounded-xl border transition-all duration-300 flex items-center justify-center cursor-pointer ${isWishlisted ? 'border-red-200 bg-red-50 text-red-500 shadow-sm' : 'border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50/50 bg-white'}`}
                  title={isWishlisted ? "Hapus dari Wishlist" : "Simpan ke Wishlist"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={`w-6 h-6 transition-transform duration-300 ${isWishlisted ? 'scale-110' : 'active:scale-125'}`} fill={isWishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* SECTION DAFTAR ULASAN DENGAN BUKTI GAMBAR */}
        <div className="bg-white p-6 md:p-10 rounded-3xl border border-gray-100 shadow-sm space-y-8">
          <div className="border-b border-gray-50 pb-5">
            <h2 className="text-xl font-serif text-primary flex items-center gap-2">
              <FiMessageSquare className="text-gray-400" /> Ulasan Produk ({reviews.length})
            </h2>
            <p className="text-xs text-gray-400 mt-1">Pendapat asli dari pelanggan yang telah membeli produk ini.</p>
          </div>

          {reviews.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {reviews.map((rev) => (
                <div key={rev.id} className="py-6 flex gap-4 items-start animate-fade-in">
                  <div className="w-10 h-10 bg-slate-50 border border-gray-100 rounded-full flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                    {rev.profiles?.avatar_url ? (
                      <img src={rev.profiles.avatar_url} alt="User Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <FiUser size={18} className="text-gray-400" />
                    )}
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <p className="text-sm font-bold text-primary">{rev.profiles?.full_name || 'Pembeli Anonim'}</p>
                      <p className="text-[10px] text-gray-400 font-medium">
                        {new Date(rev.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex text-amber-400 gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FiStar key={star} size={14} className={star <= rev.rating ? 'fill-current' : 'text-slate-200'} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed pt-1">
                      {rev.comment || <span className="text-gray-400 italic">Pengguna tidak memberikan komentar tertulis.</span>}
                    </p>
                    
                    {rev.image_urls && rev.image_urls.length > 0 && (
                      <div className="flex gap-3 overflow-x-auto custom-scrollbar pt-3 pb-1">
                        {rev.image_urls.map((imgUrl, idx) => (
                          <a key={idx} href={imgUrl} target="_blank" rel="noopener noreferrer" className="w-16 h-16 rounded-xl border border-gray-200 overflow-hidden shrink-0 block hover:border-primary shadow-sm transition-colors">
                            <img src={imgUrl} alt="Bukti Ulasan" className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400 flex flex-col items-center">
              <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-gray-300 border border-gray-100 mb-3">
                <FiStar size={24} />
              </div>
              <p className="text-sm font-bold text-slate-600">Belum Ada Ulasan</p>
              <p className="text-xs mt-1 max-w-xs">Jadilah pembeli pertama dan berikan penilaian Anda setelah bertransaksi!</p>
            </div>
          )}
        </div>

        {/* ======================================= */}
        {/* MERENDER KOMPONEN CHAT BOX (MENGAMBANG) */}
        {/* ======================================= */}
        {isChatOpen && product && sellerProfile && (
          <ChatBox 
            sellerId={product.seller_id}
            sellerName={sellerProfile.full_name}
            sellerAvatar={sellerProfile.avatar_url}
            onClose={() => setIsChatOpen(false)}
          />
        )}

      </div>
    </div>
  );
}