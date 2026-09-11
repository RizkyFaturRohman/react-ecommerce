import { createContext, useContext } from 'react';

// 1. Membuat Context
export const CartContext = createContext();

// 2. Membuat Custom Hook
export const useCart = () => {
  return useContext(CartContext);
};