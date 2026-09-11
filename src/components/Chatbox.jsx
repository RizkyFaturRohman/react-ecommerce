import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { FiX, FiSend, FiMessageCircle } from 'react-icons/fi';

export default function ChatBox({ sellerId, sellerName, sellerAvatar, onClose }) {
  const { user } = useAuth();
  const [roomId, setRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  // 1. INISIALISASI RUANG OBROLAN (ROOM) DENGAN PENGAMAN DOUBLE-RENDER
  useEffect(() => {
    if (!user || !sellerId) return;

    const initChat = async () => {
      try {
        // Cari apakah pembeli dan penjual ini sudah pernah chat sebelumnya
        let { data: room } = await supabase
          .from('chat_rooms')
          .select('*')
          .eq('buyer_id', user.id)
          .eq('seller_id', sellerId)
          .maybeSingle();

        // Jika belum ada, buat ruang obrolan (Room) baru
        if (!room) {
          const { data: newRoom, error: insertError } = await supabase
            .from('chat_rooms')
            .insert([{ buyer_id: user.id, seller_id: sellerId }])
            .select()
            .maybeSingle();

          room = newRoom;

          // JARING PENGAMAN: Jika terjadi Error 409 (Conflict) akibat render ganda React,
          // tarik ulang data Room yang berhasil dibuat oleh render pertama.
          if (insertError) {
            const { data: existingRoom } = await supabase
              .from('chat_rooms')
              .select('*')
              .eq('buyer_id', user.id)
              .eq('seller_id', sellerId)
              .maybeSingle();
            room = existingRoom;
          }
        }

        // Jika room sudah dipastikan aman, ambil riwayat pesan
        if (room && room.id) {
          setRoomId(room.id);
          const { data: history } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('room_id', room.id)
            .order('created_at', { ascending: true });
            
          if (history) setMessages(history);
        }
      } catch (err) {
        console.error("Sistem Chat Error:", err);
      }
    };

    initChat();
  }, [user, sellerId]);

  // 2. RADAR REAL-TIME UNTUK PESAN BARU
  useEffect(() => {
    if (!roomId) return;

    const messageListener = supabase
      .channel(`chat-room-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          setMessages((prev) => {
             // Mencegah pesan yang sama muncul 2x di layar si pengirim
             if (prev.find(m => m.id === payload.new.id)) return prev;
             return [...prev, payload.new];
          });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(messageListener);
  }, [roomId]);

  // 3. AUTO-SCROLL KE BAWAH SAAT ADA PESAN BARU
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 4. FUNGSI KIRIM PESAN KE DATABASE
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !roomId) return;

    const messageText = newMessage;
    setNewMessage(''); // Kosongkan input agar terasa gesit

    const { data: insertedMsg, error } = await supabase
      .from('chat_messages')
      .insert([{
        room_id: roomId,
        sender_id: user.id,
        message: messageText
      }])
      .select()
      .single();

    if (error) console.error("Gagal mengirim pesan:", error);
    if (insertedMsg) setMessages(prev => [...prev, insertedMsg]);
  };

  return (
    <div className="fixed bottom-4 right-4 md:bottom-10 md:right-10 w-[90vw] md:w-[380px] h-[500px] bg-white rounded-[2rem] shadow-2xl flex flex-col z-[100] border border-gray-100 overflow-hidden animate-fade-in">
      
      {/* HEADER CHAT */}
      <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center overflow-hidden border border-white/20 shadow-inner">
            {sellerAvatar ? <img src={sellerAvatar} className="w-full h-full object-cover"/> : <FiMessageCircle size={20}/>}
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight tracking-wide">{sellerName || 'Penjual'}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <p className="text-[10px] text-slate-300 uppercase tracking-widest font-medium">Online</p>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-300 hover:text-white bg-white/5 hover:bg-white/20 p-2.5 rounded-full transition-colors cursor-pointer">
          <FiX size={16} />
        </button>
      </div>

      {/* AREA PESAN (BODY) */}
      <div className="flex-1 overflow-y-auto p-5 bg-[#f8fafc] space-y-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
            <FiMessageCircle size={48} className="mb-4" />
            <p className="text-xs font-bold uppercase tracking-widest text-center">Mulai Percakapan</p>
            <p className="text-[10px] text-center mt-2 max-w-[200px]">Tanyakan detail produk, stok, atau variasi kepada penjual.</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3.5 text-sm ${isMe ? 'bg-primary text-white rounded-2xl rounded-br-sm shadow-md' : 'bg-white text-slate-700 border border-slate-100 rounded-2xl rounded-bl-sm shadow-sm'}`}>
                  <p className="leading-relaxed">{msg.message}</p>
                  <span className={`text-[9px] mt-1.5 block font-medium uppercase tracking-wider ${isMe ? 'text-white/70 text-right' : 'text-slate-400 text-left'}`}>
                    {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* AREA INPUT (FOOTER) */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex items-center gap-3 shrink-0">
        <input 
          type="text" 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Ketik pesan Anda..." 
          className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:border-primary focus:bg-white transition-colors shadow-inner"
        />
        <button type="submit" disabled={!newMessage.trim()} className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center disabled:opacity-50 hover:bg-accent transition-all cursor-pointer shrink-0 shadow-md hover:shadow-lg active:scale-95">
          <FiSend size={18} className="-ml-1 mt-1" />
        </button>
      </form>
    </div>
  );
}