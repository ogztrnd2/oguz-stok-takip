"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShoppingCart, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function SatisYap() {
  const [urunler, setUrunler] = useState<any[]>([]);
  const [sepet, setSepet] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mesaj, setMesaj] = useState('');
  const [musteriAdi, setMusteriAdi] = useState('');

  const [seciliUrunId, setSeciliUrunId] = useState('');
  const [miktar, setMiktar] = useState('');
  const [fiyat, setFiyat] = useState('');

  useEffect(() => {
    const urunleriGetir = async () => {
      const { data } = await supabase.from('products').select('*').order('name');
      if (data) {
        setUrunler(data);
        if (data.length > 0) {
          setSeciliUrunId(data[0].id);
          setFiyat(data[0].sell_price.toString());
        }
      }
    };
    urunleriGetir();
  }, []);

  const urunDegisti = (id: string) => {
    setSeciliUrunId(id);
    const urun = urunler.find(u => u.id === id);
    if (urun) setFiyat(urun.sell_price.toString());
  };

  const sepeteEkle = (e: any) => {
    e.preventDefault();
    if (!seciliUrunId || !miktar || Number(miktar) <= 0 || !fiyat || Number(fiyat) < 0) return;
    const urun = urunler.find(u => u.id === seciliUrunId);
    if (!urun) return;

    if (urun.stock_quantity < Number(miktar)) {
      setMesaj(`Hata: Stokta sadece ${urun.stock_quantity} ${urun.unit} var.`);
      return;
    }

    const yeniSepetItem = { ...urun, miktar: Number(miktar), sell_price: Number(fiyat) };
    const mevcutUrunIdx = sepet.findIndex(item => item.id === urun.id && item.sell_price === Number(fiyat));
    
    if (mevcutUrunIdx > -1) {
      const guncelSepet = [...sepet];
      guncelSepet[mevcutUrunIdx].miktar += Number(miktar);
      setSepet(guncelSepet);
    } else {
      setSepet([...sepet, yeniSepetItem]);
    }
    
    setMiktar('');
    setMesaj('');
  };

  const sepettenCikar = (id: string, urunFiyati: number) => {
    setSepet(sepet.filter(item => !(item.id === id && item.sell_price === urunFiyati)));
  };

  const genelToplam = sepet.reduce((toplam, item) => toplam + (item.miktar * item.sell_price), 0);

  const satisiTamamla = async () => {
    if (sepet.length === 0) return;
    setLoading(true);
    setMesaj('');

    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{ 
          customer_name: musteriAdi || 'Perakende Müşteri', 
          total_amount: genelToplam,
          type: 'satis' 
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      for (const item of sepet) {
        await supabase.from('order_items').insert([{
          order_id: orderData.id,
          product_id: item.id,
          quantity: item.miktar,
          price: item.sell_price
        }]);
        const yeniStok = item.stock_quantity - item.miktar;
        await supabase.from('products').update({ stock_quantity: yeniStok }).eq('id', item.id);
      }

      setMesaj('basarili');
      setSepet([]);
      setMusteriAdi('');
      setLoading(false);
      setTimeout(() => setMesaj(''), 3000);
    } catch (error: any) {
      setMesaj('Kayıt sırasında hata: ' + error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans selection:bg-blue-100">
      
      {/* CAM EFEKTLİ ÜST MENÜ */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg px-6 py-5 border-b border-slate-200/60 flex items-center gap-4">
        <Link href="/" className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-black text-slate-900">Satış Yap</h1>
          <p className="text-[11px] font-medium text-slate-500">Mal Çıkışı ve Sipariş</p>
        </div>
      </header>

      <main className="p-6 space-y-6">
        
        {mesaj === 'basarili' && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-2xl flex items-center gap-3 font-bold shadow-sm shadow-emerald-500/10">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center"><CheckCircle2 size={20} /></div>
            Satış başarıyla kaydedildi!
          </div>
        )}

        {mesaj !== '' && mesaj !== 'basarili' && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium border border-red-100">
            {mesaj}
          </div>
        )}

        {/* BİLGİ VE ÜRÜN EKLEME FORMU */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-5">
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Müşteri / Açıklama</label>
            <input type="text" value={musteriAdi} onChange={(e) => setMusteriAdi(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400" 
              placeholder="Örn: Ahmet Usta veya Proje Adı" />
          </div>

          <div className="h-px w-full bg-slate-100 my-4"></div>

          <form onSubmit={sepeteEkle} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Malzeme Seçimi</label>
              <select value={seciliUrunId} onChange={(e) => urunDegisti(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all appearance-none">
                {urunler.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} (Stok: {u.stock_quantity} {u.unit})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Miktar</label>
                <input required type="number" value={miktar} onChange={(e) => setMiktar(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" placeholder="0" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Birim Fiyat (₺)</label>
                <input required type="number" step="0.01" value={fiyat} onChange={(e) => setFiyat(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" placeholder="0.00" />
              </div>
            </div>

            <button type="submit" className="w-full mt-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
              <Plus size={18} /> Listeye Ekle
            </button>
          </form>
        </div>

        {/* SEPET (SİPARİŞ LİSTESİ) */}
        {sepet.length > 0 && (
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-1 rounded-3xl shadow-xl shadow-slate-900/10">
            <div className="bg-white p-6 rounded-[22px]">
              <h2 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                <ShoppingCart size={18} className="text-indigo-500" /> Çıkış Yapılacaklar
              </h2>
              
              <div className="space-y-4">
                {sepet.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center group">
                    <div>
                      <p className="font-bold text-slate-800">{item.name}</p>
                      <p className="text-xs font-medium text-slate-500">{item.miktar} {item.unit} x ₺{item.sell_price.toLocaleString('tr-TR')}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-black text-slate-800">₺{(item.miktar * item.sell_price).toLocaleString('tr-TR')}</span>
                      <button onClick={() => sepettenCikar(item.id, item.sell_price)} className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between items-end">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Genel Toplam</span>
                <span className="text-3xl font-black text-indigo-600 leading-none">₺{genelToplam.toLocaleString('tr-TR')}</span>
              </div>

              <button onClick={satisiTamamla} disabled={loading} 
                className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50">
                <CheckCircle2 size={20} />
                {loading ? 'İşleniyor...' : 'Satışı Tamamla & Kaydet'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}