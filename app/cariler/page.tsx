"use client";

import React, { useState, useEffect } from 'react';
import { Users, Phone, ArrowLeft, Home, Package, PlusCircle, Settings, Plus } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function CarilerPage() {
  const [cariler, setCariler] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCariler = async () => {
      const { data } = await supabase.from('contacts').select('*').order('name');
      if (data) setCariler(data);
      setLoading(false);
    };
    fetchCariler();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <header className="bg-white px-5 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center">
          <Link href="/" className="text-gray-600 mr-4">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-lg font-bold text-gray-800">Cari Hesaplar</h1>
        </div>
        <Link href="/cari-ekle" className="bg-blue-100 text-blue-600 p-2 rounded-full">
          <Plus size={20} />
        </Link>
      </header>

      <main className="p-5">
        {loading ? (
          <div className="text-center text-gray-500 py-10">Yükleniyor...</div>
        ) : cariler.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            Henüz hiç cari eklemediniz.
          </div>
        ) : (
          <div className="space-y-3">
            {cariler.map((cari) => (
              <div key={cari.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-800">{cari.name}</h3>
                    <span className={`text-[10px] px-2 py-1 rounded-md font-medium ${cari.type === 'musteri' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                      {cari.type === 'musteri' ? 'Müşteri' : 'Tedarikçi'}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${cari.balance < 0 ? 'text-red-600' : cari.balance > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                      ₺ {cari.balance.toLocaleString('tr-TR')}
                    </p>
                    <p className="text-[10px] text-gray-400">Bakiye</p>
                  </div>
                </div>
                {cari.phone && (
                  <div className="flex items-center text-xs text-gray-500 mt-1 gap-1">
                    <Phone size={12} /> {cari.phone}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ALT MENÜ */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-50">
        <Link href="/" className="flex flex-col items-center text-gray-400 hover:text-gray-800">
          <Home size={24} />
          <span className="text-[10px] mt-1 font-medium">Ana Sayfa</span>
        </Link>
        <Link href="/products" className="flex flex-col items-center text-gray-400 hover:text-gray-800">
          <Package size={24} />
          <span className="text-[10px] mt-1 font-medium">Ürünler</span>
        </Link>
        
        <Link href="/alis-gir" className="flex flex-col items-center justify-center -mt-8">
          <div className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg border-4 border-gray-50">
            <PlusCircle size={30} />
          </div>
        </Link>

        <Link href="/cariler" className="flex flex-col items-center text-blue-600">
          <Users size={24} />
          <span className="text-[10px] mt-1 font-medium">Cariler</span>
        </Link>
        <button className="flex flex-col items-center text-gray-400 hover:text-gray-800">
          <Settings size={24} />
          <span className="text-[10px] mt-1 font-medium">Ayarlar</span>
        </button>
      </nav>
    </div>
  );
}