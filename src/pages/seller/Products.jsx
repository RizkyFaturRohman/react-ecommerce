import React from 'react';
import { Routes, Route, useNavigate, useOutletContext } from 'react-router-dom';
import ProductsList from './ProductList'; 
import AddProduct from './AddProduct';
import EditProduct from './EditProduct'; // <--- Import EditProduct baru

export default function Products() {
  const navigate = useNavigate();
  const { searchQuery } = useOutletContext(); 

  return (
    <Routes>
      <Route path="/" element={<ProductsList onAddNew={() => navigate('add-product')} searchQuery={searchQuery} />} />
      <Route path="add-product" element={<AddProduct onCancel={() => navigate('/products')} />} />
      
      {/* Rute baru untuk Edit Produk dengan menangkap ID dari URL */}
      <Route path="edit-product/:id" element={<EditProduct onCancel={() => navigate('/products')} />} />
    </Routes>
  );
}