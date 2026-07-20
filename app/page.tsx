"use client";

import React, { useState, useEffect } from 'react';
import { Home, Package, PlusCircle, Users, TrendingUp, Truck, ShoppingCart, ArrowDownToLine, Bell, Search } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function HomePage() {
  const [arama, setArama] = useState('');
  const [urunler, setUrunler] = useState<any[]>([]);
  const [aramaAcik, setAramaAcik] = useState(false);

  useEffect(() => {
    const urunleriGetir = async () => {
      const { data } = await supabase.from('products').select('id, name, stock_quantity, unit');
      if (data) setUrunler(data);
    };
    urunleriGetir();
  }, []);

  const filtrelenmisUrunler = urunler.filter(u => 
    u.name.toLowerCase().includes(arama.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans selection:bg-blue-100 relative">
      
      {/* ÜST MENÜ */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg px-6 py-5 border-b border-slate-200/60 flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-none">Oğuz Stok</h1>
          <p className="text-xs font-medium text-slate-500 mt-1">Profesyonel Şantiye Yönetimi</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-colors">
            <Bell size={18} />
          </button>
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30">
            OS
          </div>
        </div>
      </header>

      <main className="p-6 space-y-8">
        
        {/* AKILLI ARAMA ÇUBUĞU */}
        <section className="relative z-40">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Search size={20} />
            </div>
            <input 
              type="text" 
              value={arama}
              onChange={(e) => {
                setArama(e.target.value);
                setAramaAcik(e.target.value.length > 0);
              }}
              onFocus={() => setAramaAcik(arama.length > 0)}
              onBlur={() => setTimeout(() => setAramaAcik(false), 200)}
              className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm font-medium placeholder:text-slate-400"
              placeholder="Malzeme adı ile ara..." 
            />
          </div>

          {/* ARAMA SONUÇLARI DROPDOWN */}
          {aramaAcik && (
            <div className="absolute w-full mt-2 bg-white rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-100 overflow-hidden max-h-60 overflow-y-auto">
              {filtrelenmisUrunler.length > 0 ? (
                filtrelenmisUrunler.map((urun) => (
                  <Link 
                    key={urun.id} 
                    href={`/urun/${urun.id}`} 
                    className="flex justify-between items-center px-5 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
                  >
                    <span className="font-bold text-slate-700">{urun.name}</span>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                      {urun.stock_quantity} {urun.unit}
                    </span>
                  </Link>
                ))
              ) : (
                <div className="p-5 text-center text-sm font-medium text-slate-400">Sonuç bulunamadı...</div>
              )}
            </div>
          )}
        </section>

        {/* KARŞILAMA KARTI */}
        <section>
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl shadow-slate-900/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <h2 className="text-slate-300 text-sm font-medium mb-1">İyi Çalışmalar</h2>
            <p className="text-2xl font-bold mb-6">Şantiyede durum nedir?</p>
            
            <div className="flex gap-4">
              <Link href="/satis-yap" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 px-4 rounded-2xl flex items-center justify-center gap-2 font-semibold transition-all active:scale-95 shadow-lg shadow-blue-600/30">
                <ShoppingCart size={18} /> Yeni Satış
              </Link>
              <Link href="/alis-gir" className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-2xl flex items-center justify-center gap-2 font-semibold transition-all backdrop-blur-md active:scale-95">
                <ArrowDownToLine size={18} /> Mal Girişi
              </Link>
            </div>
          </div>
        </section>

        {/* MODÜLLER */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800">Modüller</h3>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <Link href="/products" className="flex flex-col items-center gap-2 group active:scale-95 transition-transform">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                <Package size={24} />
              </div>
              <span className="text-[11px] font-semibold text-slate-600">Ürünler</span>
            </Link>
            
            <Link href="/cariler" className="flex flex-col items-center gap-2 group active:scale-95 transition-transform">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-amber-500 group-hover:bg-amber-50 group-hover:border-amber-100 transition-colors">
                <Users size={24} />
              </div>
              <span className="text-[11px] font-semibold text-slate-600">Cariler</span>
            </Link>

            <Link href="/tedarikciler" className="flex flex-col items-center gap-2 group active:scale-95 transition-transform">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-purple-500 group-hover:bg-purple-50 group-hover:border-purple-100 transition-colors">
                <Truck size={24} />
              </div>
              <span className="text-[11px] font-semibold text-slate-600">Tedarikçi</span>
            </Link>

            <Link href="/urun-ekle" className="flex flex-col items-center gap-2 group active:scale-95 transition-transform">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl border border-slate-200 border-dashed flex items-center justify-center text-slate-500 group-hover:bg-slate-200 transition-colors">
                <PlusCircle size={24} />
              </div>
              <span className="text-[11px] font-semibold text-slate-600">Yeni Ekle</span>
            </Link>
          </div>
        </section>

      </main>

      {/* ALT MENÜ */}
      <nav className="fixed bottom-0 w-full bg-white/80 backdrop-blur-lg border-t border-slate-200/60 px-6 py-4 flex justify-between items-center z-50 pb-safe">
        <Link href="/" className="flex flex-col items-center text-blue-600">
          <div className="relative">
            <Home size={24} strokeWidth={2.5} />
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></div>
          </div>
        </Link>
        <Link href="/products" className="flex flex-col items-center text-slate-400 hover:text-slate-700 transition-colors">
          <Package size={24} strokeWidth={2} />
        </Link>
        <Link href="/satis-yap" className="flex flex-col items-center justify-center -mt-10 group">
          <div className="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/40 border-4 border-slate-50 group-active:scale-95 transition-transform">
            <PlusCircle size={28} />
          </div>
        </Link>
        <Link href="/cariler" className="flex flex-col items-center text-slate-400 hover:text-slate-700 transition-colors">
          <Users size={24} strokeWidth={2} />
        </Link>
        <Link href="/satislar" className="flex flex-col items-center text-slate-400 hover:text-slate-700 transition-colors">
          <TrendingUp size={24} strokeWidth={2} />
        </Link>
      </nav>
    </div>
  );
}