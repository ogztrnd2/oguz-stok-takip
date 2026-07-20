"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Printer, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function CokluFisSayfasi() {
  const params = useParams();
  const router = useRouter();
  const [siparis, setSiparis] = useState<any>(null);
  const [kalemler, setKalemler] = useState<any[]>([]);

  useEffect(() => {
    const fisGetir = async () => {
      // Siparişin ana bilgilerini çek
      const { data: orderData } = await supabase
        .from('orders')
        .select('*')
        .eq('id', params.id)
        .single();
        
      if (orderData) {
        setSiparis(orderData);
        // Siparişe ait kalemleri çek (Ürün isimleriyle birlikte)
        const { data: itemsData } = await supabase
          .from('order_items')
          .select(`quantity, price, products(name, unit)`)
          .eq('order_id', params.id);
          
        if (itemsData) setKalemler(itemsData);
      }
    };
    if (params.id) fisGetir();
  }, [params.id]);

  if (!siparis) return <div className="p-10 text-center font-bold text-gray-500">Fiş Hazırlanıyor...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-5 font-sans flex flex-col items-center">
      
      <div className="w-full max-w-md bg-green-100 text-green-700 p-3 rounded-xl flex items-center justify-center gap-2 mb-4 font-bold shadow-sm print:hidden">
        <CheckCircle2 size={20} /> Satış Başarıyla Kaydedildi
      </div>

      {/* YAZDIRILACAK FİŞ ALANI */}
      <div id="fis-alani" className="bg-white w-full max-w-md p-8 shadow-lg border border-gray-200">
        
        <div className="text-center mb-6 border-b pb-4 border-dashed border-gray-400">
          <h2 className="text-2xl font-black text-gray-800">OĞUZ STOK</h2>
          <p className="text-sm text-gray-500">Şantiye Çıkış Fişi</p>
        </div>

        <div className="text-sm space-y-1 mb-6 text-gray-700">
          <p><span className="font-bold">Tarih:</span> {new Date(siparis.created_at).toLocaleString('tr-TR')}</p>
          <p><span className="font-bold">Müşteri/Cari:</span> {siparis.customer_name}</p>
          <p><span className="font-bold">İşlem No:</span> {siparis.id.substring(0, 8).toUpperCase()}</p>
        </div>
        
        <table className="w-full text-sm text-left mb-4">
          <thead>
            <tr className="border-b border-gray-300 text-gray-600">
              <th className="py-2">Ürün Adı</th>
              <th className="py-2 text-center">Miktar</th>
              <th className="py-2 text-right">Tutar</th>
            </tr>
          </thead>
          <tbody>
            {kalemler.map((kalem, idx) => (
              <tr key={idx} className="border-b border-gray-100">
                <td className="py-3 pr-2 font-medium">{kalem.products.name}</td>
                <td className="py-3 text-center">{kalem.quantity} {kalem.products.unit}</td>
                <td className="py-3 text-right">₺{(kalem.quantity * kalem.price).toLocaleString('tr-TR')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="text-right text-xl font-black border-t-2 border-gray-800 pt-4 mt-2">
          TOPLAM: ₺{siparis.total_amount.toLocaleString('tr-TR')}
        </div>

        <div className="mt-10 text-center text-xs text-gray-400 pb-2 border-b border-dashed border-gray-400">
          Bizi tercih ettiğiniz için teşekkür ederiz.
        </div>
      </div>

      {/* YAZDIRILMAYACAK KONTROL BUTONLARI (print:hidden) */}
      <div className="w-full max-w-md mt-6 flex gap-3 print:hidden">
        <Link href="/" className="flex-1 bg-gray-200 text-gray-700 font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-300 transition">
          <ArrowLeft size={20} /> Ana Sayfa
        </Link>
        <button onClick={() => window.print()} className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-xl shadow-md flex items-center justify-center gap-2 hover:bg-blue-700 transition">
          <Printer size={20} /> Fişi Yazdır (PDF)
        </button>
      </div>

    </div>
  );
}