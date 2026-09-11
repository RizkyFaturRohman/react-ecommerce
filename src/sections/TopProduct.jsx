import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { formatRupiah } from '../currency';
import { useCart } from '../context/CartContext';
import { FiShoppingBag, FiArrowRight } from 'react-icons/fi';
import Swal from 'sweetalert2';

export default function TopProduct() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // AMBIL 4 PRODUK TERBARU DARI SUPABASE
  useEffect(() => {
    const fetchLatestProducts = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(4); // Hanya tampilkan 4 produk terbaru di Home

        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error("Error fetching top products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLatestProducts();
  }, []);

  // FUNGSI BELI INSTAN
  const handleQuickAdd = (e, product) => {
    e.preventDefault();
    if (product.variations && product.variations.length > 0) {
      Swal.fire({
        title: 'Pilih Ukuran Dahulu',
        text: 'Produk ini memiliki pilihan variasi spesifik. Silakan klik kartu produk untuk memilih.',
        icon: 'info',
        confirmButtonColor: '#252525'
      });
      return;
    }

    addToCart({ ...product, quantity: 1 });
    
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Dimasukkan ke keranjang',
      showConfirmButton: false,
      timer: 1500
    });
  };

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div>
            <h2 className="text-3xl font-serif text-primary tracking-wide">New Arrivals</h2>
            <p className="text-xs text-primary-light/60 mt-2 uppercase tracking-widest font-bold">
              Koleksi Terbaru Minggu Ini
            </p>
          </div>
          <Link to="/shop" className="group flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest hover:text-accent transition-colors">
            View All Collection 
            <FiArrowRight className="transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* DAFTAR PRODUK (GRID) */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
            {products.map((product) => (
              <div key={product.id} className="group block">
                
                {/* WADAH FOTO */}
                <Link to={`/product/${product.id}`} className="relative overflow-hidden bg-secondary h-[260px] md:h-[320px] mb-4 flex items-center justify-center rounded-2xl p-4 border border-gray-50 shadow-sm">
                  <img 
                    src={product.image || (product.image_urls && product.image_urls[0])} 
                    alt={product.name} 
                    className="max-w-full max-h-full object-contain drop-shadow-sm transition-transform duration-700 group-hover:scale-105" 
                  />
                  
                  {/* Hover Tombol Add to Cart */}
                  <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 flex justify-center hidden md:flex">
                    <button 
                      onClick={(e) => handleQuickAdd(e, product)}
                      className="bg-surface/95 backdrop-blur-sm text-primary text-[10px] font-bold uppercase tracking-widest py-3 px-6 w-full flex items-center justify-center gap-2 hover:bg-primary hover:text-surface transition-all shadow-elegant rounded-xl"
                    >
                      <FiShoppingBag size={14} /> Add To Bag
                    </button>
                  </div>
                </Link>
                
                {/* INFO TEKS */}
                <div className="flex flex-col text-center mt-3">
                  <h3 className="text-xs font-bold text-primary uppercase tracking-wider truncate px-2" title={product.name}>
                    {product.name}
                  </h3>
                  <p className="text-primary-light text-sm mt-1 font-serif italic">
                    {formatRupiah(product.price)}
                  </p>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400 bg-secondary/50 rounded-3xl border border-gray-50">
            <p className="text-sm font-bold text-slate-600">Belum Ada Produk Baru</p>
            <p className="text-xs mt-1">Produk yang Anda tambahkan dari Dashboard Penjual akan muncul di sini.</p>
          </div>
        )}

      </div>
    </section>
  );
}