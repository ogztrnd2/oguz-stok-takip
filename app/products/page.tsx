"use client";

import React, { useState, useEffect } from 'react';
import { Package, ArrowLeft, Edit, Plus } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase.from('products').select('*').order('name');
      if (data) setProducts(data);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans selection:bg-blue-100">
      
      {/* CAM EFEKTLİ ÜST MENÜ */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg px-6 py-5 border-b border-slate-200/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900">Ürün Listesi</h1>
            <p className="text-[11px] font-medium text-slate-500">Stok ve Fiyat Takibi</p>
          </div>
        </div>
        <Link href="/urun-ekle" className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center hover:bg-indigo-100 transition-colors">
          <Plus size={20} />
        </Link>
      </header>

      <main className="p-6">
        {loading ? (
          <div className="text-center text-slate-500 py-10 font-medium">Yükleniyor...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-10 text-slate-500 bg-white rounded-3xl border border-slate-100 shadow-sm">
            Henüz hiç ürün eklemediniz.
            <Link href="/urun-ekle" className="block mt-4 text-blue-600 font-bold">Yeni Ürün Ekle</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => {
              const isKritik = product.stock_quantity <= product.critical_stock;
              return (
                <div key={product.id} className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center group hover:shadow-md transition-all">
                  
                  {/* Sol Taraf - Ürün Bilgileri */}
                  <div className="flex-1 pr-3">
                    <h3 className="font-bold text-slate-800 text-lg mb-1">{product.name}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-500">
                      <span className="bg-slate-50 px-2 py-1 rounded-md border border-slate-100">Alış: ₺{product.buy_price}</span>
                      <span className="bg-slate-50 px-2 py-1 rounded-md border border-slate-100">Satış: ₺{product.sell_price}</span>
                    </div>
                  </div>
                  
                  {/* Sağ Taraf - Stok ve Düzenle Butonu (Yanyana) */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    
                    {/* Stok Rozeti */}
                    <div className={`min-w-[50px] sm:min-w-[60px] px-2 py-2 sm:px-3 rounded-xl text-center flex flex-col items-center justify-center border ${
                      isKritik 
                        ? 'bg-red-50 border-red-100 text-red-600' 
                        : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                    }`}>
                      <span className="text-lg font-black leading-none">{product.stock_quantity}</span>
                      <span className="text-[9px] uppercase font-bold tracking-wider mt-1 opacity-80">{product.unit}</span>
                    </div>
                    
                    {/* Düzenle Butonu - Absolute kaldırıldı, yanyana hizalandı */}
                    <Link href={`/urun-duzenle/${product.id}`} className="w-9 h-9 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all shrink-0">
                      <Edit size={16} />
                    </Link>

                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}