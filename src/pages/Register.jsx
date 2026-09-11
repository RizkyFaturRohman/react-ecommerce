import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { FiArrowLeft } from 'react-icons/fi';

// Kumpulan gambar untuk efek slideshow
const slideImages = [
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200", // Toko Baju
  "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=1200", // Fashion Minimalis
  "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=1200"  // Lifestyle
];

export default function Register() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentImg, setCurrentImg] = useState(0); // State untuk mengatur gambar

    const [formData, setFormData] = useState({
        fullname: '',
        email: '',
        password: '',
        role: 'pembeli',
        shopName: '',
    });

    // Efek Slideshow: Ganti gambar tiap 5 detik
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImg((prev) => (prev + 1) % slideImages.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value});
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
            });

            if (authError) throw authError;
            
            if (authData.user) {
                const { error: profileError } = await supabase.from('profiles').insert([
                    {
                        id: authData.user.id,
                        full_name: formData.fullname,
                        role: formData.role,
                        shop_name: formData.role === 'penjual' ? formData.shopName: null,
                    }
                ]);

                if (profileError) throw profileError;

                alert('Registration successful! Welcome to MYSTORE.');
                navigate('/login');
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="h-screen w-full flex overflow-hidden bg-white">
            
            {/* SISI KIRI: SLIDESHOW GAMBAR (Full Height) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-black">
                {slideImages.map((img, index) => (
                    <img 
                        key={index}
                        src={img} 
                        alt={`Slide ${index + 1}`} 
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                            index === currentImg ? 'opacity-100' : 'opacity-0'
                        }`}
                    />
                ))}
                
                {/* Overlay Hitam Halus */}
                <div className="absolute inset-0 bg-black/30 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

                {/* Konten Teks di Atas Gambar */}
                <div className="absolute bottom-0 left-0 p-16 text-white w-full">
                    <h2 className="text-4xl lg:text-5xl font-serif leading-tight mb-4">
                        Find Your Signature Style
                    </h2>
                    <p className="font-light text-white/80 text-lg max-w-md">
                        Visiting your dream aesthetic is now just a few clicks away — fast, easy, reliable.
                    </p>
                    
                    {/* Indikator Slideshow */}
                    <div className="flex gap-2 mt-8">
                        {slideImages.map((_, idx) => (
                            <div key={idx} className={`h-1 rounded-full transition-all duration-500 ${idx === currentImg ? 'w-8 bg-white' : 'w-2 bg-white/40'}`}></div>
                        ))}
                    </div>
                </div>

                {/* Logo Pojok Kiri Atas */}
                <Link to="/" className="absolute top-10 left-12 flex items-center gap-3 text-white hover:opacity-80 transition-opacity">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary font-serif font-bold text-xl">M</div>
                    <span className="font-serif text-2xl tracking-widest">MYSTORE.</span>
                </Link>
            </div>

            {/* SISI KANAN: FORM REGISTER */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 md:p-16 relative overflow-y-auto custom-scrollbar">
                
                <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-primary-light hover:text-primary transition-colors text-xs uppercase tracking-widest font-medium lg:hidden">
                    <FiArrowLeft /> Back
                </Link>

                <div className="w-full max-w-md mt-10 lg:mt-0">
                    <div className="mb-10">
                        <h1 className="text-3xl font-serif text-primary mb-2">
                            Create an account
                        </h1>
                        <p className="text-sm text-gray-500">
                            Sign up to start your journey with us.
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-500 p-4 mb-6 rounded-lg text-sm border border-red-100">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-6">
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Full name</label>
                            <input 
                                type="text"
                                name="fullname"
                                required
                                value={formData.fullname}
                                onChange={handleChange}
                                placeholder='John Doe' 
                                className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm bg-gray-50/50" 
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
                            <input 
                                type="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                placeholder='johndoe@example.com' 
                                className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm bg-gray-50/50" 
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                            <input 
                                type="password"
                                name="password"
                                required minLength="6"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder='••••••••' 
                                className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm bg-gray-50/50" 
                            />
                        </div>
                        
                        {/* Role Switcher */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">I want to register as a:</label>
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <label className={`flex-1 text-center py-2.5 rounded-md text-sm font-medium cursor-pointer transition-all ${formData.role === 'pembeli' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-primary'}`}>
                                    <input type="radio" name="role" value="pembeli" checked={formData.role === 'pembeli'} onChange={handleChange} className="hidden" />
                                    Customer
                                </label>
                                <label className={`flex-1 text-center py-2.5 rounded-md text-sm font-medium cursor-pointer transition-all ${formData.role === 'penjual' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-primary'}`}>
                                    <input type="radio" name="role" value="penjual" checked={formData.role === 'penjual'} onChange={handleChange} className="hidden" />
                                    Seller
                                </label>
                            </div>
                        </div>

                        {formData.role === 'penjual' && (
                            <div className="animate-fade-in">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Shop Name</label>
                                <input
                                    type="text"
                                    name="shopName"
                                    required={formData.role === 'penjual'}
                                    value={formData.shopName}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm bg-gray-50/50"
                                    placeholder="e.g. My Awesome Store"
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-white py-4 rounded-lg uppercase tracking-wider text-sm font-bold hover:bg-accent transition-all shadow-md mt-4 disabled:opacity-70"
                        >
                            {loading ? 'Submitting...' : 'Submit'}
                        </button>

                    </form>

                    <div className="mt-8 flex items-center justify-between text-sm">
                        <span className="text-gray-500">Have any account? <Link to="/login" className="text-primary font-bold hover:underline">Sign in</Link></span>
                        <Link to="/" className="text-gray-400 hover:text-primary transition-colors">Terms & Conditions</Link>
                    </div>
                    
                </div>
            </div>
        </section>
    );
}