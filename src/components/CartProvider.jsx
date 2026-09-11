import React, { useState } from 'react';
import { CartContext } from '../context/CartContext'; // Pastikan path ini benar sesuai lokasimu

export default function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  // Fungsi tambah barang
  const addToCart = (product) => {
    setCart((prevCart) => {
      // PERBAIKAN: Kita cek ID dan variasi yang dipilih agar ukuran S dan M tidak digabung
      const existingItem = prevCart.find((item) => item.id === product.id && item.chosenVariation === product.chosenVariation);
      if (existingItem) {
        return prevCart.map((item) =>
          (item.id === product.id && item.chosenVariation === product.chosenVariation) 
            ? { ...item, quantity: item.quantity + (product.chosenQuantity || 1) } 
            : item
        );
      }
      return [...prevCart, { ...product, quantity: product.chosenQuantity || 1 }];
    });
  };

  // Fungsi mengurangi jumlah barang
  const decreaseQuantity = (productId) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === productId);
      if (existingItem.quantity === 1) {
        return prevCart.filter((item) => item.id !== productId);
      }
      return prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
      );
    });
  };

  // Fungsi menghapus barang sepenuhnya dari keranjang
  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  // Menghitung total harga
  const cartTotal = cart.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);

  // 1. TULIS FUNGSI CLEAR CART DI SINI (SEBELUM const value)
  const clearCart = () => {
    setCart([]);
  };

  // 2. SETELAH ITU, BARU MASUKKAN KE DALAM VALUE
  const value = {
    cart,
    addToCart,
    decreaseQuantity,
    removeFromCart,
    cartCount,
    cartTotal,
    clearCart // Sekarang Javascript sudah tahu clearCart itu apa
  };

  // 3. RETURN DI PALING BAWAH
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}