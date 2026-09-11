import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import { FiMapPin, FiPlus, FiTrash2, FiEdit2, FiCheck, FiX } from 'react-icons/fi';
import Swal from 'sweetalert2';

export default function Addresses() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // State untuk Tampungan Form Alamat
  const [formData, setFormData] = useState({
    label: '',
    receiverName: '',
    phone: '',
    completeAddress: '', 
    city: '',
    postalCode: '',
    isDefault: false 
  });

  // 1. MENGAMBIL DAFTAR ALAMAT
  const fetchAddresses = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('profile_id', user.id)
        .order('is_main', { ascending: false }) // Disesuaikan dengan kolom is_main
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error("Gagal mengambil alamat:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleEditClick = (address) => {
    setEditingId(address.id);
    setFormData({
      label: address.label,
      receiverName: address.receiver_name,
      phone: address.phone,
      completeAddress: address.full_address, // Disesuaikan dengan kolom full_address
      city: address.city,
      postalCode: address.postal_code,
      isDefault: address.is_main // Disesuaikan dengan kolom is_main
    });
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({ label: '', receiverName: '', phone: '', completeAddress: '', city: '', postalCode: '', isDefault: false });
  };

  // 2. FUNGSI SIMPAN (TAMBAH / UPDATE)
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Jika alamat diset jadi Utama (is_main), matikan yang lain dulu
      if (formData.isDefault) {
        await supabase
          .from('user_addresses')
          .update({ is_main: false }) // Disesuaikan
          .eq('profile_id', user.id);
      }

      const payload = {
        profile_id: user.id,
        label: formData.label,
        receiver_name: formData.receiverName,
        phone: formData.phone,
        full_address: formData.completeAddress, // Disesuaikan mapping-nya
        city: formData.city,
        postal_code: formData.postalCode,
        is_main: formData.isDefault || addresses.length === 0 // Disesuaikan mapping-nya
      };

      if (editingId) {
        const { error } = await supabase.from('user_addresses').update(payload).eq('id', editingId);
        if (error) throw error;
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Alamat berhasil diperbarui', showConfirmButton: false, timer: 2000 });
      } else {
        const { error } = await supabase.from('user_addresses').insert([payload]);
        if (error) throw error;
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Alamat baru berhasil ditambahkan', showConfirmButton: false, timer: 2000 });
      }

      resetForm();
      fetchAddresses();
    } catch (error) {
      Swal.fire('Gagal Menyimpan', error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. SET ALAMAT UTAMA INSTAN
  const handleSetDefault = async (addressId) => {
    try {
      await supabase.from('user_addresses').update({ is_main: false }).eq('profile_id', user.id); // Disesuaikan
      const { error } = await supabase.from('user_addresses').update({ is_main: true }).eq('id', addressId); // Disesuaikan
      if (error) throw error;
      fetchAddresses();
    } catch (error) {
      Swal.fire('Gagal', error.message, 'error');
    }
  };

  // 4. HAPUS ALAMAT
  const handleDeleteAddress = async (address) => {
    if (address.is_main) { // Disesuaikan
      Swal.fire('Gagal Menghapus', 'Alamat utama tidak bisa dihapus. Silakan set alamat lain sebagai utama terlebih dahulu.', 'warning');
      return;
    }

    Swal.fire({
      title: 'Hapus Alamat?',
      text: `Apakah Anda yakin ingin menghapus alamat "${address.label}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const { error } = await supabase.from('user_addresses').delete().eq('id', address.id);
          if (error) throw error;
          setAddresses(prev => prev.filter(item => item.id !== address.id));
          Swal.fire('Terhapus!', 'Alamat berhasil dihapus.', 'success');
        } catch (error) {
          Swal.fire('Gagal', error.message, 'error');
        }
      }
    });
  };

  return (
    <div className="w-full animate-fade-in space-y-6">
      
      {/* HEADER PAGE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <h2 className="text-2xl font-serif text-primary">Daftar Alamat</h2>
          <p className="text-sm text-gray-400 mt-1">Kelola tujuan pengiriman belanjaan Anda dengan mudah.</p>
        </div>
        {!isFormOpen && (
          <button 
            onClick={() => setIsFormOpen(true)}
            className="text-xs font-bold bg-primary text-white px-5 py-3 rounded-xl hover:bg-accent transition-all shadow-elegant flex items-center justify-center gap-2"
          >
            <FiPlus size={16} /> Tambah Alamat Baru
          </button>
        )}
      </div>

      {/* FORM MODAL / COLLAPSIBLE CONTAINER */}
      {isFormOpen && (
        <form onSubmit={handleSaveAddress} className="bg-slate-50 border border-gray-100 p-6 md:p-8 rounded-3xl space-y-6 animate-fade-in relative">
          <button type="button" onClick={resetForm} className="absolute top-6 right-6 text-gray-400 hover:text-primary transition-colors"><FiX size={20} /></button>
          <h3 className="text-base font-serif font-bold text-primary mb-2">{editingId ? 'Edit Alamat Pengiriman' : 'Tambah Alamat Pengiriman Baru'}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Label Alamat</label>
              <input type="text" name="label" value={formData.label} onChange={handleInputChange} required className="w-full bg-white border border-gray-200 focus:border-primary rounded-xl py-3 px-4 text-sm outline-none transition-colors" placeholder="Contoh: Rumah, Kantor, Kosan" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nama Penerima</label>
              <input type="text" name="receiverName" value={formData.receiverName} onChange={handleInputChange} required className="w-full bg-white border border-gray-200 focus:border-primary rounded-xl py-3 px-4 text-sm outline-none transition-colors" placeholder="Nama lengkap penerima" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nomor Telepon</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required className="w-full bg-white border border-gray-200 focus:border-primary rounded-xl py-3 px-4 text-sm outline-none transition-colors" placeholder="Nomor aktif HP penerima" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Kota / Kabupaten</label>
              <input type="text" name="city" value={formData.city} onChange={handleInputChange} required className="w-full bg-white border border-gray-200 focus:border-primary rounded-xl py-3 px-4 text-sm outline-none transition-colors" placeholder="Masukkan nama kota" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Alamat Lengkap</label>
              <textarea name="completeAddress" value={formData.completeAddress} onChange={handleInputChange} required rows="3" className="w-full bg-white border border-gray-200 focus:border-primary rounded-xl py-3 px-4 text-sm outline-none transition-colors resize-none" placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, dan kecamatan"></textarea>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Kode Pos</label>
              <input type="text" name="postalCode" value={formData.postalCode} onChange={handleInputChange} required className="w-full bg-white border border-gray-200 focus:border-primary rounded-xl py-3 px-4 text-sm outline-none transition-colors" placeholder="5 digit kode pos" />
            </div>
            <div className="flex items-center h-[52px]">
              <label className="flex items-center gap-3 cursor-pointer text-sm font-medium text-gray-600 select-none">
                <input type="checkbox" name="isDefault" checked={formData.isDefault} onChange={handleInputChange} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                Jadikan Alamat Utama (Default)
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200/60">
            <button type="submit" disabled={isLoading} className="bg-primary text-white px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-accent transition-colors disabled:opacity-50">
              {editingId ? 'Simpan Pembaruan' : 'Simpan Alamat'}
            </button>
            <button type="button" onClick={resetForm} className="border border-gray-200 text-gray-500 px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors">Batal</button>
          </div>
        </form>
      )}

      {/* RENDER LIST ALAMAT */}
      {isLoading && addresses.length === 0 ? (
        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
      ) : addresses.length > 0 ? (
        <div className="space-y-4">
          {addresses.map((addr) => (
            <div 
              key={addr.id} 
              className={`p-6 border rounded-3xl transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white ${
                addr.is_main ? 'border-primary ring-1 ring-primary/30 shadow-sm' : 'border-gray-100 hover:border-gray-300' // Disesuaikan
              }`}
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h4 className="text-sm font-bold text-primary">{addr.label}</h4>
                  {addr.is_main && ( // Disesuaikan
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                      <FiCheck size={12} /> Alamat Utama
                    </span>
                  )}
                </div>
                
                <p className="text-sm font-medium text-primary-light">
                  {addr.receiver_name} <span className="text-gray-400 font-normal">({addr.phone})</span>
                </p>
                <p className="text-xs text-gray-500 leading-relaxed max-w-2xl">
                  {addr.full_address}, {addr.city}, {addr.postal_code} {/* Disesuaikan */}
                </p>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-4 md:pt-0 border-t md:border-t-0 border-gray-50">
                {!addr.is_main && ( // Disesuaikan
                  <button 
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-xs font-bold text-gray-400 hover:text-primary border border-gray-200 hover:border-gray-300 px-3.5 py-2 rounded-xl transition-colors bg-white"
                  >
                    Set Utama
                  </button>
                )}
                <button 
                  onClick={() => handleEditClick(addr)}
                  className="p-2.5 border border-gray-100 text-gray-400 hover:text-primary hover:bg-slate-50 rounded-xl transition-colors"
                  title="Edit Alamat"
                >
                  <FiEdit2 size={15} />
                </button>
                <button 
                  onClick={() => handleDeleteAddress(addr)}
                  className="p-2.5 border border-gray-100 text-gray-400 hover:text-red-500 hover:bg-red-50/50 rounded-xl transition-colors"
                  title="Hapus Alamat"
                >
                  <FiTrash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center flex flex-col items-center border border-dashed border-gray-200 rounded-3xl bg-white">
          <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-gray-300 border border-gray-100"><FiMapPin size={22} /></div>
          <h3 className="text-base font-bold text-gray-400">Belum Ada Alamat</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-xs">Tambahkan alamat pengiriman Anda untuk mempermudah proses checkout pesanan.</p>
        </div>
      )}

    </div>
  );
}