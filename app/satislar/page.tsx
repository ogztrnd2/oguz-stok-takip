"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, Printer, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function SatislarPage() {
  const [satislar, setSatislar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSatislar = async () => {
      const { data } = await supabase
        .from('orders')
        .select(`
          id, customer_name, total_amount, created_at,
          order_items ( id )
        `)
        .order('created_at', { ascending: false });
        
      if (data) setSatislar(data);
      setLoading(false);
    };
    fetchSatislar();
  }, []);

  const formatTarih = (tarih: string) => {
    const d = new Date(tarih);
    return d.toLocaleDateString('tr-TR') + ' • ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans selection:bg-indigo-100">
      
      {/* CAM EFEKTLİ ÜST MENÜ */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg px-6 py-5 border-b border-slate-200/60 flex items-center gap-4">
        <Link href="/" className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-black text-slate-900">Satış Geçmişi</h1>
          <p className="text-[11px] font-medium text-slate-500">Tüm Çıkışlar ve Fişler</p>
        </div>
      </header>

      <main className="p-6">
        {loading ? (
          <div className="text-center text-slate-500 py-10 font-medium">Yükleniyor...</div>
        ) : satislar.length === 0 ? (
          <div className="text-center py-10 text-slate-500 bg-white rounded-3xl border border-slate-100 shadow-sm">
            Henüz hiçbir satış yapılmamış.
          </div>
        ) : (
          <div className="space-y-4">
            {satislar.map((satis) => (
              <div key={satis.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center group hover:shadow-md transition-all">
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-indigo-50 text-indigo-600">
                    <ShoppingCart size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{satis.customer_name}</h3>
                    <p className="text-[11px] font-medium text-slate-500 mt-0.5">{formatTarih(satis.created_at)}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{satis.order_items?.length || 0} Kalem Ürün</p>
                  </div>
                </div>
                
                <div className="text-right flex flex-col items-end gap-3">
                  <p className="font-black text-slate-800 text-lg">
                    ₺{satis.total_amount?.toLocaleString('tr-TR')}
                  </p>
                  <Link href={`/fis/${satis.id}`} className="flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all font-bold shadow-sm">
                    <Printer size={14} /> Fiş Kes
                  </Link>
                </div>

              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}