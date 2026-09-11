import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { formatRupiah } from '../currency';
import { FiPrinter, FiArrowLeft, FiCheckCircle, FiClock, FiTruck } from 'react-icons/fi';

export default function Invoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setOrder(data);
      } catch (error) {
        console.error('Gagal mengambil data invoice:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchOrder();
  }, [id]);

  const handlePrint = () => window.print();

  const getSafeItems = (itemsData) => {
    if (!itemsData) return [];
    if (typeof itemsData === 'string') {
      try { return JSON.parse(itemsData); } catch { return []; }
    }
    return itemsData;
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  if (!order) return <div className="text-center py-12 font-bold text-gray-500">Invoice tidak ditemukan.</div>;

  const items = getSafeItems(order.items);
  
  // PERHITUNGAN AKURAT BERDASARKAN DATABASE
  const productSubtotal = items.reduce((sum, item) => sum + (item.price * (item.quantity || item.chosenQuantity || 1)), 0);
  const shippingAndOthers = order.total_amount - productSubtotal; 

  const invoiceNumber = `INV/${new Date(order.created_at).getFullYear()}/${order.id.split('-')[0].toUpperCase()}`;
  const isPaid = order.status !== 'Pending';

  const renderPaymentInstruction = () => {
    const method = order.payment_method || 'va_bca';
    let content = null;
    if (method === 'va_bca') {
      content = <><p className="text-sm font-bold text-primary">BCA Virtual Account</p><p className="text-lg font-mono font-bold text-blue-600 mt-1 tracking-widest">8077 {order.phone_number}</p></>;
    } else if (method === 'gopay') {
      content = <><p className="text-sm font-bold text-primary">GoPay / QRIS</p><p className="text-xs text-gray-500 mt-1">Diselesaikan via Aplikasi (Gojek/Tokopedia)</p></>;
    } else {
      content = <><p className="text-sm font-bold text-primary">Cash On Delivery (COD)</p><p className="text-xs text-gray-500 mt-1">Pembayaran tunai ke kurir saat tiba.</p></>;
    }

    return (
      <div className="space-y-4">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Metode Pembayaran</p>
          {content}
        </div>
        <div className="pt-4 border-t border-gray-200">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1"><FiTruck/> Layanan Logistik</p>
          <p className="text-sm font-bold text-primary uppercase">{order.courier || 'MENUNGGU KURIR'}</p>
          {order.tracking_number && (
             <p className="text-xs font-mono font-bold text-emerald-600 tracking-widest mt-1 bg-emerald-50 inline-block px-2 py-0.5 rounded border border-emerald-100">Resi: {order.tracking_number}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            #printable-invoice, #printable-invoice * { visibility: visible; }
            #printable-invoice { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; box-shadow: none !important; border: none !important; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            tr, .avoid-break { page-break-inside: avoid !important; break-inside: avoid !important; }
            @page { size: A4 portrait; margin: 1.5cm 1cm; }
          }
        `}
      </style>

      <div className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 animate-fade-in print:bg-white print:py-0 print:px-0 print:min-h-0">
        <div className="max-w-4xl mx-auto">
          
          <div className="flex justify-between items-center mb-6 print:hidden">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-primary transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200 cursor-pointer">
              <FiArrowLeft size={16} /> Kembali
            </button>
            <button onClick={handlePrint} className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-accent transition-colors shadow-elegant cursor-pointer">
              <FiPrinter size={16} /> Cetak Invoice
            </button>
          </div>

          <div id="printable-invoice" className="bg-white rounded-3xl shadow-2xl overflow-hidden print:rounded-none border border-gray-200 print:border-none">
            
            <div className="avoid-break bg-[#111827] text-white px-10 py-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
              <div>
                <h1 className="font-serif text-4xl font-bold tracking-widest mb-2">MYSTORE.</h1>
                <p className="text-xs text-gray-400 font-medium tracking-wide">Tech & Gadget Enterprise</p>
                <div className="mt-4 text-xs text-gray-400 space-y-1">
                  <p>Jl. Teknologi No. 1, Bandung, Jawa Barat</p>
                  <p>support@mystore.com | +62 812 3456 7890</p>
                </div>
              </div>
              
              <div className="text-left md:text-right w-full md:w-auto">
                <h2 className="text-3xl font-bold mb-2 uppercase tracking-wider">INVOICE</h2>
                <p className="text-sm font-mono text-gray-300 mb-1">{invoiceNumber}</p>
                <p className="text-xs text-gray-400 font-medium mb-4">
                  Diterbitkan: {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
                
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border ${
                  isPaid ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {isPaid ? <FiCheckCircle size={14}/> : <FiClock size={14}/>}
                  {isPaid ? 'Lunas (Paid)' : 'Belum Lunas'}
                </div>
              </div>
            </div>

            <div className="p-10 md:p-12">
              <div className="avoid-break flex flex-col md:flex-row justify-between gap-10 mb-12 border-b border-gray-100 pb-10">
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Ditagihkan Kepada:</p>
                  <p className="text-base font-bold text-primary mb-1">{order.customer_name}</p>
                  <p className="text-xs text-gray-500 leading-relaxed max-w-sm">{order.shipping_address}</p>
                  <p className="text-xs font-medium text-gray-500 mt-2">{order.phone_number}</p>
                </div>
                
                <div className="flex-1 md:bg-slate-50 md:p-6 md:rounded-2xl md:border md:border-gray-100">
                  {renderPaymentInstruction()}
                </div>
              </div>

              <div className="mb-10 w-full overflow-hidden">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-200">
                      <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[45%]">Deskripsi Produk</th>
                      <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center w-[15%]">Qty</th>
                      <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right w-[20%]">Harga Satuan</th>
                      <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right w-[20%]">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-5 px-4 break-words">
                          <p className="text-sm font-bold text-primary">{item.name}</p>
                          {(item.chosenVariation || item.chosenColor) && (
                            <p className="text-[10px] text-gray-500 mt-1.5 font-medium">
                              {item.chosenVariation && `Varian: ${item.chosenVariation}`} 
                              {item.chosenVariation && item.chosenColor && ' | '}
                              {item.chosenColor && `Warna: ${item.chosenColor}`}
                            </p>
                          )}
                        </td>
                        <td className="py-5 px-4 text-sm font-medium text-gray-600 text-center">{item.quantity || item.chosenQuantity || 1}</td>
                        <td className="py-5 px-4 text-sm font-medium text-gray-600 text-right whitespace-nowrap">{formatRupiah(item.price)}</td>
                        <td className="py-5 px-4 text-sm font-bold text-primary text-right whitespace-nowrap">{formatRupiah(item.price * (item.quantity || item.chosenQuantity || 1))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="avoid-break flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mt-8">
                <div className="w-full lg:w-1/2">
                   <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 text-xs text-gray-500">
                     <span className="font-bold text-primary block mb-1">Catatan Pengiriman:</span>
                     Jika terdapat ketidaksesuaian barang, harap hubungi penjual dengan menyertakan bukti resi pengiriman dan video unboxing.
                   </div>
                </div>

                <div className="w-full lg:w-5/12 space-y-3 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm print:border-gray-200">
                  <div className="flex justify-between text-xs text-gray-500 font-medium">
                    <span>Subtotal Produk</span>
                    <span>{formatRupiah(productSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 font-medium pb-4 border-b border-gray-200">
                    <span>Ongkir & Penyesuaian Harga</span>
                    <span className={shippingAndOthers < 0 ? "text-red-500" : ""}>
                      {shippingAndOthers < 0 ? `- ${formatRupiah(Math.abs(shippingAndOthers))}` : formatRupiah(shippingAndOthers)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm font-bold text-primary uppercase tracking-wider whitespace-nowrap">Grand Total</span>
                    <span className="text-xl font-bold text-emerald-600 whitespace-nowrap">{formatRupiah(order.total_amount)}</span>
                  </div>
                </div>
              </div>

              <div className="avoid-break mt-16 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
                <div>
                  <p className="text-sm font-bold text-primary mb-1">Terima kasih atas kepercayaan Anda!</p>
                  <p className="text-[10px] text-gray-400 font-medium">Invoice ini sah dan diterbitkan secara otomatis oleh sistem MYSTORE.</p>
                </div>
                <div className="text-center md:text-right mt-4 md:mt-0">
                   <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-widest font-bold">Authorized By</p>
                   <p className="font-serif text-xl font-bold text-primary italic opacity-80">MYSTORE</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </>
  );
}