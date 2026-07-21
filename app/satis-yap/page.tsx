"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Plus, Trash2, ShoppingCart, CheckCircle2, Printer, Package, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function SatisYapPage() {
  const router = useRouter();
  const [urunler, setUrunler] = useState<any[]>([]);
  const [kisiler, setKisiler] = useState<any[]>([]);
  
  const [secilenKisi, setSecilenKisi] = useState('');
  const [sepet, setSepet] = useState<any[]>([]);
  
  // Seçilen ürün form state'leri
  const [urunId, setUrunId] = useState('');
  const [adet, setAdet] = useState('');
  const [fiyat, setFiyat] = useState('');
  
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [satisTamamlandi, setSatisTamamlandi] = useState(false);
  const [tamamlananKisiAdi, setTamamlananKisiAdi] = useState('');
  const [islemTarihi, setIslemTarihi] = useState('');

  useEffect(() => {
    veriGetir();
  }, []);

  const veriGetir = async () => {
    const { data: uData } = await supabase.from('products').select('*').order('name');
    if (uData) setUrunler(uData);

    const { data: kData } = await supabase.from('contacts').select('*').order('name');
    if (kData) setKisiler(kData);
  };

  const urunSecilince = (id: string) => {
    setUrunId(id);
    const secilen = urunler.find(u => u.id === id);
    if (secilen) {
      setFiyat(secilen.sell_price?.toString() || '0');
    }
  };

  const sepeteEkle = (e: any) => {
    e.preventDefault();
    if (!urunId || !adet || Number(adet) <= 0) return;

    const urunObj = urunler.find(u => u.id === urunId);
    if (!urunObj) return;

    const yeniKalem = {
      product_id: urunObj.id,
      name: urunObj.name,
      unit: urunObj.unit,
      quantity: Number(adet),
      price: Number(fiyat) || 0
    };

    setSepet([...sepet, yeniKalem]);
    setUrunId('');
    setAdet('');
    setFiyat('');
  };

  const sepettenCikar = (index: number) => {
    setSepet(sepet.filter((_, i) => i !== index));
  };

  const toplamTutar = sepet.reduce((acc, curr) => acc + (curr.quantity * curr.price), 0);

  const satisOnayla = async () => {
    if (!secilenKisi) {
      alert("Lütfen bir müşteri veya ardiye/firma seçin.");
      return;
    }
    if (sepet.length === 0) {
      alert("Sepete en az bir malzeme eklemelisiniz.");
      return;
    }

    setKaydediliyor(true);

    try {
      const kisiObj = kisiler.find(k => k.id === secilenKisi);
      const kAdi = kisiObj ? kisiObj.name : 'Alıcı';
      setTamamlananKisiAdi(kAdi);
      setIslemTarihi(new Date().toLocaleDateString('tr-TR'));

      // 1. Orders tablosuna ana kaydı at
      const { data: orderData, error: orderErr } = await supabase.from('orders').insert({
        contact_id: secilenKisi,
        customer_name: kAdi,
        total_amount: toplamTutar,
        type: 'satis'
      }).select().single();

      if (orderErr) throw orderErr;

      const orderId = orderData.id;

      // 2. Sepetteki her kalem için order_items ekle ve stok düş
      for (const item of sepet) {
        await supabase.from('order_items').insert({
          order_id: orderId,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price
        });

        const urunObj = urunler.find(u => u.id === item.product_id);
        if (urunObj) {
          const yeniStok = urunObj.stock_quantity - item.quantity;
          await supabase.from('products').update({ stock_quantity: yeniStok }).eq('id', urunObj.id);
        }
      }

      // 3. Seçilen kişinin bakiyesini güncelle
      if (kisiObj) {
        const yeniBakiye = (kisiObj.balance || 0) + toplamTutar;
        await supabase.from('contacts').update({ balance: yeniBakiye }).eq('id', kisiObj.id);
      }

      setSatisTamamlandi(true);
    } catch (error: any) {
      alert("İşlem hatası: " + error.message);
    } finally {
      setKaydediliyor(false);
    }
  };

  const pdfCikart = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-28 font-sans selection:bg-blue-100 flex flex-col items-center">
      
      {/* ÜST HEADER */}
      <header className="print:hidden w-full max-w-md bg-white/80 backdrop-blur-md px-6 py-4 border-b border-slate-200/60 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-10 h-10 bg-slate-50 border border-slate-200/60 rounded-2xl flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">Malzeme Çıkışı</h1>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">Satış ve Fiş Kesme</p>
          </div>
        </div>
      </header>

      <main className="w-full max-w-md p-5 space-y-5">
        
        {!satisTamamlandi ? (
          <>
            {/* KİŞİ / FİRMA SEÇİMİ */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200/80 space-y-3">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-400">1. Müşteri veya Ardiye / Firma Seçin</label>
              <select 
                value={secilenKisi} 
                onChange={(e) => setSecilenKisi(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-800 outline-none focus:border-blue-500 text-sm"
              >
                <option value="">-- Müşteri veya Ardiye Seçiniz --</option>
                {kisiler.map(k => (
                  <option key={k.id} value={k.id}>
                    {k.name} ({k.type === 'musteri' ? 'Müşteri' : k.type === 'firma' ? 'Ardiye/Firma' : 'Tedarikçi'})
                  </option>
                ))}
              </select>
            </div>

            {/* MALZEME EKLEME FORMU */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200/80 space-y-4">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-400">2. Malzeme ve Ölçü Ekle</label>
              
              <form onSubmit={sepeteEkle} className="space-y-3">
                <select 
                  value={urunId} 
                  onChange={(e) => urunSecilince(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold text-slate-800 outline-none text-sm"
                >
                  <option value="">-- Malzeme / Pencere Seçin --</option>
                  {urunler.map(u => (
                    <option key={u.id} value={u.id}>{u.name} (Stok: {u.stock_quantity} {u.unit})</option>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Miktar / Adet</label>
                    <input 
                      type="number" step="any" value={adet} onChange={(e) => setAdet(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-800 outline-none text-sm" placeholder="0" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Birim Fiyat (₺)</label>
                    <input 
                      type="number" step="0.01" value={fiyat} onChange={(e) => setFiyat(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-800 outline-none text-sm" placeholder="0.00" 
                    />
                  </div>
                </div>

                <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 flex items-center justify-center gap-2 text-sm shadow-md active:scale-95 transition-all">
                  <Plus size={18} /> Sepete Ekle
                </button>
              </form>
            </div>

            {/* SEPET LİSTESİ */}
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200/80 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">Çıkış Yapılacak Liste</span>
                <span className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">{sepet.length} Kalem</span>
              </div>

              <div className="space-y-2.5 max-h-60 overflow-y-auto">
                {sepet.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <p className="font-black text-slate-800 text-sm">{item.name}</p>
                      <p className="text-xs font-medium text-slate-400">{item.quantity} {item.unit} x ₺{item.price}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-slate-700 text-sm">₺{(item.quantity * item.price).toLocaleString('tr-TR')}</span>
                      <button onClick={() => sepettenCikar(idx)} className="text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {sepet.length === 0 && (
                  <p className="text-center text-slate-400 text-sm py-4">Sepetiniz henüz boş.</p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-500 text-sm">Toplam Tutar:</span>
                <span className="font-black text-xl text-blue-600">₺{toplamTutar.toLocaleString('tr-TR')}</span>
              </div>

              <button 
                onClick={satisOnayla} 
                disabled={kaydediliyor || sepet.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <CheckCircle2 size={20} /> {kaydediliyor ? 'İşleniyor...' : 'Satışı / Çıkışı Tamamla'}
              </button>
            </div>
          </>
        ) : (
          /* BAŞARILI VE PDF EKRANI */
          <div className="space-y-6">
            <div className="print:hidden bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Çıkış Başarıyla Kaydedildi!</h3>
                <p className="text-xs text-slate-400 mt-1">Stoklar güncellendi ve cari hesaba işlendi.</p>
              </div>

              <button 
                onClick={pdfCikart}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Printer size={20} /> PDF Çıkart / Fişi Yazdır
              </button>

              <Link href="/" className="block w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-2xl text-sm transition-all">
                Ana Sayfaya Dön
              </Link>
            </div>

            {/* YAZDIRILACAK / PDF OLACAK KURUMSAL FİŞ BELGESİ */}
            <div className="hidden print:block bg-white p-8 font-sans text-slate-900 space-y-6">
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
                <div>
                  <h1 className="text-2xl font-black tracking-tight">OĞUZ STOK</h1>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">Şantiye & Malzeme Sevk Fişi</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-500">Tarih: <span className="text-slate-900">{islemTarihi}</span></p>
                  <p className="text-xs font-bold text-slate-500 mt-1">Belge Türü: <span className="text-slate-900">Malzeme Çıkış Fişi</span></p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alıcı / Firma</p>
                <h2 className="text-lg font-black text-slate-900 mt-0.5">{tamamlananKisiAdi}</h2>
              </div>

              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 text-xs font-black uppercase text-slate-500">
                    <th className="py-2.5">Malzeme / Ölçü Açıklaması</th>
                    <th className="py-2.5 text-center">Miktar</th>
                    <th className="py-2.5 text-right">Birim Fiyat</th>
                    <th className="py-2.5 text-right">Toplam</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm font-medium">
                  {sepet.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-3 font-bold text-slate-800">{item.name}</td>
                      <td className="py-3 text-center font-bold">{item.quantity} {item.unit}</td>
                      <td className="py-3 text-right">₺{item.price.toLocaleString('tr-TR')}</td>
                      <td className="py-3 text-right font-black">₺{(item.quantity * item.price).toLocaleString('tr-TR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pt-4 border-t-2 border-slate-900 flex justify-between items-center">
                <span className="text-base font-black uppercase tracking-wider">Genel Toplam Tutar:</span>
                <span className="text-2xl font-black text-slate-900">₺{toplamTutar.toLocaleString('tr-TR')}</span>
              </div>

              <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs font-bold text-slate-500">
                <div>
                  <p className="border-t border-slate-400 pt-2">Teslim Eden (Oğuz Stok)</p>
                </div>
                <div>
                  <p className="border-t border-slate-400 pt-2">Teslim Alan (İmza)</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}