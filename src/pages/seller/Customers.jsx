import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { formatRupiah } from '../../currency';
import { FiUsers, FiSearch, FiPhone, FiMapPin, FiShoppingBag, FiAward, FiInbox } from 'react-icons/fi';

export default function Customers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [stats, setStats] = useState({
    totalUnique: 0,
    topSpender: { name: '-', amount: 0 }
  });

  useEffect(() => {
    const fetchCustomersData = async () => {
      setIsLoading(true);
      try {
        const { data: orders, error } = await supabase
          .from('orders')
          .select('*')
          .eq('seller_id', user?.id)
          .neq('status', 'Cancelled'); // Jangan hitung yang batal

        if (error) throw error;

        if (orders && orders.length > 0) {
          const customerMap = {};

          orders.forEach((order) => {
            const key = order.phone_number;
            if (!customerMap[key]) {
              customerMap[key] = {
                name: order.customer_name,
                phone: order.phone_number,
                address: order.shipping_address,
                totalOrders: 0,
                totalSpent: 0,
                lastOrderDate: order.created_at,
              };
            }
            customerMap[key].totalOrders += 1;
            customerMap[key].totalSpent += parseFloat(order.total_amount);

            if (new Date(order.created_at) > new Date(customerMap[key].lastOrderDate)) {
              customerMap[key].address = order.shipping_address;
              customerMap[key].lastOrderDate = order.created_at;
            }
          });

          const customerList = Object.values(customerMap);
          customerList.sort((a, b) => b.totalSpent - a.totalSpent);
          setCustomers(customerList);

          setStats({
            totalUnique: customerList.length,
            topSpender: {
              name: customerList[0]?.name || '-',
              amount: customerList[0]?.totalSpent || 0
            }
          });
        }
      } catch (error) {
        console.error("Error processing customers data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) fetchCustomersData();
  }, [user]);

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery)
  );

  return (
    <div className="animate-fade-in space-y-8 pb-10 pt-2">
      
      {/* HEADER & PENCARIAN */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-8 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        <div>
          <h2 className="text-3xl font-serif font-bold text-slate-800 flex items-center gap-3">
            <FiUsers className="text-primary" /> Direktori Pelanggan
          </h2>
          <p className="text-sm text-slate-500 mt-2 max-w-md">Kenali lebih dekat pelanggan setia Anda. Kelola database kontak untuk keperluan promosi di masa mendatang.</p>
        </div>
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama atau nomor HP..." 
            className="pl-12 pr-5 py-3.5 w-full bg-slate-50 border border-transparent rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:border-primary/30 focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-inner"
          />
        </div>
      </div>

      {/* STATS CARDS RINGKAS (Hover Effect) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl shadow-lg relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-700 ease-out z-0"></div>
          <div className="relative z-10 flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-white/10 text-white flex items-center justify-center shrink-0 backdrop-blur-md border border-white/10">
              <FiUsers size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Pelanggan Unik</p>
              <h3 className="text-3xl font-bold text-white">{stats.totalUnique} <span className="text-sm font-medium text-slate-400 lowercase">Orang</span></h3>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-600 to-emerald-500 p-8 rounded-3xl shadow-lg shadow-emerald-500/20 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700 ease-out z-0"></div>
          <div className="relative z-10 flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-white/20 text-white flex items-center justify-center shrink-0 backdrop-blur-md border border-white/20">
              <FiAward size={24} />
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest mb-1">Sultan Toko (Top Spender)</p>
              <h3 className="text-2xl font-bold text-white truncate max-w-[250px]" title={stats.topSpender.name}>
                {stats.topSpender.name}
              </h3>
              <p className="text-sm font-bold text-emerald-100 mt-1">{formatRupiah(stats.topSpender.amount)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* TABEL CUSTOMERS */}
      <div className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-100 overflow-hidden min-h-[400px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-80 text-slate-400">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
            <p className="text-sm font-bold animate-pulse uppercase tracking-widest">Menganalisis Data...</p>
          </div>
        ) : filteredCustomers.length > 0 ? (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm text-slate-600 min-w-[900px]">
              <thead className="bg-slate-50/80 text-xs uppercase font-bold text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5">Nama Pelanggan</th>
                  <th className="px-6 py-5">Kontak</th>
                  <th className="px-6 py-5">Alamat Pengiriman Terakhir</th>
                  <th className="px-6 py-5 text-center">Total Transaksi</th>
                  <th className="px-8 py-5 text-right">Total Belanja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredCustomers.map((customer, index) => (
                  <tr key={index} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5 font-bold text-slate-800">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-primary font-bold shadow-sm uppercase text-sm group-hover:bg-primary group-hover:text-white transition-colors">
                          {customer.name.charAt(0)}
                        </div>
                        {customer.name}
                        {index === 0 && <FiAward className="text-amber-500 ml-1" title="Top Spender" />}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="flex items-center gap-2 text-slate-600 font-medium bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 w-max">
                        <FiPhone size={14} className="text-primary" /> {customer.phone}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="flex items-start gap-2 text-xs text-slate-500 max-w-xs leading-relaxed">
                        <FiMapPin size={14} className="text-slate-400 shrink-0 mt-0.5" /> {customer.address}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1 rounded-full text-xs font-bold">
                        <FiShoppingBag size={12} /> {customer.totalOrders}x
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right font-bold text-emerald-600 text-base">
                      {formatRupiah(customer.totalSpent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[400px] text-slate-400">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100 shadow-inner">
              <FiInbox size={32} className="text-slate-300" />
            </div>
            <p className="text-lg font-bold text-slate-600">Pelanggan Tidak Ditemukan</p>
            <p className="text-sm mt-1 max-w-sm text-center">
              {searchQuery ? `Tidak ada nama atau kontak yang cocok dengan "${searchQuery}"` : "Belum ada transaksi di toko Anda. Terus promosikan produk Anda!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}