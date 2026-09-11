import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { formatRupiah } from '../currency';
import { FiHeart, FiShoppingBag, FiTrash2, FiArrowRight } from 'react-icons/fi';
import Swal from 'sweetalert2';

export default function Wishlist() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // MENGAMBIL DATA WISHLIST DENGAN TEKNIK JOIN RELATION
  const fetchWishlist = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('wishlists')
        .select(`
          id,
          product_id,
          products (
            id,
            name,
            price,
            image_urls,
            stock
          )
        `)
        .eq('profile_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWishlistItems(data || []);
    } catch (err) {
      console.error("Gagal mengambil wishlist:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) fetchWishlist();
  }, [user?.id, fetchWishlist]);

  // MENGHAPUS ITEM DARI WISHLIST
  const handleRemoveWishlist = async (wishlistId) => {
    try {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('id', wishlistId);

      if (error) throw error;

      setWishlistItems(prev => prev.filter(item => item.id !== wishlistId));
      
      Swal.fire({
        toast: true, position: 'top-end', icon: 'success', title: 'Dihapus dari favorit', showConfirmButton: false, timer: 1500
      });
    } catch (err) {
      Swal.fire('Gagal', err.message, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-surface pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        <div className="mb-12 border-b border-gray-100 pb-6">
          <h1 className="text-3xl md:text-4xl font-serif text-primary flex items-center gap-3">
            <FiHeart className="text-red-500 fill-current" size={32} /> Wishlist Saya
          </h1>
          <p className="text-sm text-gray-400 mt-2">Daftar produk impian yang Anda simpan untuk dibeli nanti.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : wishlistItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {wishlistItems.map((item) => {
              const product = item.products;
              if (!product) return null; // Antisipasi jika produk telah dihapus penjual

              const mainImage = product.image_urls?.[0] || 'https://via.placeholder.com/300';

              return (
                <div key={item.id} className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all flex flex-col group relative">
                  
                  {/* Gambar Produk */}
                  <div className="aspect-square bg-slate-50 relative overflow-hidden p-6 cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
                    <img 
                      src={mainImage} 
                      alt={product.name} 
                      className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" 
                    />
                  </div>

                  {/* Konten Teks */}
                  <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                    <div>
                      <h3 
                        onClick={() => navigate(`/product/${product.id}`)}
                        className="text-sm font-bold text-primary line-clamp-2 cursor-pointer hover:text-accent transition-colors mb-1"
                      >
                        {product.name}
                      </h3>
                      <p className="text-base font-bold text-emerald-600">{formatRupiah(product.price)}</p>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button 
                        onClick={() => navigate(`/product/${product.id}`)}
                        className="flex-1 bg-primary text-white text-xs font-bold py-3 rounded-xl hover:bg-accent transition-colors flex items-center justify-center gap-1 shadow-sm"
                      >
                        Beli Sekarang <FiArrowRight size={14} />
                      </button>
                      
                      <button 
                        onClick={() => handleRemoveWishlist(item.id)}
                        className="p-3 border border-gray-200 rounded-xl text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50/50 transition-colors"
                        title="Hapus dari Wishlist"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-24 text-center flex flex-col items-center bg-white rounded-3xl border border-gray-100 shadow-sm max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-400">
              <FiHeart size={28} />
            </div>
            <h3 className="text-lg font-bold text-primary">Wishlist Anda Kosong</h3>
            <p className="text-sm text-gray-400 mt-1 max-w-sm px-4">Jelajahi toko kami dan ketuk ikon hati pada produk yang Anda sukai untuk menyimpannya di sini.</p>
            <button 
              onClick={() => navigate('/shop')}
              className="mt-6 bg-primary text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-accent transition-colors shadow-elegant"
            >
              Mulai Belanja
            </button>
          </div>
        )}

      </div>
    </div>
  );
}