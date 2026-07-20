"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Trash2, Edit } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function UrunDuzenle() {
  const params = useParams();
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

  // Sayfa açıldığında mevcut ürün bilgilerini getir
  useEffect(() => {
    const urunuGetir = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', params.id)
        .single();

      if (data) {
        setForm({
          name: data.name,
          unit: data.unit,
          stock_quantity: data.stock_quantity,
          critical_stock: data.critical_stock,
          buy_price: data.buy_price,
          sell_price: data.sell_price
        });
      }
    };
    if (params.id) urunuGetir();
  }, [params.id]);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const urunGuncelle = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setMesaj('');

    const { error } = await supabase
      .from('products')
      .update({
        name: form.name,
        unit: form.unit,
        stock_quantity: Number(form.stock_quantity),
        critical_stock: Number(form.critical_stock),
        buy_price: Number(form.buy_price),
        sell_price: Number(form.sell_price),
      })
      .eq('id', params.id);

    if (error) {
      setMesaj('Hata: ' + error.message);
    } else {
      setMesaj('✅ Ürün başarıyla güncellendi!');
      router.refresh();
      setTimeout(() => router.push('/products'), 1000);
    }
    setLoading(false);
  };

  const urunSil = async () => {
    const onay = window.confirm("Bu ürünü silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve bu ürünle yapılan geçmiş hareketler de silinebilir!");
    if (!onay) return;

    setLoading(true);
    const { error } = await supabase.from('products').delete().eq('id', params.id);
    
    if (error) {
      setMesaj('Silinirken hata oluştu: ' + error.message);
      setLoading(false);
    } else {
      router.refresh();
      router.push('/products');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <header className="bg-white px-5 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Link href="/products" className="text-gray-600 mr-2">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Edit size={20} className="text-blue-600"/> Ürünü Düzenle
          </h1>
        </div>
        
        {/* Sil Butonu (Çöp Kutusu) */}
        <button onClick={urunSil} className="text-red-500 bg-red-50 p-2 rounded-full hover:bg-red-100">
          <Trash2 size={20} />
        </button>
      </header>

      <main className="p-5">
        <form onSubmit={urunGuncelle} className="space-y-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          
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
            <div className={`p-3 rounded-xl text-sm font-medium ${mesaj.includes('Hata') ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
              {mesaj}
            </div>
          )}

          <button type="submit" disabled={loading} 
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-md flex items-center justify-center gap-2 hover:bg-blue-700 transition disabled:opacity-50">
            <Save size={20} />
            {loading ? 'Güncelleniyor...' : 'Güncellemeyi Kaydet'}
          </button>
        </form>
      </main>
    </div>
  );
}