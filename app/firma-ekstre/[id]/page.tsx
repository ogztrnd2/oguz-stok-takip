"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Printer, ArrowLeft } from 'lucide-react';

export default function FirmaEkstrePage() {
  const params = useParams();
  const router = useRouter();
  const [firma, setFirma] = useState<any>(null);
  const [islemler, setIslemler] = useState<any[]>([]);

  useEffect(() => {
    router.refresh();
    const veriGetir = async () => {
      if (!params.id) return;

      const { data: fData } = await supabase.from('contacts').select('*').eq('id', params.id).single();
      if (fData) setFirma(fData);

      if (fData) {
        // Tüm hareketleri tek tablodan alıyoruz
        const { data: oData } = await supabase.from('orders')
          .select('id, created_at, total_amount, type, customer_name')
          .eq('contact_id', fData.id)
          .order('created_at', { ascending: false });

        if (oData) setIslemler(oData);
      }
    };
    veriGetir();
  }, [params.id, router]);

  if (!firma) return <div className="p-10 text-center font-bold text-slate-500">Hazırlanıyor...</div>;

  return (
    <div className="min-h-screen bg-slate-100 p-5 font-sans flex flex-col items-center">
      
      <div className="bg-white w-full max-w-2xl p-10 shadow-xl border border-slate-200 print:shadow-none print:border-none">
        
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">OĞUZHAN TİCARET</h1>
            <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-widest">Ekstre</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tarih</p>
            <p className="font-bold text-slate-800">{new Date().toLocaleDateString('tr-TR')}</p>
          </div>
        </div>

        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-8">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Firma / Tedarikçi</p>
          <h2 className="text-xl font-black text-slate-800">{firma.name}</h2>
          {firma.phone && <p className="text-sm font-medium text-slate-600 mt-1">Tel: {firma.phone}</p>}
        </div>
        
        <table className="w-full text-sm text-left mb-8 border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-200 text-slate-600">
              <th className="py-3 font-bold uppercase tracking-wider text-xs w-1/4">Tarih</th>
              <th className="py-3 font-bold uppercase tracking-wider text-xs">Açıklama (İşlem Yönü)</th>
              <th className="py-3 font-bold uppercase tracking-wider text-xs text-right">Tutar</th>
            </tr>
          </thead>
          <tbody>
            {islemler.length > 0 ? (
              islemler.map((islem) => {
                let yazi = ""; let isaret = ""; let renk = "text-slate-800";
                
                if (islem.type === 'satis') { yazi = "Bizden Malzeme Çıkışı (Alacak Yazıldı)"; isaret = "+"; renk = "text-indigo-600"; }
                if (islem.type === 'alis') { yazi = "Firmadan Malzeme Girişi (Borç Yazıldı)"; isaret = "-"; renk = "text-orange-600"; }
                if (islem.type === 'tahsilat') { yazi = islem.customer_name || "Firmadan Nakit Alındı"; isaret = "-"; renk = "text-emerald-600"; }
                if (islem.type === 'odeme_cikisi') { yazi = islem.customer_name || "Firmaya Ödeme Yapıldı"; isaret = "+"; renk = "text-slate-600"; }
                if (islem.type === 'borc') { yazi = islem.customer_name || "Manuel Borçlandırıldı"; isaret = "+"; renk = "text-red-500"; }

                return (
                  <tr key={islem.id} className="border-b border-slate-100">
                    <td className="py-4 font-medium text-slate-600">{new Date(islem.created_at).toLocaleDateString('tr-TR')}</td>
                    <td className="py-4 text-slate-800 font-bold">{yazi}</td>
                    <td className={`py-4 text-right font-black ${renk}`}>
                      {isaret} ₺{islem.total_amount?.toLocaleString('tr-TR')}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan={3} className="py-6 text-center text-slate-400 font-medium">İşlem geçmişi yok.</td></tr>
            )}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className={`w-1/2 p-5 rounded-2xl flex justify-between items-center ${firma.balance >= 0 ? 'bg-indigo-600 text-white' : 'bg-red-600 text-white'}`}>
            <span className="text-xs font-bold uppercase tracking-wider text-white/80">
              {firma.balance >= 0 ? 'Bizim Alacağımız' : 'Firmaya Borcumuz'}
            </span>
            <span className="text-2xl font-black">₺{Math.abs(firma.balance || 0).toLocaleString('tr-TR')}</span>
          </div>
        </div>

      </div>

      <div className="w-full max-w-2xl mt-6 flex gap-3 print:hidden">
        <button onClick={() => window.history.back()} className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-50">
          <ArrowLeft size={20} /> Geri Dön
        </button>
        <button onClick={() => window.print()} className="flex-1 bg-slate-800 text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 hover:bg-slate-700">
          <Printer size={20} /> Ekstreyi Yazdır
        </button>
      </div>

    </div>
  );
}