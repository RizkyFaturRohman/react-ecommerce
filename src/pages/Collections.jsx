import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';

export default function Collections() {
  const collections = [
    {
      id: 1,
      title: "All-Rounder Tech",
      desc: "Keseimbangan sempurna antara performa tinggi dan efisiensi harga untuk produktivitas harian.",
      img: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1000",
      link: "/shop"
    },
    {
      id: 2,
      title: "Active Lifestyle",
      desc: "Peralatan lari dan olahraga pilihan untuk menemani target kebugaran Anda.",
      img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1000",
      link: "/shop"
    },
    {
      id: 3,
      title: "Coffee Essentials",
      desc: "Koleksi tumbler premium dan alat seduh untuk melengkapi rutinitas gaya hidup Anda.",
      img: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=1000",
      link: "/shop"
    }
  ];

  return (
    <div className="min-h-screen bg-surface pt-28 pb-20 animate-fade-in">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-serif text-primary mb-4">Curated Collections</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Temukan kurasi produk terbaik kami yang disesuaikan dengan gaya hidup dan kebutuhan spesifik Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {collections.map((col) => (
            <Link key={col.id} to={col.link} className="group block relative h-[450px] rounded-3xl overflow-hidden shadow-sm">
              {/* Background Image */}
              <img src={col.img} alt={col.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
              
              {/* Content */}
              <div className="absolute inset-x-0 bottom-0 p-8 flex flex-col justify-end h-full">
                <h3 className="text-2xl font-serif text-white mb-2 transform transition-transform duration-500 group-hover:-translate-y-2">{col.title}</h3>
                <p className="text-sm text-gray-300 mb-6 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-100">
                  {col.desc}
                </p>
                <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity">
                  Jelajahi <FiArrowRight className="group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}