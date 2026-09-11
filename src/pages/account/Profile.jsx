import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import { FiCamera, FiMail, FiUser, FiPhone, FiCalendar, FiShield, FiLock, FiCheck } from 'react-icons/fi';
import Swal from 'sweetalert2';

// IMPORT KALENDER MODERN
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function Profile() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef(null);

    // State Formulir Profil
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        gender: 'Laki-laki',
        birthDate: '',
        avatarUrl: ''
    });

    // State untuk menyimpan FILE asli yang akan diupload
    const [selectedFile, setSelectedFile] = useState(null); 

    // MENGAMBIL DATA DARI TABEL PROFILES SUPABASE SAAT HALAMAN DIBUKA
    useEffect(() => {
        const fetchProfile = async () => {
            if (!user?.id) return;
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (error) throw error;
                if (data) {
                    setFormData({
                        fullName: data.full_name || '',
                        phone: data.phone || '',
                        gender: data.gender || 'Laki-laki',
                        birthDate: data.birth_date || '',
                        avatarUrl: data.avatar_url || ''
                    });
                }
            } catch (error) {
                console.error("Gagal mengambil profil:", error);
            }
        };
        fetchProfile();
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAvatarClick = () => {
        fileInputRef.current.click();
    };

    // SAAT GAMBAR DIPILIH (PREVIEW)
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file); // Simpan file asli ke state
            const tempUrl = URL.createObjectURL(file);
            setFormData({ ...formData, avatarUrl: tempUrl }); // Tampilkan preview
        }
    };

    // MENYIMPAN FOTO KE STORAGE & DATA KE TABEL PROFILES
    const handleSaveChanges = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            let finalAvatarUrl = formData.avatarUrl;

            // 1. JIKA ADA FOTO BARU, UPLOAD KE SUPABASE STORAGE
            if (selectedFile) {
                const fileExt = selectedFile.name.split('.').pop();
                const fileName = `${user.id}-${Date.now()}.${fileExt}`; // Nama file unik

                const { error: uploadError } = await supabase.storage
                    .from('avatars') // Sesuai nama bucket SQL tadi
                    .upload(fileName, selectedFile, { upsert: true });

                if (uploadError) throw uploadError;

                // Ambil link Public URL dari foto yang berhasil diupload
                const { data: publicUrlData } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(fileName);

                finalAvatarUrl = publicUrlData.publicUrl;
            }

            // 2. SIMPAN SEMUA DATA (TERMASUK LINK FOTO BARU) KE TABEL
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.fullName,
                    phone: formData.phone,
                    gender: formData.gender,
                    birth_date: formData.birthDate,
                    avatar_url: finalAvatarUrl
                })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // 3. TAMPILKAN SUKSES & REFRESH HALAMAN AGAR HEADER TERUPDATE!
            Swal.fire({
                title: 'Berhasil!',
                text: 'Profil Anda telah diperbarui.',
                icon: 'success',
                confirmButtonText: 'Terapkan Perubahan'
            }).then(() => {
                window.location.reload(); // Memaksa browser merefresh data Header & Sidebar
            });

        } catch (error) {
            console.error(error);
            Swal.fire('Gagal Menyimpan', error.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Placeholder jika avatarUrl kosong
    const displayAvatar = formData.avatarUrl || `https://ui-avatars.com/api/?name=${user?.email?.split('@')[0] || 'User'}&background=f8fafc&color=94a3b8`;

    return (
        <div className="w-full animate-fade-in">
            <div className="mb-8 border-b border-gray-100 pb-6">
                <h2 className="text-2xl font-serif text-primary">Pengaturan Akun</h2>
                <p className="text-sm text-gray-400 mt-1">Kelola informasi profil dan keamanan akun.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-4 flex flex-col items-center gap-8">
                    <div className="flex flex-col items-center bg-slate-50 border border-gray-100 w-full p-8 rounded-3xl shadow-sm">
                        <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md bg-white">
                                <img src={displayAvatar} alt="Profile" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            </div>
                            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center text-white backdrop-blur-sm">
                                <FiCamera size={24} className="mb-1" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Ubah Foto</span>
                            </div>
                        </div>
            
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                        <p className="text-xs text-gray-400 mt-4 text-center max-w-[200px]">Besar file: maksimum 2 Megabytes. Ekstensi file yang diperbolehkan: .JPG .JPEG .PNG</p>
                    </div>
                    {/* ... (Bagian Ubah Password sama seperti sebelumnya, agar kode tidak terlalu panjang saya singkat. Anda bisa membiarkan kotak keamanan tetap ada di sini) ... */}
                </div>

                <div className="lg:col-span-8">
                    <form onSubmit={handleSaveChanges} className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Alamat Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><FiMail className="text-gray-400" /></div>
                                <input type="email" value={user?.email || ''} disabled className="w-full bg-slate-100/50 border-transparent text-gray-500 rounded-xl py-3.5 pl-11 pr-4 text-sm cursor-not-allowed" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nama Lengkap</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><FiUser className="text-gray-400" /></div>
                                    <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full bg-slate-50 border border-transparent focus:border-primary focus:bg-white rounded-xl py-3.5 pl-11 pr-4 text-sm transition-colors outline-none" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nomor Telepon</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><FiPhone className="text-gray-400" /></div>
                                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-slate-50 border border-transparent focus:border-primary focus:bg-white rounded-xl py-3.5 pl-11 pr-4 text-sm transition-colors outline-none" />
                                </div>
                            </div>

                            {/* TANGGAL LAHIR MENGGUNAKAN REACT DATEPICKER */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tanggal Lahir</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                                        <FiCalendar className="text-gray-400" />
                                    </div>
                                    <div className="w-full">
                                        <DatePicker
                                            selected={formData.birthDate ? new Date(formData.birthDate) : null}
                                            onChange={(date) => {
                                                if(date) {
                                                    const yyyy = date.getFullYear();
                                                    const mm = String(date.getMonth() + 1).padStart(2, '0');
                                                    const dd = String(date.getDate()).padStart(2, '0');
                                                    setFormData({ ...formData, birthDate: `${yyyy}-${mm}-${dd}` });
                                                } else {
                                                    setFormData({ ...formData, birthDate: '' });
                                                }
                                            }}
                                            dateFormat="dd/MM/yyyy"
                                            showYearDropdown
                                            scrollableYearDropdown
                                            yearDropdownItemNumber={100}
                                            placeholderText="DD/MM/YYYY"
                                            className="w-full bg-slate-50 border border-transparent focus:border-primary focus:bg-white rounded-xl py-3.5 pl-11 pr-4 text-sm transition-colors outline-none text-gray-600"
                                            wrapperClassName="w-full"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Jenis Kelamin</label>
                                <div className="flex gap-4 h-[46px]">
                                    <label className="flex-1 flex items-center justify-center gap-2 border rounded-xl cursor-pointer transition-colors hover:bg-slate-50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:text-primary">
                                        <input type="radio" name="gender" value="Laki-laki" checked={formData.gender === 'Laki-laki'} onChange={handleChange} className="hidden" />
                                        <span className="text-sm font-medium">Laki-laki</span>
                                    </label>
                                    <label className="flex-1 flex items-center justify-center gap-2 border rounded-xl cursor-pointer transition-colors hover:bg-slate-50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:text-primary">
                                        <input type="radio" name="gender" value="Perempuan" checked={formData.gender === 'Perempuan'} onChange={handleChange} className="hidden" />
                                        <span className="text-sm font-medium">Perempuan</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100">
                            <button type="submit" disabled={isLoading} className="bg-primary text-white px-8 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-accent transition-colors shadow-elegant disabled:opacity-50">
                                {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}