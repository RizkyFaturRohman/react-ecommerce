import React from "react";
import { FiFacebook, FiTwitter, FiInstagram, FiYoutube, FiArrowRight } from "react-icons/fi";

export default function Footer() {
  return (
    <footer className="bg-primary text-surface pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Top Footer Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 border-b border-white/10 pb-16">
          
          {/* Kolom 1: Brand & Newsletter (Lebih Lebar) */}
          <div className="md:col-span-5 pr-0 lg:pr-12">
            <a href="/" className="text-3xl font-serif font-medium tracking-[0.1em] uppercase block mb-6">
              MyStore.
            </a>
            <p className="text-surface/60 font-light text-sm leading-relaxed mb-8 max-w-sm">
              Elevating everyday essentials through meticulous craftsmanship and timeless design. Subscribe to receive updates, access to exclusive deals, and more.
            </p>
            
            {/* Minimalist Newsletter Form */}
            <form className="relative max-w-sm" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter your email address"
                className="w-full bg-transparent border-b border-surface/30 px-0 py-3 text-sm focus:outline-none focus:border-accent text-surface placeholder-surface/40 transition-colors"
                required
              />
              <button
                type="submit"
                className="absolute right-0 top-1/2 -translate-y-1/2 text-surface hover:text-accent transition-colors p-2"
                aria-label="Subscribe"
              >
                <FiArrowRight size={20} />
              </button>
            </form>
          </div>

          {/* Kolom 2: Shop Links */}
          <div className="md:col-span-2">
            <h4 className="text-xs uppercase tracking-[0.2em] font-semibold mb-6 text-surface">Shop</h4>
            <ul className="space-y-4 text-sm font-light text-surface/60">
              <li><a href="#" className="hover:text-accent transition-colors">New Arrivals</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Best Sellers</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Outerwear</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Accessories</a></li>
            </ul>
          </div>

          {/* Kolom 3: Support Links */}
          <div className="md:col-span-2">
            <h4 className="text-xs uppercase tracking-[0.2em] font-semibold mb-6 text-surface">Support</h4>
            <ul className="space-y-4 text-sm font-light text-surface/60">
              <li><a href="#" className="hover:text-accent transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Shipping & Returns</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Size Guide</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">FAQ</a></li>
            </ul>
          </div>

          {/* Kolom 4: Social & Contact */}
          <div className="md:col-span-3">
            <h4 className="text-xs uppercase tracking-[0.2em] font-semibold mb-6 text-surface">Connect</h4>
            <div className="flex space-x-5 mb-8">
              <a href="#" className="text-surface/60 hover:text-accent transition-colors"><FiInstagram size={20} strokeWidth={1.5} /></a>
              <a href="#" className="text-surface/60 hover:text-accent transition-colors"><FiFacebook size={20} strokeWidth={1.5} /></a>
              <a href="#" className="text-surface/60 hover:text-accent transition-colors"><FiTwitter size={20} strokeWidth={1.5} /></a>
              <a href="#" className="text-surface/60 hover:text-accent transition-colors"><FiYoutube size={20} strokeWidth={1.5} /></a>
            </div>
            <p className="text-sm font-light text-surface/60 mb-1">hello@mystore.com</p>
            <p className="text-sm font-light text-surface/60">+62 800 1234 5678</p>
          </div>

        </div>

        {/* Bottom Copyright Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mt-10 text-xs font-light text-surface/40 uppercase tracking-wider gap-4">
          <p>© {new Date().getFullYear()} MyStore. All Rights Reserved.</p>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-surface transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-surface transition-colors">Terms of Service</a>
          </div>
        </div>
        
      </div>
    </footer>
  );
}