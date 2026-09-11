import React from 'react';
import { FiTarget, FiShield, FiHeart } from 'react-icons/fi';

export default function About() {
  return (
    <div className="min-h-screen bg-surface pt-28 pb-20 animate-fade-in">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Hero Section */}
        <div className="relative rounded-3xl overflow-hidden bg-primary h-[400px] mb-20 flex items-center justify-center text-center px-6">
          <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center"></div>
          <div className="relative z-10 max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-serif text-white mb-6">Mendefinisikan Ulang Pengalaman Belanja.</h1>
            <p className="text-sm md:text-base text-gray-300 leading-relaxed">
              Berbasis di Bandung, Jawa Barat, MYSTORE hadir sebagai platform E-Commerce modern yang menghubungkan produk berkualitas premium dengan gaya hidup Anda yang dinamis.
            </p>
          </div>
        </div>

        {/* Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-20">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6"><FiTarget size={28} /></div>
            <h3 className="text-lg font-bold text-primary mb-3">Kurasi Terbaik</h3>
            <p className="text-sm text-gray-500 leading-relaxed">Kami dengan teliti menyortir produk untuk memastikan Anda hanya mendapatkan kualitas terbaik dari penjual terpercaya.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6"><FiShield size={28} /></div>
            <h3 className="text-lg font-bold text-primary mb-3">Transaksi Aman</h3>
            <p className="text-sm text-gray-500 leading-relaxed">Sistem Escrow otomatis kami memastikan dana Anda aman dan hanya diteruskan setelah pesanan diterima dengan baik.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6"><FiHeart size={28} /></div>
            <h3 className="text-lg font-bold text-primary mb-3">Kepuasan Pelanggan</h3>
            <p className="text-sm text-gray-500 leading-relaxed">Dari notifikasi real-time hingga pusat bantuan komplain, kenyamanan Anda adalah prioritas utama operasi kami.</p>
          </div>
        </div>
        
      </div>
    </div>
  );
}