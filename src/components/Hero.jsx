import React from 'react';
import { FiArrowRight } from 'react-icons/fi';

export default function Hero() {
  return (
    <section className="relative w-full min-h-[85vh] bg-secondary flex items-center overflow-hidden">
      {/* Ornamen Latar Belakang Abstrak (Halus) */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-surface rounded-l-full blur-3xl opacity-40 z-0 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10 py-20">
        
        {/* Kolom Kiri: Tipografi & Teks */}
        <div className="space-y-8 text-center md:text-left order-2 md:order-1 animate-fadeInUp">
          <span className="text-accent uppercase tracking-[0.2em] text-xs font-semibold">
            New Collection 2026
          </span>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif text-primary leading-[1.15]">
            Discover Your <br className="hidden md:block" />
            <span className="italic text-accent">Signature</span> Style.
          </h1>
          
          <p className="text-primary-light md:max-w-md leading-relaxed font-light text-sm md:text-base">
            Experience fashion that speaks before you do. Meticulously crafted pieces designed to elevate your everyday elegance and restore your confidence.
          </p>
          
          <div className="pt-4 flex justify-center md:justify-start">
            <button className="flex items-center gap-3 bg-primary text-surface px-8 py-4 rounded-full hover:bg-accent transition-colors duration-300 group shadow-elegant">
              <span className="text-sm uppercase tracking-wider font-medium">Explore Collection</span>
              <FiArrowRight className="group-hover:translate-x-1 transition-transform duration-300" size={18} />
            </button>
          </div>
        </div>

        {/* Kolom Kanan: Gambar Produk */}
        <div className="relative order-1 md:order-2 flex justify-center items-center">
          {/* Efek Cahaya di belakang gambar */}
          <div className="absolute w-64 h-64 md:w-[28rem] md:h-[28rem] bg-accent/15 rounded-full blur-3xl z-0"></div>
          
          {/* Saran Gambar: 
            Gunakan gambar produk fashion/model tanpa background (PNG transparent) 
            atau gambar dengan background studio yang bersih.
          */}
          <img 
            src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=1000&auto=format&fit=crop" 
            alt="Premium Fashion Collection"
            className="w-full max-w-sm md:max-w-md object-cover rounded-t-full shadow-elegant relative z-10 transform hover:scale-[1.02] transition-transform duration-500"
          />
          
          {/* Floating Badge (Terinspirasi dari referensi Skincare) */}
          <div className="absolute bottom-4 left-0 md:bottom-12 md:-left-8 bg-surface/90 backdrop-blur-sm p-4 rounded-2xl shadow-elegant z-20 flex items-center gap-4">
            <div className="flex -space-x-3">
              <img src="https://i.pravatar.cc/100?img=1" alt="User" className="w-10 h-10 rounded-full border-2 border-surface object-cover" />
              <img src="https://i.pravatar.cc/100?img=2" alt="User" className="w-10 h-10 rounded-full border-2 border-surface object-cover" />
              <div className="w-10 h-10 rounded-full border-2 border-surface bg-primary text-surface flex items-center justify-center text-xs font-bold">+</div>
            </div>
            <div>
              <p className="font-serif font-bold text-primary text-lg leading-tight">110K+</p>
              <p className="text-primary-light text-[10px] uppercase tracking-wider">Customer Reviews</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}