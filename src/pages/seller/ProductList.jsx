import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiImage, FiBox } from 'react-icons/fi';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

export default function ProductsList({ onAddNew, searchQuery }) {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('seller_id', user?.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) fetchProducts();
  }, [user]);

  const handleDelete = async (productId) => {
    const result = await Swal.fire({
      title: 'Hapus Produk?',
      text: "Data yang dihapus tidak dapat dikembalikan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e3342f',
      cancelButtonColor: '#252525',
      confirmButtonText: 'Ya, Hapus!'
    });

    if (result.isConfirmed) {
      try {
        const { error } = await supabase.from('products').delete().eq('id', productId);
        if (error) throw error;
        setProducts(products.filter(p => p.id !== productId));
        Swal.fire('Terhapus!', 'Produk berhasil dihapus dari etalase.', 'success');
      } catch (error) {
        Swal.fire('Gagal!', error.message, 'error');
      }
    }
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      
      {/* HEADER SAAS MODERN */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 md:p-10 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl md:text-3xl font-serif font-bold mb-2">Manajemen Produk</h2>
          <p className="text-slate-300 text-sm max-w-md leading-relaxed">
            Kelola etalase toko Anda. Tambah produk baru, perbarui stok, atau sesuaikan harga untuk meningkatkan penjualan.
          </p>
        </div>
        <button 
          onClick={onAddNew}
          className="relative z-10 bg-emerald-500 text-white flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold uppercase tracking-widest shadow-lg hover:bg-emerald-600 hover:-translate-y-0.5 transition-all duration-300"
        >
          <FiPlus size={18} /> Tambah Produk
        </button>
        {/* Orbs Dekorasi */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/20 rounded-full blur-[60px]"></div>
      </div>

      {/* TABEL PRODUK */}
      <div className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-50 overflow-hidden min-h-[400px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-sm font-bold animate-pulse">Memuat etalase produk...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm text-slate-600 min-w-[800px]">
              <thead className="bg-slate-50/80 text-xs uppercase font-bold text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5">Informasi Produk</th>
                  <th className="px-6 py-5">Kategori</th>
                  <th className="px-6 py-5">Harga Jual</th>
                  <th className="px-6 py-5">Sisa Stok</th>
                  <th className="px-8 py-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5 font-bold text-slate-800 flex items-center gap-4">
                      <div className="w-16 h-16 bg-white rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center shrink-0 shadow-sm p-1">
                        {prod.image ? (
                          <img src={prod.image} alt={prod.name} className="w-full h-full object-contain rounded-xl hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <FiImage className="text-slate-300" size={20} />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="truncate max-w-[220px] text-sm group-hover:text-primary transition-colors">{prod.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium mt-1 truncate max-w-[220px] uppercase tracking-wider">{prod.category.split('>').pop()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider">{prod.category.split('>')[0]}</span>
                    </td>
                    <td className="px-6 py-5 font-bold text-emerald-600">
                      Rp {prod.price.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`${prod.stock > 10 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'} border px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider`}>
                        {prod.stock} Tersedia
                      </span>
                    </td>
                    <td className="px-8 py-5 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => navigate(`edit-product/${prod.id}`)} 
                        className="p-2.5 text-slate-400 hover:text-blue-500 bg-white hover:bg-blue-50 shadow-sm border border-slate-100 rounded-xl transition-all" 
                        title="Edit Product"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(prod.id)} 
                        className="p-2.5 text-slate-400 hover:text-rose-500 bg-white hover:bg-rose-50 shadow-sm border border-slate-100 rounded-xl transition-all" 
                        title="Delete Product"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[400px] text-slate-400">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100 shadow-inner">
              <FiBox size={32} className="text-slate-300" />
            </div>
            <p className="text-lg font-bold text-slate-600">Produk Tidak Ditemukan</p>
            <p className="text-sm mt-1 mb-6 max-w-sm text-center">
              {searchQuery ? `Tidak ada barang yang cocok dengan kata kunci "${searchQuery}"` : "Etalase toko Anda masih kosong. Mulai tambahkan produk pertama Anda!"}
            </p>
            {!searchQuery && (
              <button onClick={onAddNew} className="text-xs font-bold text-primary border border-primary px-5 py-2.5 rounded-xl hover:bg-primary hover:text-white transition-all">
                Tambah Produk Sekarang
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}