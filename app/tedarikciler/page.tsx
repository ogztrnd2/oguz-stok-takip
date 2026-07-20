"use client";

import React, { useState, useEffect } from 'react';
import { Truck, Phone, ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function TedarikcilerPage() {
  const [tedarikciler, setTedarikciler] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTedarikciler = async () => {
      const { data } = await supabase
        .from('contacts')
        .select('*')
        .eq('type', 'tedarikci')
        .order('name');
      
      if (data) setTedarikciler(data);
      setLoading(false);
    };
    fetchTedarikciler();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans selection:bg-purple-100">
      
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg px-6 py-5 border-b border-slate-200/60 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900">Tedarikçiler</h1>
            <p className="text-[11px] font-medium text-slate-500">Firma Bakiye Takibi</p>
          </div>
        </div>
        <Link href="/tedarikci-ekle" className="w-10 h-10 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center hover:bg-purple-100 transition-colors">
          <Plus size={20} />
        </Link>
      </header>

      <main className="p-6">
        {loading ? (
          <div className="text-center text-slate-500 py-10 font-medium">Yükleniyor...</div>
        ) : tedarikciler.length === 0 ? (
          <div className="text-center py-10 text-slate-500 bg-white rounded-3xl border border-slate-100 shadow-sm">
            Henüz hiç tedarikçi eklemediniz.
          </div>
        ) : (
          <div className="space-y-4">
            {tedarikciler.map((t) => (
              <div key={t.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center group hover:shadow-md transition-all">
                
                <div>
                  <h3 className="font-bold text-slate-800 text-lg mb-1">{t.name}</h3>
                  {t.phone && (
                    <div className="flex items-center text-xs font-medium text-slate-500 gap-1.5 bg-slate-50 inline-flex px-2 py-1 rounded-md border border-slate-100">
                      <Phone size={12} /> {t.phone}
                    </div>
                  )}
                </div>
                
                <div className="text-right flex flex-col items-end">
                  <p className={`font-black text-lg ${t.balance < 0 ? 'text-red-500' : t.balance > 0 ? 'text-emerald-500' : 'text-slate-800'}`}>
                    ₺{t.balance.toLocaleString('tr-TR')}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Bakiye</p>
                </div>

              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}