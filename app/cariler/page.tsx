"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Plus, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function CarilerPage() {
  const [musteriler, setMusteriler] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMusteriler = async () => {
      const { data } = await supabase
        .from('contacts')
        .select('*')
        .eq('type', 'musteri')
        .order('name');
      
      if (data) setMusteriler(data);
      setLoading(false);
    };
    fetchMusteriler();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans selection:bg-amber-100">
      
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg px-6 py-5 border-b border-slate-200/60 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900">Müşteriler</h1>
            <p className="text-[11px] font-medium text-slate-500">Cari Rehberi</p>
          </div>
        </div>
        <Link href="/cari-ekle" className="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center hover:bg-amber-100 transition-colors shadow-sm">
          <Plus size={20} />
        </Link>
      </header>

      <main className="p-6">
        {loading ? (
          <div className="text-center text-slate-500 py-10 font-medium">Yükleniyor...</div>
        ) : musteriler.length === 0 ? (
          <div className="text-center py-10 text-slate-500 bg-white rounded-3xl border border-slate-100 shadow-sm">
            Henüz hiç müşteri eklemediniz.
          </div>
        ) : (
          <div className="space-y-3">
            {musteriler.map((m) => (
              <Link key={m.id} href={`/cari/${m.id}`} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center group hover:shadow-md hover:border-blue-200 transition-all active:scale-[0.98] block">
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-50 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{m.name}</h3>
                    <p className="text-[11px] font-medium text-slate-500 mt-0.5">{m.phone || 'Telefon yok'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right flex flex-col items-end">
                    <p className={`font-black ${m.balance > 0 ? 'text-red-500' : 'text-slate-800'}`}>
                      ₺{(m.balance || 0).toLocaleString('tr-TR')}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Bakiye</p>
                  </div>
                  <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                </div>

              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}