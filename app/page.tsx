"use client";

import React, { useState, useEffect } from 'react';
import { Home, Package, PlusCircle, Users, TrendingUp, Truck, ShoppingCart, ArrowDownToLine, Bell, Search, Wallet, Building2, User, Layers, Store } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function HomePage() {
  const [arama, setArama] = useState('');
  const [aramaAcik, setAramaAcik] = useState(false);
  const [urunler, setUrunler] = useState<any[]>([]);
  const [kisiler, setKisiler] = useState<any[]>([]);

  useEffect(() => {
    const verileriGetir = async () => {
      const { data: uData } = await supabase.from('products').select('id, name, stock_quantity, unit');
      if (uData) setUrunler(uData);

      const { data: kData } = await supabase.from('contacts').select('id, name, type, phone');
      if (kData) setKisiler(kData);
    };
    verileriGetir();
  }, []);

  const filtrelenmisUrunler = urunler.filter(u => 
    u.name.toLowerCase().includes(arama.toLowerCase())
  );

  const filtrelenmisKisiler = kisiler.filter(k => 
    k.name.toLowerCase().includes(arama.toLowerCase())
  );

  const toplamSonucSayisi = filtrelenmisUrunler.length + filtrelenmisKisiler.length;

  return (
    <div className="min-h-screen bg-slate-100 pb-28 font-sans selection:bg-blue-100 relative flex flex-col items-center">
      
      {/* ÜST PROFESYONEL HEADER */}
      <header className="w-full max-w-md bg-white/80 backdrop-blur-md px-6 py-4 border-b border-slate-200/60 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-[11px] font-black tracking-tighter shadow-lg shadow-blue-500/30 px-1">
            YERLİ
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">Oğuzhan Ev İnş. San. Tic. Ltd. Şti.</h1>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">Yönetim Paneli</p>
          </div>
        </div>
        <button className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200/60 text-slate-600 flex items-center justify-center hover:bg-slate-100 transition-colors">
          <Bell size={18} />
        </button>
      </header>

      <main className="w-full max-w-md p-5 space-y-4">
        
        {/* ==================================================== */}
        {/* BÜYÜK MERKEZİ EVRENSEL ARAMA ÇUBUĞU */}
        {/* ==================================================== */}
        <section className="relative z-40 pt-1">
          <div className="relative shadow-xl shadow-blue-500/5 rounded-3xl bg-white border border-slate-200/80">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-blue-600">
              <Search size={24} />
            </div>
            <input 
              type="text" 
              value={arama}
              onChange={(e) => {
                setArama(e.target.value);
                setAramaAcik(e.target.value.length > 0);
              }}
              onFocus={() => setAramaAcik(arama.length > 0)}
              onBlur={() => setTimeout(() => setAramaAcik(false), 250)}
              className="w-full bg-transparent py-5 pl-14 pr-5 text-slate-800 font-bold text-base outline-none placeholder:text-slate-400 placeholder:font-medium"
              placeholder="Pencere ölçüsü, malzeme, müşteri..." 
            />
          </div>

          {/* ARAMA SONUÇLARI AÇILIR PENCERESİ */}
          {aramaAcik && (
            <div className="absolute left-0 right-0 mt-3 bg-white rounded-3xl shadow-2xl shadow-slate-900/20 border border-slate-100 overflow-hidden max-h-96 overflow-y-auto divide-y divide-slate-50 z-50">
              {toplamSonucSayisi > 0 ? (
                <>
                  {filtrelenmisUrunler.length > 0 && (
                    <div className="p-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-4 py-2">Malzemeler & Pencereler</p>
                      {filtrelenmisUrunler.map((urun) => (
                        <Link key={urun.id} href={`/urun/${urun.id}`} className="flex justify-between items-center px-4 py-3.5 rounded-2xl hover:bg-blue-50/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><Package size={18} /></div>
                            <span className="font-bold text-slate-800 text-sm">{urun.name}</span>
                          </div>
                          <span className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-xl">
                            {urun.stock_quantity} {urun.unit}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}

                  {filtrelenmisKisiler.length > 0 && (
                    <div className="p-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-4 py-2">Müşteri, Firma ve Tedarikçiler</p>
                      {filtrelenmisKisiler.map((kisi) => {
                        let gidilecekYol = `/cari/${kisi.id}`;
                        let rozetMetin = "Müşteri";
                        let rozetRenk = "bg-amber-50 text-amber-600 border border-amber-100";
                        let IconComponent = User;

                        if (kisi.type === 'firma') {
                          gidilecekYol = `/firma/${kisi.id}`;
                          rozetMetin = "Firma";
                          rozetRenk = "bg-indigo-50 text-indigo-600 border border-indigo-100";
                          IconComponent = Building2;
                        } else if (kisi.type === 'tedarikci') {
                          gidilecekYol = `/tedarikci/${kisi.id}`;
                          rozetMetin = "Tedarikçi";
                          rozetRenk = "bg-purple-50 text-purple-600 border border-purple-100";
                          IconComponent = Truck;
                        }

                        return (
                          <Link key={kisi.id} href={gidilecekYol} className="flex justify-between items-center px-4 py-3.5 rounded-2xl hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${rozetRenk}`}><IconComponent size={18} /></div>
                              <div>
                                <span className="font-bold text-slate-800 text-sm block">{kisi.name}</span>
                                <span className="text-[11px] font-medium text-slate-400">{kisi.phone || 'Telefon yok'}</span>
                              </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${rozetRenk}`}>{rozetMetin}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="p-8 text-center text-sm font-medium text-slate-400">Aradığınız kriterde kayıt bulunamadı...</div>
              )}
            </div>
          )}
        </section>

        {/* ==================================================== */}
        {/* ALACAKLI DEFTERİ BUTONU */}
        {/* ==================================================== */}
        <section>
          <Link href="/alacaklar" className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:opacity-95 text-white p-4.5 rounded-2xl flex items-center justify-between shadow-lg shadow-emerald-500/20 transition-all active:scale-98 group">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                <Wallet size={24} />
              </div>
              <div>
                <h3 className="font-black text-white text-base">Alacaklı Defteri</h3>
                <p className="text-xs font-medium text-emerald-100 mt-0.5">Borçlu müşteriler ve alacak takibi</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </div>
          </Link>
        </section>

        {/* ==================================================== */}
        {/* ARDİYELER BUTONU */}
        {/* ==================================================== */}
        <section>
          <Link href="/firmalar" className="bg-gradient-to-r from-indigo-600 to-violet-700 hover:opacity-95 text-white p-4.5 rounded-2xl flex items-center justify-between shadow-lg shadow-indigo-500/20 transition-all active:scale-98 group">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                <Store size={24} />
              </div>
              <div>
                <h3 className="font-black text-white text-base">ARDİYELER</h3>
                <p className="text-xs font-medium text-indigo-100 mt-0.5">Malzeme aldığımız firmalar ve tedarikçiler</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </div>
          </Link>
        </section>

        {/* ==================================================== */}
        {/* ÜRÜNLER - ÜRÜN EKLE - ÜRÜN LİSTESİ ALANI */}
        {/* ==================================================== */}
        <section className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers size={16} className="text-blue-600" /> Ürün Yönetimi
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Link href="/products" className="bg-slate-50 hover:bg-slate-100 border border-slate-200/60 p-4 rounded-2xl flex flex-col justify-between transition-all group active:scale-95">
              <div className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center text-blue-600 mb-3 group-hover:scale-110 transition-transform">
                <Package size={20} />
              </div>
              <div>
                <h4 className="font-black text-slate-800 text-sm">Ürün Listesi</h4>
                <p className="text-[11px] font-medium text-slate-400 mt-0.5">Tüm stoklar ve pencereler</p>
              </div>
            </Link>

            <Link href="/products" className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl flex flex-col justify-between transition-all shadow-lg shadow-blue-500/20 group active:scale-95">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform">
                <PlusCircle size={20} />
              </div>
              <div>
                <h4 className="font-black text-white text-sm">Ürün Ekle</h4>
                <p className="text-[11px] font-medium text-blue-100 mt-0.5">Yeni malzeme veya ölçü</p>
              </div>
            </Link>
          </div>
        </section>

        {/* HIZLI İŞLEM KARTI */}
        <section>
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-5 text-white shadow-xl shadow-slate-900/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1"></p>
            <p className="text-lg font-black mb-4">Hızlı Satış & Alış</p>
            
            <div className="grid grid-cols-2 gap-3">
              <Link href="/satis-yap" className="bg-blue-600 hover:bg-blue-500 text-white py-3 px-3 rounded-2xl flex items-center justify-center gap-2 font-bold text-xs transition-all shadow-md shadow-blue-600/30 active:scale-95">
                <ShoppingCart size={16} /> Malzeme Satışı
              </Link>
              <Link href="/alis-gir" className="bg-white/10 hover:bg-white/20 text-white py-3 px-3 rounded-2xl flex items-center justify-center gap-2 font-bold text-xs transition-all backdrop-blur-md active:scale-95">
                <ArrowDownToLine size={16} /> Malzeme Girişi
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* MOBIL ALT NAVİGASYON ÇUBUĞU */}
      <nav className="fixed bottom-0 w-full max-w-md bg-white/90 backdrop-blur-lg border-t border-slate-200/60 px-6 py-3.5 flex justify-between items-center z-50">
        <Link href="/" className="flex flex-col items-center text-blue-600">
          <Home size={22} strokeWidth={2.5} />
        </Link>
        <Link href="/products" className="flex flex-col items-center text-slate-400 hover:text-slate-700">
          <Package size={22} strokeWidth={2} />
        </Link>
        <Link href="/satis-yap" className="flex flex-col items-center justify-center -mt-9 group">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-blue-500/40 border-4 border-slate-100 group-active:scale-95 transition-transform">
            <PlusCircle size={28} />
          </div>
        </Link>
        <Link href="/alacaklar" className="flex flex-col items-center text-slate-400 hover:text-slate-700">
          <Wallet size={22} strokeWidth={2} />
        </Link>
        <Link href="/satislar" className="flex flex-col items-center text-slate-400 hover:text-slate-700">
          <TrendingUp size={22} strokeWidth={2} />
        </Link>
      </nav>

    </div>
  );
}