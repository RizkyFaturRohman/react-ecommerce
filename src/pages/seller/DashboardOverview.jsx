import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { formatRupiah } from '../../currency';
import { FiTrendingUp, FiBox, FiUsers, FiDollarSign, FiClock, FiShoppingCart } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardOverview() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const firstName = profile?.full_name?.split(' ')[0] || 'Seller';
  
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    pendingOrders: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) return;
      setIsLoading(true);

      try {
        // 1. Ambil Data Pesanan
        const { data: orders } = await supabase
          .from('orders')
          .select('*')
          .eq('seller_id', user.id);

        // 2. Ambil Data Produk
        const { count: productCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', user.id);

        let revenue = 0;
        let pending = 0;
        const dailyRevenue = {};

        if (orders) {
          orders.forEach(order => {
            if (order.status === 'Pending') pending += 1;
            
            // Hitung Pendapatan (Hanya yang tidak di-cancel)
            if (order.status !== 'Cancelled') {
              revenue += order.total_amount;

              // Olah data untuk Grafik (Per Hari)
              const date = new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
              dailyRevenue[date] = (dailyRevenue[date] || 0) + order.total_amount;
            }
          });
        }

        // Format data untuk Recharts
        const formattedChartData = Object.keys(dailyRevenue).map(date => ({
          name: date,
          Pendapatan: dailyRevenue[date]
        }));

        setStats({
          totalRevenue: revenue,
          totalOrders: orders?.length || 0,
          totalProducts: productCount || 0,
          pendingOrders: pending
        });
        setChartData(formattedChartData);

      } catch (error) {
        console.error("Gagal memuat data dashboard", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Kustomisasi Tooltip Grafik
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-100 shadow-xl rounded-2xl">
          <p className="text-xs text-gray-500 mb-1">{label}</p>
          <p className="text-sm font-bold text-emerald-600">{formatRupiah(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) return <div className="flex justify-center items-center h-[70vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-8 animate-fade-in pb-10 pt-2">
      
      {/* HEADER GREETING (Glassmorphism Premium) */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-[2rem] p-8 md:p-12 relative overflow-hidden shadow-2xl shadow-slate-900/20">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-3">Selamat Datang, {firstName}! 🚀</h1>
          <p className="text-slate-300 text-sm max-w-lg mb-8 leading-relaxed">
            Ini adalah pusat kendali bisnis Anda. Pantau kinerja toko, kelola pesanan, dan tingkatkan pendapatan Anda hari ini.
          </p>
          <button onClick={() => navigate('/products')} className="bg-white text-slate-900 px-8 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-md hover:bg-slate-100 hover:scale-105 transition-all">
            Kelola Produk
          </button>
        </div>
        {/* Orbs Dekorasi */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-primary/40 rounded-full blur-[80px]"></div>
        <div className="absolute -bottom-24 right-1/4 w-64 h-64 bg-emerald-500/30 rounded-full blur-[60px]"></div>
      </div>

      {/* STATISTIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out z-0"></div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-5"><FiDollarSign size={24}/></div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Pendapatan</p>
            <p className="text-2xl font-bold text-slate-800">{formatRupiah(stats.totalRevenue)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out z-0"></div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-5"><FiShoppingCart size={24}/></div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Pesanan</p>
            <p className="text-2xl font-bold text-slate-800">{stats.totalOrders} <span className="text-xs text-gray-400 font-medium">Transaksi</span></p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out z-0"></div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-5"><FiClock size={24}/></div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Perlu Diproses</p>
            <p className="text-2xl font-bold text-slate-800">{stats.pendingOrders} <span className="text-xs text-gray-400 font-medium">Pesanan</span></p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out z-0"></div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-5"><FiBox size={24}/></div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Produk</p>
            <p className="text-2xl font-bold text-slate-800">{stats.totalProducts} <span className="text-xs text-gray-400 font-medium">Aktif</span></p>
          </div>
        </div>
      </div>

      {/* GRAFIK PENDAPATAN (RECHARTS) */}
      <div className="bg-white p-6 md:p-10 rounded-[2rem] border border-gray-100 shadow-sm">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Grafik Pendapatan</h2>
            <p className="text-xs text-gray-500 mt-1">Analisis tren penjualan toko Anda dari waktu ke waktu.</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl text-xs font-bold text-slate-500">
            <FiTrendingUp className="text-emerald-500" /> Live Data
          </div>
        </div>
        
        {chartData.length > 0 ? (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(value) => `Rp${value / 1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Pendapatan" stroke="#10B981" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 w-full flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-dashed border-gray-200">
            <FiTrendingUp size={32} className="text-gray-300 mb-3" />
            <p className="text-sm font-bold text-gray-400">Belum ada data pendapatan</p>
          </div>
        )}
      </div>

    </div>
  );
}