import React, { useState, useRef } from 'react';
import { FiUploadCloud, FiChevronLeft, FiSave, FiChevronDown, FiX, FiPlus, FiBox } from 'react-icons/fi';
import Swal from 'sweetalert2';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';

const CATEGORY_TREE = {
  "Elektronik": ["Smartphone", "Tablet", "Laptop", "Aksesoris Komputer", "Alat Pendingin Ruangan", "TV & Aksesoris", "Lainnya"],
  "Fashion Pria": ["Kaos", "Kemeja", "Celana Panjang", "Jaket & Outer", "Pakaian Dalam", "Lainnya"],
  "Fashion Wanita": ["Atasan", "Gaun", "Celana", "Rok", "Pakaian Tidur", "Lainnya"],
  "Sepatu": ["Sneakers", "Sepatu Formal", "Sandal", "Boots", "Sepatu Olahraga"],
  "Kecantikan": ["Makeup", "Perawatan Wajah", "Parfum", "Perawatan Rambut"],
  "Lain-Lain": ["Aksesoris", "Tas", "Peralatan Rumah", "Lainnya"]
};

export default function AddProduct({ onCancel }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Basic information');
  const tabs = ['Basic information', 'Images', 'Variations & Options', 'Shipping'];
  
  const fileInputRef = useRef(null);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [colorInput, setColorInput] = useState('');
  const [varInput, setVarInput] = useState({ name: '', price: '', stock: '' });

  const [formData, setFormData] = useState({
    name: '', category: 'Elektronik', subCategory: 'Smartphone', description: '',
    price: '', stock: '', weight: '', length: '', width: '', height: '',
    variations: [], colors: [],
  });

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
      setFormData(prev => ({
        ...prev,
        variations: [...prev.variations, { 
          name: varInput.name.trim(), price: parseFloat(varInput.price), stock: parseInt(varInput.stock)
        }]
      }));
      setVarInput({ name: '', price: '', stock: '' });
    } else {
      Swal.fire('Data Tidak Lengkap', 'Masukkan nama varian, harga, dan stok spesifiknya!', 'warning');
    }
  };
  const handleRemoveVariation = (idxToRemove) => {
    setFormData(prev => ({ ...prev, variations: prev.variations.filter((_, idx) => idx !== idxToRemove) }));
  };

  const handleTabChange = (newTab) => {
    const currentIndex = tabs.indexOf(activeTab);
    const targetIndex = tabs.indexOf(newTab);
    if (targetIndex > currentIndex) {
      if (activeTab === 'Basic information' && (!formData.name || !formData.description)) {
        Swal.fire('Oops...', 'Lengkapi Product Name dan Description!', 'warning'); return;
      }
      if (activeTab === 'Images' && imageFiles.length === 0) {
        Swal.fire('Gambar Kosong', 'Upload minimal 1 gambar cover!', 'info'); return;
      }
      if (activeTab === 'Variations & Options' && (!formData.price || !formData.stock)) {
         Swal.fire('Harga Dasar Kosong', 'Isi harga dan stok default produk Anda!', 'warning'); return;
      }
    }
    setActiveTab(newTab);
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (imageFiles.length + files.length > 20) {
      Swal.fire('Batas Maksimal', 'Hanya diperbolehkan maksimal 20 gambar.', 'error'); return;
    }
    setImageFiles(prev => [...prev, ...files]);
    setImagePreviews(prev => [...prev, ...files.map(file => URL.createObjectURL(file))]);
  };

  const removeImage = (indexToRemove) => {
    setImagePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
    setImageFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    Swal.fire({ title: 'Menyimpan Produk...', allowOutsideClick: false, didOpen: () => { Swal.showLoading() } });

    try {
      let uploadedImageUrls = [];
      for (const file of imageFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `products/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
        uploadedImageUrls.push(publicUrl);
      }

      const fullCategory = `${formData.category} > ${formData.subCategory}`;

      const { error: insertError } = await supabase.from('products').insert([{
        seller_id: user.id, name: formData.name, category: fullCategory, description: formData.description,
        price: parseFloat(formData.price), stock: parseInt(formData.stock), variations: formData.variations, colors: formData.colors,         
        weight: formData.weight ? parseFloat(formData.weight) : null, length: formData.length ? parseFloat(formData.length) : null,
        width: formData.width ? parseFloat(formData.width) : null, height: formData.height ? parseFloat(formData.height) : null,
        image: uploadedImageUrls.length > 0 ? uploadedImageUrls[0] : null, image_urls: uploadedImageUrls
      }]);

      if (insertError) throw insertError;
      Swal.fire('Sukses!', 'Produk berhasil dipublikasikan.', 'success').then(() => onCancel());
    } catch (error) {
      Swal.fire('Gagal', error.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in pb-20 pt-2">
      <button type="button" onClick={onCancel} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-primary transition-colors mb-6 cursor-pointer">
        <FiChevronLeft size={16} /> Kembali ke Etalase
      </button>
      
      <div className="mb-8">
        <h2 className="text-3xl font-serif font-bold text-slate-800 flex items-center gap-3">
          <FiBox className="text-primary"/> Tambah Produk Baru
        </h2>
        <p className="text-sm text-slate-500 mt-2">Lengkapi detail produk Anda agar menarik bagi pembeli.</p>
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

        <form onSubmit={handleSave} className="p-8 md:p-12 space-y-8">
          
          {activeTab === 'Basic information' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nama Produk <span className="text-rose-500">*</span></label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Cth: iPhone 15 Pro Max 256GB" className="w-full bg-slate-50 border border-transparent focus:border-primary/30 rounded-2xl py-4 px-5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner" />
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
                    {CATEGORY_TREE[formData.category].map(sub => <option key={sub} value={sub}>{sub}</option>)}
                  </select>
                  <FiChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Deskripsi Produk <span className="text-rose-500">*</span></label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows="8" required placeholder="Jelaskan keunggulan, spesifikasi detail, dan kondisi produk Anda..." className="w-full bg-slate-50 border border-transparent focus:border-primary/30 rounded-2xl py-4 px-5 text-sm text-slate-700 leading-relaxed focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner resize-none"></textarea>
              </div>
            </div>
          )}

          {activeTab === 'Images' && (
            <div className="animate-fade-in space-y-6">
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                <p className="text-sm text-blue-700 font-bold">Panduan Foto Produk</p>
                <p className="text-xs text-blue-600 mt-1">Upload foto dengan pencahayaan terang. Maksimal 20 foto (.jpg / .png). Foto pertama akan menjadi cover utama.</p>
              </div>

              <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleImageSelect} className="hidden" />
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {imagePreviews.length < 20 && (
                  <button type="button" onClick={() => fileInputRef.current.click()} className="aspect-square w-full border-2 border-dashed border-primary/40 bg-primary/5 rounded-3xl flex flex-col items-center justify-center text-primary hover:bg-primary/10 hover:border-primary transition-all cursor-pointer group">
                    <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <FiUploadCloud size={24} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider">Browse</span>
                  </button>
                )}
                
                {imagePreviews.map((src, idx) => (
                  <div key={idx} className="relative aspect-square w-full rounded-3xl overflow-hidden group shadow-md border border-slate-100">
                    <img src={src} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <button type="button" onClick={() => removeImage(idx)} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white text-rose-500 rounded-full opacity-0 group-hover:opacity-100 transition-all flex justify-center items-center hover:bg-rose-500 hover:text-white cursor-pointer shadow-lg transform scale-50 group-hover:scale-100"><FiX size={20} /></button>
                    {idx === 0 && <span className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-sm text-primary text-[10px] py-1.5 rounded-lg text-center font-bold tracking-widest shadow-sm">COVER UTAMA</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Variations & Options' && (
            <div className="space-y-10 animate-fade-in">
              
              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                <h4 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-widest">Informasi Dasar</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Harga Jual Dasar (Rp) <span className="text-rose-500">*</span></label>
                    <input type="number" name="price" value={formData.price} onChange={handleChange} required placeholder="Cth: 15000000" className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-5 font-bold text-slate-800 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Total Stok Keseluruhan <span className="text-rose-500">*</span></label>
                    <input type="number" name="stock" value={formData.stock} onChange={handleChange} required placeholder="Cth: 50" className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-5 font-bold text-slate-800 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm" />
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Varian & Spesifikasi (Opsional)</h4>
                  <p className="text-xs text-slate-500 mt-1">Tambahkan opsi seperti "12/256GB" atau "Bundling Charger". Setiap varian bisa memiliki harga dan stok berbeda.</p>
                </div>
                
                <div className="flex flex-col lg:flex-row gap-4 mb-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <div className="flex-1"><input type="text" value={varInput.name} onChange={(e) => setVarInput({...varInput, name: e.target.value})} placeholder="Nama Varian (Cth: 12/256GB)" className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 px-5 text-sm font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 shadow-sm" /></div>
                  <div className="w-full lg:w-48"><input type="number" value={varInput.price} onChange={(e) => setVarInput({...varInput, price: e.target.value})} placeholder="Harga (Rp)" className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 px-5 text-sm font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 shadow-sm" /></div>
                  <div className="w-full lg:w-40"><input type="number" value={varInput.stock} onChange={(e) => setVarInput({...varInput, stock: e.target.value})} placeholder="Stok Varian" className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 px-5 text-sm font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 shadow-sm" /></div>
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
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-1">Pilihan Warna (Opsional)</h4>
                <p className="text-xs text-slate-500 mb-6">Ketik nama warna dan klik Add (Cth: Titanium Blue).</p>
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
                <p className="text-xs text-amber-600 mt-1">Data berat dan dimensi paket dibutuhkan oleh kurir pengiriman (JNE, SiCepat, dll) untuk menghitung ongkos kirim.</p>
              </div>
              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Berat Paket (Gram)</label>
                <input type="number" name="weight" value={formData.weight} onChange={handleChange} placeholder="Cth: 500" className="w-full bg-slate-50 border border-transparent focus:border-primary/30 rounded-2xl py-4 px-5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner" />
              </div>
              <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Panjang (cm)</label><input type="number" name="length" value={formData.length} onChange={handleChange} className="w-full bg-slate-50 border border-transparent focus:border-primary/30 rounded-2xl py-4 px-5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner" /></div>
                <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Lebar (cm)</label><input type="number" name="width" value={formData.width} onChange={handleChange} className="w-full bg-slate-50 border border-transparent focus:border-primary/30 rounded-2xl py-4 px-5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner" /></div>
                <div><label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Tinggi (cm)</label><input type="number" name="height" value={formData.height} onChange={handleChange} className="w-full bg-slate-50 border border-transparent focus:border-primary/30 rounded-2xl py-4 px-5 text-sm font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner" /></div>
              </div>
            </div>
          )}

          {/* AREA TOMBOL BAWAH */}
          <div className="flex flex-col-reverse md:flex-row justify-between items-center pt-10 mt-10 border-t border-slate-100 gap-4">
            <p className="text-xs font-bold text-slate-400 tracking-wider uppercase hidden md:block">
              {activeTab === 'Shipping' ? 'Langkah Terakhir' : `Langkah ${tabs.indexOf(activeTab) + 1} dari 4`}
            </p>
            <div className="flex gap-4 w-full md:w-auto">
              <button type="button" onClick={() => handleTabChange(tabs[tabs.indexOf(activeTab) + 1])} className={`flex-1 md:flex-none px-8 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest text-primary border-2 border-primary/20 hover:bg-primary/5 transition-all cursor-pointer ${activeTab === 'Shipping' ? 'hidden' : 'block'}`}>
                Lanjut Ke Tahap Berikutnya
              </button>
              {activeTab === 'Shipping' && (
                <button type="submit" disabled={isSubmitting} className="w-full md:w-auto bg-primary text-white flex justify-center items-center gap-3 px-10 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-elegant hover:bg-accent hover:-translate-y-1 disabled:opacity-50 transition-all cursor-pointer">
                  <FiSave size={18} /> {isSubmitting ? 'Memproses...' : 'Publikasikan Produk'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}