"use client";

import React, { useState } from 'react';
import { ArrowLeft, Save, Truck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function TedarikciEkle() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mesaj, setMesaj] = useState('');

  const [form, setForm] = useState({
    name: '',
    phone: '',
  });

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const kaydet = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setMesaj('');

    const { error } = await supabase.from('contacts').insert([
      {
        name: form.name,
        type: 'tedarikci', // Tipi otomatik olarak tedarikçi atıyoruz
        phone: form.phone,
        balance: 0
      }
    ]);

    if (error) {
      setMesaj('Hata: ' + error.message);
      setLoading(false);
    } else {
      setMesaj('✅ Tedarikçi eklendi! Yönlendiriliyorsunuz...');
      router.refresh();
      setTimeout(() => {
        router.push('/tedarikciler');
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <header className="bg-white px-5 py-4 flex items-center shadow-sm sticky top-0 z-10">
        <Link href="/tedarikciler" className="text-gray-600 mr-4">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Truck size={20} className="text-purple-600"/> Yeni Tedarikçi Ekle
        </h1>
      </header>

      <main className="p-5">
        <form onSubmit={kaydet} className="space-y-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tedarikçi Firma / Kişi</label>
            <input required type="text" name="name" value={form.name} onChange={handleChange} 
              className="w-full border border-gray-300 rounded-xl p-3 text-gray-800 focus:ring-2 focus:ring-purple-500 outline-none" 
              placeholder="Örn: Akçansa Çimento" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon Numarası</label>
            <input type="tel" name="phone" value={form.phone} onChange={handleChange} 
              className="w-full border border-gray-300 rounded-xl p-3 text-gray-800 focus:ring-2 focus:ring-purple-500 outline-none" 
              placeholder="05..." />
          </div>

          {mesaj && (
            <div className={`p-3 rounded-xl text-sm font-medium ${mesaj.includes('Hata') ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
              {mesaj}
            </div>
          )}

          <button type="submit" disabled={loading} 
            className="w-full bg-purple-600 text-white font-bold py-4 rounded-xl shadow-md flex items-center justify-center gap-2 hover:bg-purple-700 transition disabled:opacity-50">
            <Save size={20} />
            {loading ? 'Kaydediliyor...' : 'Tedarikçiyi Kaydet'}
          </button>
        </form>
      </main>
    </div>
  );
}