"use client";

import React, { useState } from 'react';
import { ArrowLeft, Save, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function CariEkle() {
  const [loading, setLoading] = useState(false);
  const [mesaj, setMesaj] = useState('');

  const [form, setForm] = useState({
    name: '',
    type: 'musteri',
    phone: '',
  });

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const cariKaydet = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setMesaj('');

    const { error } = await supabase.from('contacts').insert([
      {
        name: form.name,
        type: form.type,
        phone: form.phone,
        balance: 0 // İlk açılışta bakiye 0
      }
    ]);

    if (error) {
      setMesaj('Kaydedilirken hata oluştu: ' + error.message);
    } else {
      setMesaj('✅ Cari başarıyla eklendi!');
      setForm({ name: '', type: 'musteri', phone: '' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <header className="bg-white px-5 py-4 flex items-center shadow-sm sticky top-0 z-10">
        <Link href="/cariler" className="text-gray-600 mr-4">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <UserPlus size={20} className="text-blue-600"/> Yeni Cari Ekle
        </h1>
      </header>

      <main className="p-5">
        <form onSubmit={cariKaydet} className="space-y-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Firma / Kişi Adı</label>
            <input required type="text" name="name" value={form.name} onChange={handleChange} 
              className="w-full border border-gray-300 rounded-xl p-3 text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="Örn: Ahmet Usta veya XYZ İnşaat" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cari Tipi</label>
            <select name="type" value={form.type} onChange={handleChange} 
              className="w-full border border-gray-300 rounded-xl p-3 text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
              <option value="musteri">Müşteri (Mal Sattığım)</option>
              <option value="tedarikci">Tedarikçi (Mal Aldığım)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon Numarası</label>
            <input type="tel" name="phone" value={form.phone} onChange={handleChange} 
              className="w-full border border-gray-300 rounded-xl p-3 text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="05..." />
          </div>

          {mesaj && (
            <div className={`p-3 rounded-xl text-sm font-medium ${mesaj.includes('hata') ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
              {mesaj}
            </div>
          )}

          <button type="submit" disabled={loading} 
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-md flex items-center justify-center gap-2 hover:bg-blue-700 transition disabled:opacity-50">
            <Save size={20} />
            {loading ? 'Kaydediliyor...' : 'Cariyi Kaydet'}
          </button>
        </form>
      </main>
    </div>
  );
}