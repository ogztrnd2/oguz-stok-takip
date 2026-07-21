"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Printer, ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';

export default function HesapDokumuPage() {
  const params = useParams();
  const router = useRouter();
  const [musteri, setMusteri] = useState<any>(null);
  const [islemler, setIslemler] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ÖNEMLİ: Next.js'in eski önbelleği (cache) göstermesini engelleyip güncel veriyi zorla çekiyoruz.
    router.refresh();

    const veriGetir = async () => {
      if (!params.id) return;

      // 1. Müşterinin en güncel bakiyesini al
      const { data: musteriData } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', params.id)
        .single();
        
      if (musteriData) setMusteri(musteriData);

      // 2. SADECE ID ile eşleşen güncel işlemleri getir (İsimden gelen hayalet kayıtlar iptal edildi)
      if (musteriData) {
        const { data: siparisler } = await supabase
          .from('orders')
          .select('id, created_at, total_amount, type, customer_name')
          .eq('contact_id', musteriData.id) // HAYALET KAYIT ÇÖZÜMÜ BURADA
          .order('created_at', { ascending: false });
          
        if (siparisler) setIslemler(siparisler);
      }

      setLoading(false);
    };
    
    veriGetir();
  }, [params.id, router]);

  if (loading) return <div className="p-10 text-center font-bold text-slate-500">Hesap Dökümü Hazırlanıyor...</div>;
  if (!musteri) return <div className="p-10 text-center font-bold text-slate-500">Müşteri bulunamadı.</div>;

  return (
    <div className="min-h-screen bg-slate-100 p-5 font-sans flex flex-col items-center selection:bg-blue-100">
      
      {/* YAZDIRILACAK PDF ALANI */}
      <div id="ekstre-alani" className="bg-white w-full max-w-2xl p-10 shadow-xl border border-slate-200">
        
        {/* BAŞLIK */}
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">OĞUZ STOK</h1>
            <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-widest">Cari Hesap Ekstresi</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tarih</p>
            <p className="font-bold text-slate-800">{new Date().toLocaleDateString('tr-TR')}</p>
          </div>
        </div>

        {/* MÜŞTERİ BİLGİLERİ */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-8">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Sayın</p>
          <h2 className="text-xl font-black text-slate-800">{musteri.name}</h2>
          {musteri.phone && <p className="text-sm font-medium text-slate-600 mt-1">Tel: {musteri.phone}</p>}
        </div>
        
        {/* İŞLEM TABLOSU */}
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-3">Hesap Hareketleri</h3>
        <table className="w-full text-sm text-left mb-8 border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-200 text-slate-600">
              <th className="py-3 font-bold uppercase tracking-wider text-xs">Tarih</th>
              <th className="py-3 font-bold uppercase tracking-wider text-xs">İşlem Açıklaması</th>
              <th className="py-3 font-bold uppercase tracking-wider text-xs text-right">Tutar</th>
            </tr>
          </thead>
          <tbody>
            {islemler.length > 0 ? (
              islemler.map((islem) => {
                let islemAdi = "Malzeme Çıkışı";
                let tutarRenk = "text-red-500";
                let tutarIsaret = "-";
                
                if (islem.type === 'tahsilat') {
                  islemAdi = islem.customer_name || 'Tahsilat (Ödeme Alındı)';
                  tutarRenk = "text-emerald-600";
                  tutarIsaret = "+";
                } else if (islem.type === 'borc') {
                  islemAdi = islem.customer_name || 'Ekstra Borçlandırıldı';
                  tutarRenk = "text-red-500";
                  tutarIsaret = "-";
                } else {
                  islemAdi = `Malzeme Çıkışı (Fiş No: ${islem.id.substring(0, 6).toUpperCase()})`;
                }

                return (
                  <tr key={islem.id} className="border-b border-slate-100">
                    <td className="py-4 font-medium text-slate-600 w-1/4">
                      {new Date(islem.created_at).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="py-4 text-slate-800 font-medium">
                      {islemAdi}
                    </td>
                    <td className={`py-4 text-right font-bold ${tutarRenk}`}>
                      {tutarIsaret} ₺{islem.total_amount?.toLocaleString('tr-TR')}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={3} className="py-6 text-center text-slate-400 font-medium bg-slate-50 rounded-xl">
                  Bu müşterinin kayıtlı hiçbir işlem geçmişi bulunmuyor.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* GENEL TOPLAM */}
        <div className="flex justify-end">
          <div className="w-1/2 bg-slate-800 text-white p-5 rounded-2xl flex justify-between items-center">
            <span className="text-sm font-bold uppercase tracking-wider text-slate-300">Kalan Bakiye</span>
            <span className="text-2xl font-black">₺{(musteri.balance || 0).toLocaleString('tr-TR')}</span>
          </div>
        </div>

        <div className="mt-12 text-center text-xs font-medium text-slate-400 pt-4 border-t border-slate-200">
          Bu belge Oğuz Stok Şantiye Yönetim Sistemi tarafından otomatik oluşturulmuştur.
        </div>
      </div>

      {/* YAZDIRILMAYACAK KONTROL BUTONLARI (print:hidden) */}
      <div className="w-full max-w-2xl mt-6 flex gap-3 print:hidden">
        <button onClick={() => window.history.back()} className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-50 transition shadow-sm">
          <ArrowLeft size={20} /> Geri Dön
        </button>
        <button onClick={() => window.print()} className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 hover:bg-blue-700 transition">
          <Printer size={20} /> Ekstreyi Yazdır (PDF)
        </button>
      </div>

    </div>
  );
}