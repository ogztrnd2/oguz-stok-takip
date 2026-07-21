"use client";

import React, { useState } from 'react';
import { ArrowLeft, UserPlus, Save, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function CariEklePage() {
  const [loading, setLoading] = useState(false);
  const [mesaj, setMesaj] = useState('');
  
  const [form, setForm] = useState({
    name: '',
    phone: '',
    balance: '' // Mevcut/Başlangıç borcu
  });

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const cariKaydet = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setMesaj('');

    try {
      const { error } = await supabase.from('contacts').insert([
        {
          name: form.name,
          phone: form.phone,
          type: 'musteri', // Tedarikçi ile karışmaması için musteri yapıyoruz
          balance: Number(form.balance) || 0
        }
      ]);

      if (error) throw error;

      setMesaj('basarili');
      setForm({ name: '', phone: '', balance: '' });
      setTimeout(() => setMesaj(''), 3000);

    } catch (error: any) {
      setMesaj('Kayıt sırasında hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans selection:bg-blue-100">
      
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg px-6 py-5 border-b border-slate-200/60 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/cariler" className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900">Müşteri (Cari) Ekle</h1>
            <p className="text-[11px] font-medium text-slate-500">Yeni Açık Hesap Oluştur</p>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-6">
        
        {mesaj === 'basarili' && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-2xl flex items-center gap-3 font-bold shadow-sm shadow-emerald-500/10">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
              <CheckCircle2 size={20} />
            </div>
            Müşteri başarıyla sisteme kaydedildi!
          </div>
        )}

        {mesaj !== '' && mesaj !== 'basarili' && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium border border-red-100">
            {mesaj}
          </div>
        )}

        <form onSubmit={cariKaydet} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-5">
          
          <div className="flex justify-center mb-2">
            <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center">
              <UserPlus size={32} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Müşteri / Firma Adı *</label>
            <input required type="text" name="name" value={form.name} onChange={handleChange} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-800 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all" 
              placeholder="Örn: Ahmet Usta" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Telefon Numarası</label>
            <input type="tel" name="phone" value={form.phone} onChange={handleChange} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-800 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all" 
              placeholder="05..." />
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">Devreden Mevcut Borcu (Bakiye)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">₺</span>
              <input type="number" step="0.01" name="balance" value={form.balance} onChange={handleChange} 
                className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-center font-black text-lg text-red-500 focus:border-blue-500 outline-none transition-all" 
                placeholder="0.00" />
            </div>
            <p className="text-[10px] text-center text-slate-400 mt-2 font-medium">Eğer müşterinin şu an size borcu varsa buraya yazın.</p>
          </div>

          <button type="submit" disabled={loading} 
            className="w-full mt-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50">
            <Save size={20} />
            {loading ? 'Kaydediliyor...' : 'Müşteriyi Kaydet'}
          </button>
        </form>

      </main>
    </div>
  );
}