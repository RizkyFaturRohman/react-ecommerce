import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { formatRupiah } from '../currency';
import { useCart } from '../context/CartContext';
import { FiShoppingBag, FiSearch, FiInbox, FiSliders } from 'react-icons/fi';
import Swal from 'sweetalert2';

export default function Shop() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // STATE MANAGEMENT UNTUK FILTER, SEARCH & SORTING
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest'); // Pilihan: latest, price-low, price-high

  const categories = [
    { label: "All Categories", value: "all" },
    { label: "Clothing", value: "Clothing" },
    { label: "Footwear", value: "Footwear" },
    { label: "Electronics", value: "Electronics" },
    { label: "Accessories", value: "Accessories" },
  ];

  // AMBIL DATA DARI SUPABASE
  useEffect(() => {
    const fetchShopProducts = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error("Error fetching products in catalog:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShopProducts();
  }, []);

  // FUNGSI BELI INSTAN (QUICK ADD TO CART)
  const handleQuickAdd = (e, product) => {
    e.preventDefault(); // Menghentikan navigasi Link agar tidak berpindah halaman

    // Proteksi Keamanan: Jika produk punya variasi ukuran, pembeli harus masuk ke halaman detail
    if (product.variations && product.variations.length > 0) {
      Swal.fire({
        title: 'Pilih Ukuran Dahulu',
        text: 'Produk ini memiliki pilihan variasi/ukuran spesifik. Silakan klik kartu produk untuk memilih.',
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
      title: 'Berhasil dimasukkan ke keranjang',
      showConfirmButton: false,
      timer: 1500
    });
  };

  // PROGRAM FILTERING & SEARCHING (Kombinasi Logika)
  let processedProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // PROGRAM SORTING (PENGURUTAN)
  if (sortBy === 'price-low') {
    processedProducts.sort((a, b) => a.price - b.price); // Termurah ke Termahal
  } else if (sortBy === 'price-high') {
    processedProducts.sort((a, b) => b.price - a.price); // Termahal ke Termurah
  } else if (sortBy === 'latest') {
    processedProducts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // Produk Baru
  }

  return (
    <div className="min-h-screen bg-surface pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* TOP PANEL: JUDUL DAN PENCARIAN */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 pb-6 border-b border-gray-100">
          <div>
            <h1 className="text-3xl font-serif text-primary tracking-wide">Our Catalog</h1>
            <p className="text-xs text-primary-light/60 mt-1">Eksplorasi koleksi produk premium terbaik kami.</p>
          </div>
          
          {/* Live Search Input */}
          <div className="relative w-full md:w-80">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-light/40" size={16} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..." 
              className="pl-11 pr-4 py-3.5 w-full bg-secondary rounded-xl text-xs font-medium tracking-wide focus:ring-1 focus:ring-primary/20 outline-none border border-gray-100 shadow-sm"
            />
          </div>
        </div>

        {/* UTAMA: SUSUNAN DUA KOLOM (FILTER SIDEBAR & DAFTAR PRODUK) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 items-start">
          
          {/* KOLOM KIRI: FILTER PANEL (DASHBOARD KECIL) */}
          <div className="space-y-8 bg-white/50 p-6 rounded-2xl border border-gray-100/50 hidden lg:block">
            
            {/* Filter Kategori */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2 mb-4">
                <FiSliders size={14} /> Categories
              </h3>
              <div className="flex flex-col space-y-2">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`text-left text-xs uppercase tracking-wider font-medium py-2 px-3 rounded-lg transition-all ${
                      selectedCategory === cat.value 
                        ? "bg-primary text-white shadow-sm font-bold" 
                        : "text-primary-light/70 hover:bg-secondary hover:text-primary"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pengurut Harga */}
            <div className="space-y-3 pt-6 border-t border-gray-100">
              <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Sort By</h3>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-secondary border border-gray-100 rounded-xl py-3 px-4 text-xs font-medium tracking-wide outline-none text-primary cursor-pointer focus:ring-1 focus:ring-primary/20"
              >
                <option value="latest">Newest Collection</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* FILTER KHUSUS MOBILE TAMPILAN ATAS */}
          <div className="flex flex-wrap gap-4 lg:hidden mb-4 w-full">
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex-1 bg-secondary border border-gray-100 rounded-xl py-3 px-4 text-xs font-medium text-primary"
            >
              {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 bg-secondary border border-gray-100 rounded-xl py-3 px-4 text-xs font-medium text-primary"
            >
              <option value="latest">Newest Collection</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>

          {/* KOLOM KANAN: DAFTAR KATALOG PRODUK (Grid 3 Kolom) */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            ) : processedProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-12">
                {processedProducts.map((product) => (
                  <div key={product.id} className="group block">
                    
                    {/* WADAH FOTO: Ukuran Proporsional & Anti-Gepeng */}
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
              <div className="text-center py-24 text-gray-400 bg-white rounded-3xl border border-gray-50 shadow-sm">
                <FiInbox size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-sm font-bold text-slate-600">No products found</p>
                <p className="text-xs text-slate-400 mt-1">Coba ubah kata kunci pencarian atau bersihkan filter kategori Anda.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}