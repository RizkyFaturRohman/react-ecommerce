import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { formatRupiah } from '../../currency';
import { FiMapPin, FiBox, FiShoppingBag, FiArrowLeft, FiStar, FiGrid, FiCheckCircle } from 'react-icons/fi';

export default function SellerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSellerData = async () => {
      setIsLoading(true);
      try {
        const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', id).single();
        if (profileError) throw profileError;
        setSeller(profileData);

        const { data: productsData, error: productsError } = await supabase.from('products').select('*').eq('seller_id', id).order('created_at', { ascending: false });
        if (productsError) throw productsError;
        setProducts(productsData || []);
      } catch (error) {
        console.error('Gagal memuat profil toko:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchSellerData();
  }, [id]);

  if (isLoading) return <div className="min-h-screen flex justify-center items-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>;
  if (!seller) return <div className="min-h-screen flex justify-center items-center text-slate-500 font-bold text-xl">Toko tidak ditemukan atau telah ditutup.</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 animate-fade-in relative">
      
      {/* Tombol Kembali */}
      <button onClick={() => navigate(-1)} className="absolute top-8 left-6 md:left-12 z-50 bg-white/10 hover:bg-white/30 backdrop-blur-md text-white px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 border border-white/20 cursor-pointer shadow-lg">
        <FiArrowLeft size={16}/> Kembali
      </button>

      {/* HEADER TOKO */}
      <div className="bg-white shadow-sm relative mb-12 rounded-b-[3rem] border-b border-slate-200">
        
        {/* Banner Gelap */}
        <div className="h-56 md:h-72 w-full bg-[#0f172a] relative overflow-hidden rounded-b-[3rem] md:rounded-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/40 rounded-full blur-[100px]"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/30 rounded-full blur-[100px]"></div>
        </div>

        {/* Kontainer Profil (Posisi turun ke background putih) */}
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative -mt-16 md:-mt-20 pb-10 flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 text-center md:text-left z-10">
          
          {/* Avatar Penjual */}
          <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-[2rem] p-1.5 shadow-xl shrink-0 border border-slate-100 flex justify-center items-center overflow-hidden">
            {seller.avatar_url ? (
               <img src={seller.avatar_url} alt="Toko" className="w-full h-full object-cover rounded-[1.5rem] bg-slate-100" />
            ) : (
               <div className="w-full h-full bg-slate-100 rounded-[1.5rem] flex items-center justify-center text-6xl font-serif text-slate-300 uppercase">
                 {seller.shop_name?.charAt(0) || seller.full_name?.charAt(0) || 'S'}
               </div>
            )}
          </div>

          {/* Info Toko */}
          <div className="flex-1 pb-2 md:pb-4 mt-2 md:mt-0">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-5">
              {/* Teks Putih dengan drop-shadow agar menyala di banner gelap */}
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-white drop-shadow-lg tracking-wide">
                {seller.shop_name || seller.full_name || 'Toko Partner'}
              </h1>
              <div className="bg-emerald-500 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                <FiCheckCircle size={12}/> Verified
              </div>
            </div>
            
            {/* Badge Solid agar warnanya sangat menonjol ("Keluar") */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs font-bold text-slate-600">
              <div className="flex items-center gap-2 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                <FiGrid className="text-primary" size={16}/> {products.length} Produk Aktif
              </div>
              <div className="flex items-center gap-2 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                <FiMapPin className="text-rose-500" size={16}/> Bergabung {seller.created_at ? new Date(seller.created_at).getFullYear() : 'Baru'}
              </div>
              <div className="flex items-center gap-2 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)] text-amber-600">
                <FiStar className="fill-amber-500 text-amber-500" size={16}/> 4.9/5 Rating
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ETALASE PRODUK */}
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex items-center gap-3 mb-8 border-b border-slate-200 pb-4">
          <FiShoppingBag className="text-primary" size={24} />
          <h2 className="text-2xl font-serif font-bold text-slate-800">Semua Produk</h2>
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-[2rem] border border-slate-100 p-16 text-center shadow-sm">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <FiBox size={40} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">Etalase Masih Kosong</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">Toko ini belum menambahkan produk apapun ke dalam etalasenya. Silakan kembali lagi nanti.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {products.map((product) => (
              <Link key={product.id} to={`/product/${product.id}`} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 group flex flex-col">
                <div className="aspect-square bg-slate-50 relative overflow-hidden p-5 flex justify-center items-center">
                  <img src={product.image_urls?.[0] || product.image_url || product.image} alt={product.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700" />
                  {product.stock < 5 && product.stock > 0 && (
                    <span className="absolute top-3 right-3 bg-rose-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded shadow-sm">Sisa {product.stock}</span>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1 border-t border-slate-50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 line-clamp-1">{product.category.split('>').pop()}</span>
                  <h3 className="font-bold text-slate-800 text-sm mb-3 line-clamp-2 leading-snug group-hover:text-primary transition-colors">{product.name}</h3>
                  <div className="mt-auto flex items-center justify-between">
                    <p className="text-emerald-600 font-bold text-lg">{formatRupiah(product.price)}</p>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors text-slate-400"><FiShoppingBag size={14} /></div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}