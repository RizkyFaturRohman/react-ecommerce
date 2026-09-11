import React, { useState, useEffect } from "react";
import { FiClock } from "react-icons/fi";

export default function Ad() {
  const [timeLeft, setTimeLeft] = useState({
    days: 1,
    hours: 23,
    minutes: 59,
    seconds: 59,
  });

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimeLeft((prev) => {
        const totalSeconds =
          prev.days * 24 * 3600 + prev.hours * 3600 + prev.minutes * 60 + prev.seconds - 1;
        if (totalSeconds <= 0) {
          clearInterval(countdown);
          return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }
        return {
          days: Math.floor(totalSeconds / (24 * 3600)),
          hours: Math.floor((totalSeconds % (24 * 3600)) / 3600),
          minutes: Math.floor((totalSeconds % 3600) / 60),
          seconds: totalSeconds % 60,
        };
      });
    }, 1000);
    return () => clearInterval(countdown);
  }, []);

  return (
    <section className="bg-surface py-20">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid md:grid-cols-2 bg-secondary rounded-sm overflow-hidden shadow-elegant">
          
          {/* Kolom Kiri: Gambar Produk Eksklusif */}
          <div className="relative h-96 md:h-auto">
            <img
              src="https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=1000"
              alt="Limited Edition Coat"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Overlay Halus */}
            <div className="absolute inset-0 bg-primary/10 mix-blend-multiply"></div>
          </div>

          {/* Kolom Kanan: Teks Promo & Timer */}
          <div className="p-10 md:p-16 lg:p-24 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-[1px] bg-accent"></span>
              <span className="text-accent uppercase tracking-[0.2em] text-xs font-semibold">
                Exclusive Drop
              </span>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-serif text-primary mb-4 leading-tight">
              The Winter <br /> <span className="italic text-accent">Capsule</span>
            </h2>
            
            <p className="text-primary-light font-light text-sm md:text-base leading-relaxed mb-8">
              Embrace the season with our strictly limited outerwear collection. Masterfully tailored, uncompromising comfort. Once it's gone, it's gone forever.
            </p>

            {/* Elemen Hitung Mundur Elegan */}
            <div className="mb-10">
              <div className="flex items-center gap-2 text-primary text-xs uppercase tracking-wider mb-4 font-medium">
                <FiClock size={16} /> Ends In
              </div>
              <div className="flex gap-6 text-primary">
                {Object.entries(timeLeft).map(([label, value]) => (
                  <div key={label} className="flex flex-col items-start">
                    <span className="text-3xl font-serif font-medium leading-none">
                      {value.toString().padStart(2, "0")}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-primary-light mt-2">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button className="self-start bg-primary text-surface px-8 py-4 uppercase tracking-widest text-xs font-medium hover:bg-accent transition-colors duration-300">
              Pre-Order Now
            </button>
          </div>
          
        </div>
      </div>
    </section>
  );
}