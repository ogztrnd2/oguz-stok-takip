"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowDownToLine, Truck } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function AlislarPage() {
  const [alislar, setAlislar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlislar = async () => {
      const { data } = await supabase
        .from('transactions')
        .select(`
          id, quantity, total_price, created_at,
          products ( name, unit ),
          contacts ( name )
        `)
        .eq('type', 'alis')
        .order('created_at', { ascending: false });
        
      if (data) setAlislar(data);
      setLoading(false);
    };
    fetchAlislar();
  }, []);

  const formatTarih = (tarih: string) => {
    const d = new Date(tarih);
    return d.toLocaleDateString('tr-TR') + ' • ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans selection:bg-blue-100">
      
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg px-6 py-5 border-b border-slate-200/60 flex items-center gap-4">
        <Link href="/" className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-black text-slate-900">Alış Geçmişi</h1>
          <p className="text-[11px] font-medium text-slate-500">Mal Girişleri ve Tedarik</p>
        </div>
      </header>

      <main className="p-6">
        {loading ? (
          <div className="text-center text-slate-500 py-10 font-medium">Yükleniyor...</div>
        ) : alislar.length === 0 ? (
          <div className="text-center py-10 text-slate-500 bg-white rounded-3xl border border-slate-100 shadow-sm">
            Henüz sisteme hiç mal girişi yapılmamış.
          </div>
        ) : (
          <div className="space-y-4">
            {alislar.map((alis) => (
              <div key={alis.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center group hover:shadow-md transition-all">
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-600">
                    <Truck size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{alis.products?.name || 'Bilinmeyen Ürün'}</h3>
                    <p className="text-[11px] font-medium text-slate-500 mt-0.5">{formatTarih(alis.created_at)}</p>
                    {alis.contacts && (
                      <p className="text-[10px] font-bold text-blue-600 mt-1 uppercase tracking-wider">{alis.contacts.name}</p>
                    )}
                  </div>
                </div>
                
                <div className="text-right flex flex-col items-end gap-1">
                  <p className="font-black text-emerald-600 text-lg">
                    +{alis.quantity} <span className="text-sm font-bold text-emerald-600/70">{alis.products?.unit}</span>
                  </p>
                  <p className="text-xs font-bold text-slate-400">
                    ₺{alis.total_price?.toLocaleString('tr-TR')}
                  </p>
                </div>

              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}