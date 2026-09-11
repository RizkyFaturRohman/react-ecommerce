import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import { FiSend, FiUser, FiMessageCircle, FiArrowLeft, FiCheck } from 'react-icons/fi';

export default function SellerChat() {
  const { user } = useAuth();
  
  const [chatRooms, setChatRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [buyersProfile, setBuyersProfile] = useState({});
  
  const messagesEndRef = useRef(null);

  // 1. AMBIL DAFTAR RUANG CHAT (ROOMS) PENJUAL INI
  useEffect(() => {
    if (!user) return;

    const fetchRooms = async () => {
      const { data: rooms, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

        if (error) console.error('Error fetching chat rooms:', error);
      if (rooms) {
        setChatRooms(rooms);
        
        // Ambil profil pembeli untuk setiap room
        const buyerIds = [...new Set(rooms.map(r => r.buyer_id))];
        if (buyerIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', buyerIds);
            
          if (profiles) {
            const profileMap = {};
            profiles.forEach(p => profileMap[p.id] = p);
            setBuyersProfile(profileMap);
          }
        }
      }
    };

    fetchRooms();

    // Radar Real-time jika ada orang baru yang nge-chat
    const roomSubscription = supabase.channel('seller-rooms')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_rooms', filter: `seller_id=eq.${user.id}` }, 
        (payload) => setChatRooms(prev => [payload.new, ...prev])
      ).subscribe();

    return () => supabase.removeChannel(roomSubscription);
  }, [user]);

  // 2. AMBIL PESAN SAAT RUANG CHAT DIKLIK
  useEffect(() => {
    if (!activeRoom) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', activeRoom.id)
        .order('created_at', { ascending: true });
      
      if (data) setMessages(data);
    };

    fetchMessages();

    // Radar Real-time pesan baru di room ini
    const msgSubscription = supabase.channel(`room-${activeRoom.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${activeRoom.id}` }, 
        (payload) => {
          setMessages(prev => {
            if (prev.find(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        }
      ).subscribe();

    return () => supabase.removeChannel(msgSubscription);
  }, [activeRoom]);

  // 3. AUTO-SCROLL KE BAWAH
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 4. KIRIM PESAN BALASAN
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeRoom) return;

    const text = newMessage;
    setNewMessage(''); 

    const { data: insertedMsg } = await supabase
      .from('chat_messages')
      .insert([{
        room_id: activeRoom.id,
        sender_id: user.id,
        message: text
      }])
      .select().single();

    if (insertedMsg) setMessages(prev => [...prev, insertedMsg]);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex h-[calc(100vh-8rem)] md:h-[calc(100vh-10rem)] overflow-hidden animate-fade-in relative">
      
      {/* KOLOM KIRI: DAFTAR CHAT */}
      <div className={`w-full md:w-80 border-r border-slate-100 flex flex-col bg-slate-50/50 shrink-0 ${activeRoom ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-5 border-b border-slate-100 bg-white">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <FiMessageCircle className="text-primary"/> Pesan Masuk
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
          {chatRooms.length === 0 ? (
            <p className="text-center text-xs text-slate-400 mt-10 font-bold">Belum ada pesan</p>
          ) : (
            chatRooms.map(room => {
              const buyer = buyersProfile[room.buyer_id];
              const isSelected = activeRoom?.id === room.id;
              
              return (
                <button 
                  key={room.id}
                  onClick={() => setActiveRoom(room)}
                  className={`w-full text-left p-3 rounded-2xl flex items-center gap-3 transition-all cursor-pointer ${isSelected ? 'bg-primary text-white shadow-md' : 'bg-white border border-slate-100 hover:border-primary/30'}`}
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    {buyer?.avatar_url ? <img src={buyer.avatar_url} className="w-full h-full object-cover"/> : <FiUser className={isSelected ? "text-primary" : "text-slate-400"}/>}
                  </div>
                  <div className="overflow-hidden">
                    <p className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-slate-800'}`}>{buyer?.full_name || 'Pembeli'}</p>
                    <p className={`text-[10px] truncate uppercase tracking-wider mt-0.5 ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>Lihat Percakapan</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* KOLOM KANAN: RUANG OBROLAN (CHATTING) */}
      <div className={`flex-1 flex flex-col bg-white relative ${!activeRoom ? 'hidden md:flex' : 'flex'}`}>
        {!activeRoom ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 bg-slate-50/30">
            <FiMessageCircle size={64} className="mb-4 opacity-50" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Pilih Obrolan</p>
            <p className="text-xs mt-2 text-slate-400 max-w-xs text-center">Pilih salah satu pesan di samping untuk mulai membalas pelanggan Anda.</p>
          </div>
        ) : (
          <>
            {/* Header Ruang Chat */}
            <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center gap-4 shrink-0 shadow-sm z-10">
              <button onClick={() => setActiveRoom(null)} className="md:hidden p-2 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 cursor-pointer">
                <FiArrowLeft />
              </button>
              <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center shrink-0 border border-slate-200">
                {buyersProfile[activeRoom.buyer_id]?.avatar_url ? <img src={buyersProfile[activeRoom.buyer_id].avatar_url} className="w-full h-full object-cover"/> : <FiUser className="text-slate-400"/>}
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800">{buyersProfile[activeRoom.buyer_id]?.full_name || 'Pembeli'}</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                   <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">Pelanggan Aktif</p>
                </div>
              </div>
            </div>

            {/* Area Pesan */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#f8fafc] space-y-4 custom-scrollbar">
              {messages.map((msg, idx) => {
                const isMe = msg.sender_id === user.id;
                return (
                  <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] p-4 text-sm ${isMe ? 'bg-primary text-white rounded-2xl rounded-br-sm shadow-md' : 'bg-white text-slate-700 border border-slate-100 rounded-2xl rounded-bl-sm shadow-sm'}`}>
                      <p className="leading-relaxed">{msg.message}</p>
                      <div className={`flex items-center gap-1 mt-2 justify-end`}>
                        <span className={`text-[9px] font-medium uppercase tracking-wider ${isMe ? 'text-white/70' : 'text-slate-400'}`}>
                          {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && <FiCheck size={12} className="text-white/70" />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form Balas Pesan */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex items-center gap-3 shrink-0">
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Balas pesan pelanggan..." 
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-sm focus:outline-none focus:border-primary focus:bg-white transition-colors shadow-inner"
              />
              <button type="submit" disabled={!newMessage.trim()} className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center disabled:opacity-50 hover:bg-accent transition-all cursor-pointer shrink-0 shadow-md">
                <FiSend size={18} className="-ml-1 mt-1" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}