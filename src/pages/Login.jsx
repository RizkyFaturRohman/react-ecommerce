import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { FiArrowLeft, FiEye, FiEyeOff } from 'react-icons/fi';

const slideImages = [
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200",
  "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=1200",
  "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=1200"
];

export default function Login() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentImg, setCurrentImg] = useState(0);
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImg((prev) => (prev + 1) % slideImages.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            });

            if (error) throw error;

            navigate('/'); // Redirect ke Home setelah sukses
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="h-screen w-full flex overflow-hidden bg-white">
            
            {/* SISI KIRI: SLIDESHOW GAMBAR */}
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
                <div className="absolute inset-0 bg-black/30 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

                <div className="absolute bottom-0 left-0 p-16 text-white w-full">
                    <h2 className="text-4xl lg:text-5xl font-serif leading-tight mb-4">
                        Welcome Back.
                    </h2>
                    <p className="font-light text-white/80 text-lg max-w-md">
                        The simplest way to manage your aesthetic shopping and collection.
                    </p>
                    <div className="flex gap-2 mt-8">
                        {slideImages.map((_, idx) => (
                            <div key={idx} className={`h-1 rounded-full transition-all duration-500 ${idx === currentImg ? 'w-8 bg-white' : 'w-2 bg-white/40'}`}></div>
                        ))}
                    </div>
                </div>

                <Link to="/" className="absolute top-10 left-12 flex items-center gap-3 text-white hover:opacity-80 transition-opacity">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary font-serif font-bold text-xl">M</div>
                    <span className="font-serif text-2xl tracking-widest">MYSTORE.</span>
                </Link>
            </div>

            {/* SISI KANAN: FORM LOGIN */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 md:p-16 relative">
                
                <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-primary-light hover:text-primary transition-colors text-xs uppercase tracking-widest font-medium lg:hidden">
                    <FiArrowLeft /> Back
                </Link>

                <div className="w-full max-w-md">
                    <div className="mb-10 text-center lg:text-left">
                        <h1 className="text-3xl font-serif text-primary mb-2">
                            Login to your account
                        </h1>
                        <p className="text-sm text-gray-500">
                            Enter your credentials to access your account.
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-500 p-4 mb-6 rounded-lg text-sm border border-red-100">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
                            <input 
                                type="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                placeholder='name@example.com' 
                                className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm bg-gray-50/50" 
                            />
                        </div>

                        <div className="relative">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-medium text-gray-700">Password</label>
                                <button type="button" className="text-xs font-bold text-primary hover:underline">Forgot password?</button>
                            </div>
                            <div className="relative">
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder='••••••••' 
                                    className="w-full border border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm bg-gray-50/50" 
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary"
                                >
                                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center">
                            <input type="checkbox" id="remember" className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary" />
                            <label htmlFor="remember" className="ml-2 text-sm text-gray-600">Remember for 30 days</label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-white py-4 rounded-lg uppercase tracking-wider text-sm font-bold hover:bg-accent transition-all shadow-md mt-4 disabled:opacity-70"
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm">
                        <span className="text-gray-500">Don't have an account? <Link to="/register" className="text-primary font-bold hover:underline">Sign up for free</Link></span>
                    </div>
                </div>
            </div>
        </section>
    );
}