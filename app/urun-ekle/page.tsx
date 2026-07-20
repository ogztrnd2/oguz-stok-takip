"use client";

import React, { useState } from 'react';
import { ArrowLeft, Save, Package } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Yönlendirme ve yenileme motoru eklendi
import { supabase } from '@/lib/supabase';

export default function UrunEkle() {
  const router = useRouter(); 
  const [loading, setLoading] = useState(false);
  const [mesaj, setMesaj] = useState('');

  const [form, setForm] = useState({
    name: '',
    unit: 'Adet',
    stock_quantity: '',
    critical_stock: '',
    buy_price: '',
    sell_price: ''
  });

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const urunKaydet = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setMesaj('');

    const { error } = await supabase
      .from('products')
      .insert([
        {
          name: form.name,
          unit: form.unit,
          stock_quantity: Number(form.stock_quantity) || 0,
          critical_stock: Number(form.critical_stock) || 0,
          buy_price: Number(form.buy_price) || 0,
          sell_price: Number(form.sell_price) || 0,
        }
      ]);

    if (error) {
      setMesaj('Kaydedilirken hata oluştu: ' + error.message);
      setLoading(false);
    } else {
      setMesaj('✅ Ürün eklendi! Listeye yönlendiriliyorsunuz...');
      
      // Sihirli dokunuş: Önbelleği temizle ve 1 saniye sonra ürünler sayfasına at
      router.refresh(); 
      setTimeout(() => {
        router.push('/products');
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <header className="bg-white px-5 py-4 flex items-center shadow-sm sticky top-0 z-10">
        <Link href="/" className="text-gray-600 mr-4">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Package size={20} className="text-blue-600"/> Yeni Ürün Ekle
        </h1>
      </header>

      <main className="p-5">
        <form onSubmit={urunKaydet} className="space-y-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ürün Adı</label>
            <input required type="text" name="name" value={form.name} onChange={handleChange} 
              className="w-full border border-gray-300 rounded-xl p-3 text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Birim</label>
              <select name="unit" value={form.unit} onChange={handleChange} 
                className="w-full border border-gray-300 rounded-xl p-3 text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                <option value="Adet">Adet</option>
                <option value="Torba">Torba</option>
                <option value="Ton">Ton</option>
                <option value="m2">Metrekare (m2)</option>
                <option value="Boy">Boy</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mevcut Stok</label>
              <input type="number" name="stock_quantity" value={form.stock_quantity} onChange={handleChange} 
                className="w-full border border-gray-300 rounded-xl p-3 text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alış Fiyatı (₺)</label>
              <input type="number" name="buy_price" value={form.buy_price} onChange={handleChange} 
                className="w-full border border-gray-300 rounded-xl p-3 text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Satış Fiyatı (₺)</label>
              <input type="number" name="sell_price" value={form.sell_price} onChange={handleChange} 
                className="w-full border border-gray-300 rounded-xl p-3 text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kritik Stok Uyarısı</label>
            <input type="number" name="critical_stock" value={form.critical_stock} onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl p-3 text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          {mesaj && (
            <div className={`p-3 rounded-xl text-sm font-medium ${mesaj.includes('hata') ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
              {mesaj}
            </div>
          )}

          <button type="submit" disabled={loading} 
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-md flex items-center justify-center gap-2 hover:bg-blue-700 transition disabled:opacity-50">
            <Save size={20} />
            {loading ? 'Kaydediliyor...' : 'Ürünü Kaydet'}
          </button>
        </form>
      </main>
    </div>
  );
}