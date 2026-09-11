import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { FiUploadCloud, FiChevronLeft, FiSave, FiChevronDown, FiX, FiPlus, FiEdit3 } from 'react-icons/fi';
import Swal from 'sweetalert2';
import { supabase } from '../../supabaseClient';

const CATEGORY_TREE = {
  "Elektronik": ["Smartphone", "Tablet", "Laptop", "Aksesoris Komputer", "Alat Pendingin Ruangan", "TV & Aksesoris", "Lainnya"],
  "Fashion Pria": ["Kaos", "Kemeja", "Celana Panjang", "Jaket & Outer", "Pakaian Dalam", "Lainnya"],
  "Fashion Wanita": ["Atasan", "Gaun", "Celana", "Rok", "Pakaian Tidur", "Lainnya"],
  "Sepatu": ["Sneakers", "Sepatu Formal", "Sandal", "Boots", "Sepatu Olahraga"],
  "Kecantikan": ["Makeup", "Perawatan Wajah", "Parfum", "Perawatan Rambut"],
  "Lain-Lain": ["Aksesoris", "Tas", "Peralatan Rumah", "Lainnya"]
};

export default function EditProduct({ onCancel }) {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('Basic information');
  const tabs = ['Basic information', 'Images', 'Variations and price', 'Shipping'];
  
  const fileInputRef = useRef(null);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [existingImageUrls, setExistingImageUrls] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [colorInput, setColorInput] = useState('');
  const [varInput, setVarInput] = useState({ name: '', price: '', stock: '' });

  const [formData, setFormData] = useState({
    name: '', category: 'Elektronik', subCategory: 'Smartphone', description: '',
    price: '', stock: '', weight: '', length: '', width: '', height: '',
    variations: [], colors: [],
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
        if (error) throw error;
        
        if (data) {
          let fetchedVariations = data.variations || [];
          if (fetchedVariations.length > 0 && typeof fetchedVariations[0] === 'string') {
            fetchedVariations = fetchedVariations.map(v => ({ name: v, price: data.price, stock: data.stock }));
          }

          // Parsing Kategori (Misal dari format "Elektronik > Smartphone")
          let mainCat = 'Elektronik';
          let subCat = 'Smartphone';
          if (data.category && data.category.includes('>')) {
             const parts = data.category.split('>');
             mainCat = parts[0].trim();
             subCat = parts[1].trim();
          } else if (data.category) {
             mainCat = data.category;
             subCat = CATEGORY_TREE[mainCat]?.[0] || 'Lainnya';
          }

          setFormData({
            name: data.name || '', category: mainCat, subCategory: subCat, description: data.description || '',
            price: data.price || '', stock: data.stock || '', weight: data.weight || '',
            length: data.length || '', width: data.width || '', height: data.height || '',
            variations: fetchedVariations, colors: data.colors || [],
          });
          if (data.image_urls) { setExistingImageUrls(data.image_urls); setImagePreviews(data.image_urls); }
        }
      } catch (err) { console.error(err); Swal.fire('Error', 'Gagal memuat data.', 'error').then(onCancel); } 
      finally { setIsLoadingData(false); }
    };
    fetchProduct();
  }, [id, onCancel]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'category') {
      setFormData({ ...formData, category: value, subCategory: CATEGORY_TREE[value][0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleAddColor = () => {
    if (colorInput.trim() && !formData.colors.includes(colorInput.trim())) {
      setFormData(prev => ({ ...prev, colors: [...prev.colors, colorInput.trim()] }));
      setColorInput('');
    }
  };
  const handleRemoveColor = (col) => setFormData(prev => ({ ...prev, colors: prev.colors.filter(c => c !== col) }));

  const handleAddVariation = () => {
    if (varInput.name.trim() && varInput.price && varInput.stock) {
      setFormData(prev => ({ ...prev, variations: [...prev.variations, { name: varInput.name.trim(), price: parseFloat(varInput.price), stock: parseInt(varInput.stock) }] }));
      setVarInput({ name: '', price: '', stock: '' });
    } else {
      Swal.fire('Data Kurang', 'Lengkapi nama, harga, dan stok varian!', 'warning');
    }
  };
  const handleRemoveVariation = (idxToRemove) => setFormData(prev => ({ ...prev, variations: prev.variations.filter((_, idx) => idx !== idxToRemove) }));

  const handleTabChange = (newTab) => setActiveTab(newTab);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 20) { Swal.fire('Maksimal 20 Gambar', 'Hanya 20 gambar diizinkan.', 'error'); return; }
    setImageFiles(files); setExistingImageUrls([]); 
    setImagePreviews(files.map(file => URL.createObjectURL(file)));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    Swal.fire({ title: 'Memperbarui...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
      let finalImageUrls = existingImageUrls;
      if (imageFiles.length > 0) {
        finalImageUrls = [];
        for (const file of imageFiles) {
          const fileExt = file.name.split('.').pop();
          const filePath = `products/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          await supabase.storage.from('product-images').upload(filePath, file);
          const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
          finalImageUrls.push(publicUrl);
        }
      }

      const fullCategory = `${formData.category} > ${formData.subCategory}`;

      const { error } = await supabase.from('products').update({
        name: formData.name, category: fullCategory, description: formData.description,
        price: parseFloat(formData.price), stock: parseInt(formData.stock),
        variations: formData.variations, colors: formData.colors,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        length: formData.length ? parseFloat(formData.length) : null,
        width: formData.width ? parseFloat(formData.width) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        image: finalImageUrls.length > 0 ? finalImageUrls[0] : null, image_urls: finalImageUrls
      }).eq('id', id);

      if (error) throw error;
      Swal.fire('Sukses!', 'Produk berhasil diperbarui.', 'success').then(onCancel);
    } catch (err) { Swal.fire('Gagal', err.message, 'error'); } 
    finally { setIsSubmitting(false); }
  };

  if (isLoadingData) return <div className="flex flex-col items-center justify-center h-[60vh]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div><p className="font-bold text-slate-400">Menarik data produk...</p></div>;

  return (
    <div className="max-w-5xl mx-auto animate-fade-in pb-20 pt-2">
      <button type="button" onClick={onCancel} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-primary transition-colors mb-6 cursor-pointer">
        <FiChevronLeft size={16} /> Kembali ke Etalase
      </button>
      
      <div className="mb-8">
        <h2 className="text-3xl font-serif font-bold text-slate-800 flex items-center gap-3">
          <FiEdit3 className="text-primary"/> Edit Produk
        </h2>
        <p className="text-sm text-slate-500 mt-2">Perbarui informasi, harga, atau stok produk ini.</p>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        
        {/* TAB NAVIGASI MODERN */}
        <div className="flex p-4 border-b border-slate-100 bg-slate-50/50 overflow-x-auto custom-scrollbar gap-2">
          {tabs.map((tab) => (
            <button 
              key={tab} type="button" onClick={() => handleTabChange(tab)} 
              className={`px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${
                activeTab === tab 
                ? 'bg-white text-primary shadow-md border border-slate-100 scale-105' 
                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <form onSubmit={handleUpdate} className="p-8 md:p-12 space-y-8">
          
          {activeTab === 'Basic information' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nama Produk <span className="text-rose-500">*</span></label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full bg-slate-50 border border-transparent focus:border-primary/30 rounded-2xl py-4 px-5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Kategori Utama</label>
                <div className="relative">
                  <select name="category" value={formData.category} onChange={handleChange} className="w-full appearance-none bg-slate-50 border border-transparent focus:border-primary/30 rounded-2xl py-4 pl-5 pr-12 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 outline-none cursor-pointer transition-all shadow-inner">
                    {Object.keys(CATEGORY_TREE).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  <FiChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Sub Kategori</label>
                <div className="relative">
                  <select name="subCategory" value={formData.subCategory} onChange={handleChange} className="w-full appearance-none bg-slate-50 border border-transparent focus:border-primary/30 rounded-2xl py-4 pl-5 pr-12 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 outline-none cursor-pointer transition-all shadow-inner">
                    {CATEGORY_TREE[formData.category]?.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                  </select>
                  <FiChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Deskripsi Produk <span className="text-rose-500">*</span></label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows="8" required className="w-full bg-slate-50 border border-transparent focus:border-primary/30 rounded-2xl py-4 px-5 text-sm text-slate-700 leading-relaxed focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner resize-none"></textarea>
              </div>
            </div>
          )}

          {activeTab === 'Images' && (
            <div className="animate-fade-in space-y-6">
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5">
                <p className="text-sm text-rose-700 font-bold">Peringatan Gambar</p>
                <p className="text-xs text-rose-600 mt-1">Mengupload gambar baru di sini akan menghapus dan mengganti *seluruh* foto produk yang lama.</p>
              </div>

              <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleImageSelect} className="hidden" />
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                <button type="button" onClick={() => fileInputRef.current.click()} className="aspect-square w-full border-2 border-dashed border-primary/40 bg-primary/5 rounded-3xl flex flex-col items-center justify-center text-primary hover:bg-primary/10 hover:border-primary transition-all cursor-pointer group">
                  <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <FiUploadCloud size={24} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-center px-2">Ganti Semua Foto</span>
                </button>
                
                {imagePreviews.map((src, idx) => (
                  <div key={idx} className="relative aspect-square w-full rounded-3xl overflow-hidden group shadow-md border border-slate-100">
                    <img src={src} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    {idx === 0 && <span className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-sm text-primary text-[10px] py-1.5 rounded-lg text-center font-bold tracking-widest shadow-sm">COVER UTAMA</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Variations and price' && (
            <div className="space-y-10 animate-fade-in">
              
              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                <h4 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-widest">Informasi Dasar</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Harga Jual Dasar (Rp) <span className="text-rose-500">*</span></label>
                    <input type="number" name="price" value={formData.price} onChange={handleChange} required className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-5 font-bold text-slate-800 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total Stok Keseluruhan <span className="text-rose-500">*</span></label>
                    <input type="number" name="stock" value={formData.stock} onChange={handleChange} required className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-5 font-bold text-slate-800 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm" />
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Varian & Spesifikasi</h4>
                </div>
                
                <div className="flex flex-col lg:flex-row gap-4 mb-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <div className="flex-1"><input type="text" value={varInput.name} onChange={(e) => setVarInput({...varInput, name: e.target.value})} placeholder="Nama Varian (Cth: 12/256GB)" className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 px-5 text-sm font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 shadow-sm" /></div>
                  <div className="w-full lg:w-48"><input type="number" value={varInput.price} onChange={(e) => setVarInput({...varInput, price: e.target.value})} placeholder="Harga (Rp)" className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 px-5 text-sm font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 shadow-sm" /></div>
                  <div className="w-full lg:w-40"><input type="number" value={varInput.stock} onChange={(e) => setVarInput({...varInput, stock: e.target.value})} placeholder="Stok" className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 px-5 text-sm font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 shadow-sm" /></div>
                  <button type="button" onClick={handleAddVariation} className="bg-slate-800 text-white px-6 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors shadow-md flex justify-center items-center gap-2 cursor-pointer"><FiPlus size={16} /> Tambah</button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {formData.variations.map((v, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-slate-800">{v.name}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Stok: {v.stock} pcs</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 text-xs">Rp {v.price.toLocaleString('id-ID')}</span>
                        <button type="button" onClick={() => handleRemoveVariation(idx)} className="text-rose-400 hover:text-white hover:bg-rose-500 w-8 h-8 flex items-center justify-center rounded-full transition-colors"><FiX size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-6">Pilihan Warna</h4>
                <div className="flex gap-4 mb-6 max-w-lg">
                  <input type="text" value={colorInput} onChange={(e) => setColorInput(e.target.value)} placeholder="Masukkan nama warna..." className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-5 text-sm font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 shadow-sm" />
                  <button type="button" onClick={handleAddColor} className="bg-slate-800 text-white px-8 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors shadow-md cursor-pointer">Add</button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {formData.colors.map(col => (
                    <span key={col} className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-3 shadow-sm">{col} <FiX className="cursor-pointer text-rose-400 hover:text-rose-600" onClick={() => handleRemoveColor(col)} size={16} /></span>
                  ))}
                </div>
              </div>

            </div>
          )}

          {activeTab === 'Shipping' && (
             <div className="grid grid-cols-1 md:grid-cols-4 gap-8 animate-fade-in">
              <div className="md:col-span-4 bg-amber-50 border border-amber-100 rounded-2xl p-5">
                <p className="text-sm text-amber-700 font-bold">Pengaturan Logistik</p>
              </div>
              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Berat Paket (Gram)</label>
                <input type="number" name="weight" value={formData.weight} onChange={handleChange} className="w-full bg-slate-50 border border-transparent focus:border-primary/30 rounded-2xl py-4 px-5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner" />
              </div>
              <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Panjang (cm)</label><input type="number" name="length" value={formData.length} onChange={handleChange} className="w-full bg-slate-50 border border-transparent focus:border-primary/30 rounded-2xl py-4 px-5 text-sm font-bold text-slate-800 outline-none transition-all" /></div>
                <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Lebar (cm)</label><input type="number" name="width" value={formData.width} onChange={handleChange} className="w-full bg-slate-50 border border-transparent focus:border-primary/30 rounded-2xl py-4 px-5 text-sm font-bold text-slate-800 outline-none transition-all" /></div>
                <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Tinggi (cm)</label><input type="number" name="height" value={formData.height} onChange={handleChange} className="w-full bg-slate-50 border border-transparent focus:border-primary/30 rounded-2xl py-4 px-5 text-sm font-bold text-slate-800 outline-none transition-all" /></div>
              </div>
            </div>
          )}

          {/* AREA TOMBOL BAWAH */}
          <div className="flex flex-col-reverse md:flex-row justify-between items-center pt-10 mt-10 border-t border-slate-100 gap-4">
            <p className="text-xs font-bold text-slate-400 tracking-wider uppercase hidden md:block">
              {activeTab === 'Shipping' ? 'Langkah Terakhir' : `Langkah ${tabs.indexOf(activeTab) + 1} dari 4`}
            </p>
            <div className="flex gap-4 w-full md:w-auto">
              {activeTab !== 'Shipping' ? (
                <button type="button" onClick={() => handleTabChange(tabs[tabs.indexOf(activeTab) + 1])} className="w-full md:w-auto px-10 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest text-primary border-2 border-primary/20 hover:bg-primary/5 transition-all cursor-pointer">
                  Lanjut Ke Tahap Berikutnya
                </button>
              ) : (
                <button type="submit" disabled={isSubmitting} className="w-full md:w-auto bg-primary text-white flex justify-center items-center gap-3 px-10 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-elegant hover:bg-accent hover:-translate-y-1 disabled:opacity-50 transition-all cursor-pointer">
                  <FiSave size={18} /> {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}