"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Package, History, Truck, Edit, Calendar } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function UrunDetayPage() {
  const params = useParams();
  const [urun, setUrun] = useState<any>(null);
  const [sonAlimlar, setSonAlimlar] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const veriGetir = async () => {
      if (!params.id) return;

      // 1. Ürün bilgilerini getir
      const { data: urunData } = await supabase
        .from('products')
        .select('*')
        .eq('id', params.id)
        .single();
      
      if (urunData) setUrun(urunData);

      // 2. En son alınan YERLERİ (Son 3 İşlem) getir
      const { data: alimlarData } = await supabase
        .from('transactions')
        .select(`
          id, quantity, total_price, created_at,
          contacts ( name )
        `)
        .eq('type', 'alis')
        .eq('product_id', params.id)
        .order('created_at', { ascending: false })
        .limit(3); 
      
      if (alimlarData) setSonAlimlar(alimlarData);

      setLoading(false);
    };
    
    veriGetir();
  }, [params.id]);

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-medium text-slate-500">Yükleniyor...</div>;
  if (!urun) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-medium text-slate-500">Ürün bulunamadı.</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans selection:bg-blue-100">
      
      {/* ÜST MENÜ */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg px-6 py-5 border-b border-slate-200/60 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900">Malzeme Detayı</h1>
          </div>
        </div>
        <Link href={`/urun-duzenle/${urun.id}`} className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center hover:bg-indigo-100 transition-colors shadow-sm">
          <Edit size={18} />
        </Link>
      </header>

      <main className="p-6 space-y-6">
        
        {/* TEMEL BİLGİ KARTI */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <div className="flex gap-4">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                <Package size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 leading-tight">{urun.name}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border border-slate-100">Genel Alış: ₺{urun.buy_price}</span>
                  <span className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border border-slate-100">Satış: ₺{urun.sell_price}</span>
                </div>
              </div>
            </div>
          </div>

          {/* GÜNCEL STOK */}
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100 flex flex-col items-center justify-center">
            <p className="text-xs font-bold uppercase tracking-wider mb-1 text-emerald-600">Güncel Stok</p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-emerald-700">{urun.stock_quantity}</span>
              <span className="text-sm font-bold text-emerald-600/70">{urun.unit}</span>
            </div>
          </div>
        </div>

        {/* SON ALIM ANALİZİ (SON 3 GEÇMİŞ) */}
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider pl-2 flex items-center gap-2">
          <History size={16} className="text-blue-500"/> Son Alım Geçmişi (Trend)
        </h3>

        {sonAlimlar.length > 0 ? (
          <div className="space-y-4">
            {sonAlimlar.map((alim, index) => (
              <div key={alim.id} className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-3xl text-white shadow-lg shadow-slate-900/10 relative overflow-hidden">
                {/* Numara Filigranı */}
                <div className="absolute -right-4 -top-6 text-9xl font-black text-white/5 pointer-events-none select-none">
                  {index + 1}
                </div>

                <div className="flex justify-between items-center mb-4 relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <Truck size={14} className="text-blue-400" />
                    </div>
                    <span className="font-bold text-slate-100">{alim.contacts?.name || 'Bilinmeyen Tedarikçi'}</span>
                  </div>
                  <div className="text-right flex items-center gap-1.5 text-slate-400">
                    <Calendar size={14} />
                    <span className="font-medium text-xs">{new Date(alim.created_at).toLocaleDateString('tr-TR')}</span>
                  </div>
                </div>

                <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md grid grid-cols-3 gap-2 text-center relative z-10 border border-white/5">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Miktar</p>
                    <p className="font-bold text-sm">{alim.quantity} {urun.unit}</p>
                  </div>
                  <div className="border-x border-white/10">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Toplam</p>
                    <p className="font-bold text-sm">₺{alim.total_price.toLocaleString('tr-TR')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-blue-300 uppercase font-bold tracking-wider mb-1">Birim Fiyat</p>
                    <p className="font-black text-sm text-blue-400">
                      ₺{(alim.total_price / alim.quantity).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-3">
              <Truck size={24} />
            </div>
            <p className="text-slate-500 font-medium text-sm">Bu ürün için henüz sistemde bir alış faturası (mal girişi) bulunmuyor.</p>
          </div>
        )}

      </main>
    </div>
  );
}