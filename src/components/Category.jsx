import React from "react";
import { FiArrowRight } from "react-icons/fi";

const categories = [
  {
    id: 1,
    title: "Signature Jackets",
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: 2,
    title: "Premium Tees",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: 3,
    title: "Accessories",
    image: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?auto=format&fit=crop&q=80&w=600",
  },
  {
    id: 4,
    title: "Footwear",
    image: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&q=80&w=600",
  },
];

export default function Category() {
  return (
    <section className="py-24 bg-surface">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Header Section (Judul & Tombol View All) */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12">
          <div>
            <span className="text-accent uppercase tracking-[0.2em] text-xs font-semibold block mb-2">
              Discover
            </span>
            <h2 className="text-3xl md:text-4xl font-serif text-primary">
              Curated Categories
            </h2>
          </div>
          <a 
            href="#shop" 
            className="group flex items-center gap-2 text-primary hover:text-accent transition-colors text-sm font-medium uppercase tracking-wider mt-4 md:mt-0"
          >
            View All Collections
            <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* Grid Categories */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {categories.map((cat) => (
            <a 
              key={cat.id} 
              href={`#${cat.title.toLowerCase().replace(' ', '-')}`} 
              className="group block cursor-pointer"
            >
              {/* Image Container dengan rasio portrait */}
              <div className="relative overflow-hidden aspect-[4/5] mb-5 bg-secondary rounded-sm">
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                {/* Overlay Hitam Halus yang memudar saat di-hover */}
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-500"></div>
              </div>
              
              {/* Keterangan Kategori */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-serif text-primary group-hover:text-accent transition-colors duration-300">
                  {cat.title}
                </h3>
                <span className="text-primary-light group-hover:text-accent transition-colors duration-300">
                  <FiArrowRight size={18} strokeWidth={1.5} />
                </span>
              </div>
            </a>
          ))}
        </div>

      </div>
    </section>
  );
}