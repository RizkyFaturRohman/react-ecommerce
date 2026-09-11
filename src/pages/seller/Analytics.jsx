import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { formatRupiah } from '../../currency';
import { FiTrendingUp, FiDollarSign, FiShoppingBag, FiPieChart, FiBarChart2 } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Analytics() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  const [metrics, setMetrics] = useState({ totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 });
  const [revenueData, setRevenueData] = useState([]);
  const [statusData, setStatusData] = useState([]);

  const STATUS_COLORS = { 'Pending': '#F59E0B', 'Processing': '#3B82F6', 'Shipped': '#8B5CF6', 'Completed': '#10B981' };

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const { data: orders, error } = await supabase.from('orders').select('*').eq('seller_id', user?.id).order('created_at', { ascending: true });
        if (error) throw error;

        if (orders && orders.length > 0) {
          let revenue = 0; let orderCount = orders.length;
          const dailyRevenue = {}; const statusCounts = { Pending: 0, Processing: 0, Shipped: 0, Completed: 0 };

          orders.forEach(order => {
            if (order.status !== 'Cancelled') {
              revenue += parseFloat(order.total_amount);
              const date = new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
              dailyRevenue[date] = (dailyRevenue[date] || 0) + parseFloat(order.total_amount);
            }
            if (statusCounts[order.status] !== undefined) statusCounts[order.status] += 1;
          });

          setMetrics({ totalRevenue: revenue, totalOrders: orderCount, averageOrderValue: revenue / orderCount });
          setRevenueData(Object.keys(dailyRevenue).map(date => ({ name: date, Total: dailyRevenue[date] })));
          setStatusData(Object.keys(statusCounts).map(status => ({ name: status, value: statusCounts[status] })).filter(item => item.value > 0));
        }
      } catch (error) { console.error("Error fetching analytics:", error); } 
      finally { setIsLoading(false); }
    };
    if (user?.id) fetchAnalytics();
  }, [user]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-slate-100 shadow-xl rounded-2xl">
          <p className="text-xs text-slate-500 mb-1 font-bold uppercase">{label}</p>
          <p className="text-sm font-bold text-emerald-600">
            {payload[0].name === 'Total' ? formatRupiah(payload[0].value) : `${payload[0].value} Pesanan`}
          </p>
        </div>
      );
    }
    return null;
  };

  // PERBAIKAN: Fungsi format sumbu Y agar membaca "Jt" atau "K" dengan rapi
  const formatYAxis = (value) => {
    if (value >= 1000000) return `Rp ${value / 1000000} Jt`;
    if (value >= 1000) return `Rp ${value / 1000} K`;
    return `Rp ${value}`;
  };

  if (isLoading) return <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div><p className="text-sm font-bold animate-pulse">Analyzing store data...</p></div>;

  return (
    <div className="animate-fade-in space-y-8 pb-10 pt-2">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-primary"><FiBarChart2 size={24} /></div>
        <div><h2 className="text-3xl font-serif font-bold text-slate-800">Store Analytics</h2><p className="text-sm text-slate-500 mt-1">Pantau performa penjualan dan metrik utama toko Anda.</p></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-6"><FiDollarSign size={24} /></div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Pendapatan</p>
            <h3 className="text-3xl font-bold text-slate-800">{formatRupiah(metrics.totalRevenue)}</h3>
          </div>
          <FiTrendingUp className="absolute -bottom-6 -right-6 text-emerald-50 opacity-50 group-hover:scale-125 transition-transform duration-700" size={140} />
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-6"><FiShoppingBag size={24} /></div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Transaksi</p>
            <h3 className="text-3xl font-bold text-slate-800">{metrics.totalOrders} <span className="text-sm font-medium text-slate-400 lowercase">pesanan</span></h3>
          </div>
          <FiShoppingBag className="absolute -bottom-6 -right-6 text-blue-50 opacity-50 group-hover:scale-125 transition-transform duration-700" size={140} />
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center mb-6"><FiPieChart size={24} /></div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Rata-Rata Belanja</p>
            <h3 className="text-3xl font-bold text-slate-800">{formatRupiah(metrics.averageOrderValue)}</h3>
          </div>
          <FiPieChart className="absolute -bottom-6 -right-6 text-purple-50 opacity-50 group-hover:scale-125 transition-transform duration-700" size={140} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-100">
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-800">Tren Penjualan Harian</h3>
            <p className="text-xs text-slate-400 mt-1">Perkembangan total nilai transaksi per hari.</p>
          </div>
          
          {revenueData.length > 0 ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 'bold' }} dy={10} />
                  {/* PANGGIL FUNGSI FORMAT Y AXIS DI SINI */}
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 'bold' }} tickFormatter={formatYAxis} width={80} />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="Total" fill="#10B981" radius={[8, 8, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-sm font-bold text-slate-400">Belum ada data pendapatan</p>
            </div>
          )}
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-800">Distribusi Status</h3>
            <p className="text-xs text-slate-400 mt-1">Rasio penyelesaian pesanan.</p>
          </div>
          
          {statusData.length > 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="h-48 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name]} />)}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-bold text-slate-800">{metrics.totalOrders}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total</span>
                </div>
              </div>
              
              <div className="w-full mt-6 space-y-3">
                {statusData.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs font-bold text-slate-600 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: STATUS_COLORS[item.name] }}></div>
                      <span className="uppercase tracking-wider">{item.name === 'Pending' ? 'Baru' : item.name === 'Processing' ? 'Dikemas' : item.name === 'Shipped' ? 'Dikirim' : 'Selesai'}</span>
                    </div>
                    <span>{item.value} Pesanan</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
             <div className="flex-1 flex items-center justify-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 mt-4">
               <p className="text-sm font-bold text-slate-400">Tidak ada pesanan</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}