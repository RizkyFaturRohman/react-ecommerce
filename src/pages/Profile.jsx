import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { FiUser, FiSave, FiCheck } from 'react-icons/fi';

export default function Profile() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // State untuk menyimpan inputan form
  const [formData, setFormData] = useState({
    fullName: '',
    shopName: '',
  });

  // Isi otomatis form dengan data yang ada di database saat ini
  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.full_name || '',
        shopName: profile.shop_name || '',
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      // Siapkan data yang akan di-update ke tabel profiles
      const updates = {
        full_name: formData.fullName,
        shop_name: profile.role === 'penjual' ? formData.shopName : null,
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id); // Update hanya data milik user yang sedang login

      if (error) throw error;
      
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      
      // Refresh halaman agar Header mengambil data nama yang baru
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="min-h-[60vh] flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <section className="py-16 md:py-24 bg-surface min-h-[80vh]">
      <div className="max-w-3xl mx-auto px-6 md:px-12">
        
        <div className="mb-12 border-b border-gray-200 pb-6 flex items-center gap-4">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center text-primary border border-gray-300">
            <FiUser size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-serif text-primary">Account Settings</h1>
            <p className="text-sm text-primary-light uppercase tracking-widest mt-1">
              Role: <span className="font-bold text-accent">{profile.role}</span>
            </p>
          </div>
        </div>

        {message.text && (
          <div className={`p-4 mb-8 text-sm rounded-md flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
            {message.type === 'success' && <FiCheck size={16} />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-8 bg-white p-8 md:p-10 shadow-sm border border-gray-100 rounded-xl">
          
          <div>
            <label className="block text-xs uppercase tracking-widest font-bold text-primary mb-3">Email Address</label>
            <input
              type="text"
              disabled
              value={user?.email || ''}
              className="w-full border border-gray-200 bg-gray-50 rounded-md py-3 px-4 text-sm text-gray-500 cursor-not-allowed"
            />
            <p className="text-[10px] text-gray-400 mt-2">*Email cannot be changed.</p>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest font-bold text-primary mb-3">Full Name</label>
            <input
              type="text"
              name="fullName"
              required
              value={formData.fullName}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
            />
          </div>

          {/* Hanya muncul jika user adalah penjual */}
          {profile.role === 'penjual' && (
            <div className="animate-fade-in bg-gray-50 p-6 rounded-lg border border-gray-200">
              <label className="block text-xs uppercase tracking-widest font-bold text-primary mb-3">Shop Name</label>
              <input
                type="text"
                name="shopName"
                required
                value={formData.shopName}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm bg-white"
              />
              <p className="text-[10px] text-gray-500 mt-2">This is the name customers will see on your product pages.</p>
            </div>
          )}

          <div className="pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-surface py-4 px-8 rounded-md uppercase tracking-[0.2em] text-xs font-bold hover:bg-accent transition-all shadow-md flex items-center gap-2 disabled:opacity-70"
            >
              <FiSave size={16} />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

        </form>

      </div>
    </section>
  );
}