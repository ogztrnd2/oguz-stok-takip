"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowDownToLine, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function AlisGir() {
  const [urunler, setUrunler] = useState<any[]>([]);
  const [tedarikciler, setTedarikciler] = useState<any[]>([]);
  const [liste, setListe] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mesaj, setMesaj] = useState('');
  
  const [seciliTedarikciId, setSeciliTedarikciId] = useState('');
  const [seciliUrunId, setSeciliUrunId] = useState('');
  const [miktar, setMiktar] = useState('');
  const [fiyat, setFiyat] = useState('');

  useEffect(() => {
    const verileriGetir = async () => {
      const { data: uData } = await supabase.from('products').select('*').order('name');
      if (uData) {
        setUrunler(uData);
        if (uData.length > 0) setSeciliUrunId(uData[0].id);
      }

      const { data: tData } = await supabase.from('contacts').select('*').in('type', ['tedarikci', 'firma']).order('name');
      if (tData) {
        setTedarikciler(tData);
        if (tData.length > 0) setSeciliTedarikciId(tData[0].id);
      }
    };
    verileriGetir();
  }, []);

  const listeyeEkle = (e: any) => {
    e.preventDefault();
    if (!seciliUrunId || !miktar || Number(miktar) <= 0 || !fiyat || Number(fiyat) < 0) return;
    const urun = urunler.find(u => u.id === seciliUrunId);
    if (!urun) return;

    const yeniItem = { ...urun, miktar: Number(miktar), alis_fiyati: Number(fiyat) };
    const mevcutIdx = liste.findIndex(item => item.id === urun.id && item.alis_fiyati === Number(fiyat));
    
    if (mevcutIdx > -1) {
      const guncelListe = [...liste];
      guncelListe[mevcutIdx].miktar += Number(miktar);
      setListe(guncelListe);
    } else {
      setListe([...liste, yeniItem]);
    }
    
    setMiktar(''); setFiyat(''); setMesaj('');
  };

  const listedenCikar = (id: string, alisFiyati: number) => {
    setListe(liste.filter(item => !(item.id === id && item.alis_fiyati === alisFiyati)));
  };

  const genelToplam = liste.reduce((toplam, item) => toplam + (item.miktar * item.alis_fiyati), 0);

  const alisiTamamla = async () => {
    if (liste.length === 0 || !seciliTedarikciId) {
      setMesaj('Lütfen bir firma seçin ve listeye malzeme ekleyin.');
      return;
    }
    
    setLoading(true);
    setMesaj('');

    try {
      const tedarikci = tedarikciler.find(t => t.id === seciliTedarikciId);

      // 1. İşlemi ANA FİŞ (orders) tablosuna 'alis' olarak kaydet
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{ 
          contact_id: seciliTedarikciId,
          customer_name: tedarikci?.name || 'Firma/Tedarikçi', 
          total_amount: genelToplam,
          type: 'alis' 
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Fiş Kalemlerini (order_items) Ekle ve Stokları Artır
      for (const item of liste) {
        await supabase.from('order_items').insert([{
          order_id: orderData.id,
          product_id: item.id,
          quantity: item.miktar,
          price: item.alis_fiyati
        }]);
        
        const yeniStok = item.stock_quantity + item.miktar;
        await supabase.from('products').update({ stock_quantity: yeniStok }).eq('id', item.id);
      }

      // 3. Firmanın Bakiyesini DÜŞ (Borçlandığımız için)
      if (tedarikci) {
        const yeniBakiye = Number(tedarikci.balance || 0) - genelToplam;
        await supabase.from('contacts').update({ balance: yeniBakiye }).eq('id', tedarikci.id);
      }

      setMesaj('basarili');
      setListe([]);
      
      const { data: uData } = await supabase.from('products').select('*').order('name');
      if (uData) setUrunler(uData);

      setLoading(false);
      setTimeout(() => setMesaj(''), 3000);
    } catch (error: any) {
      setMesaj('Kayıt sırasında hata: ' + error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans selection:bg-orange-100">
      
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg px-6 py-5 border-b border-slate-200/60 flex items-center gap-4">
        <Link href="/" className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-black text-slate-900">Malzeme Girişi (Alış)</h1>
        </div>
      </header>

      <main className="p-6 space-y-6">
        
        {mesaj === 'basarili' && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-2xl flex items-center gap-3 font-bold shadow-sm">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0"><CheckCircle2 size={20} /></div>
            Malzemeler depoya eklendi, stok arttı ve fiş oluşturuldu!
          </div>
        )}

        {mesaj !== '' && mesaj !== 'basarili' && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium border border-red-100">
            {mesaj}
          </div>
        )}

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Kimden Alındı? (Firma / Tedarikçi)</label>
            <select value={seciliTedarikciId} onChange={(e) => setSeciliTedarikciId(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-800 font-bold focus:border-orange-500 outline-none appearance-none">
              {tedarikciler.length === 0 ? <option value="">Önce firma ekleyin...</option> : null}
              {tedarikciler.map((t) => (
                <option key={t.id} value={t.id}>{t.name} {t.type === 'firma' ? '(Firma)' : '(Tedarikçi)'}</option>
              ))}
            </select>
          </div>

          <div className="h-px w-full bg-slate-100 my-4"></div>

          <form onSubmit={listeyeEkle} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Gelen Malzeme</label>
              <select value={seciliUrunId} onChange={(e) => setSeciliUrunId(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-800 focus:border-orange-500 outline-none appearance-none">
                {urunler.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} (Mevcut: {u.stock_quantity} {u.unit})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Miktar</label>
                <input required type="number" value={miktar} onChange={(e) => setMiktar(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 focus:border-orange-500 outline-none" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Birim Fiyat (₺)</label>
                <input required type="number" step="0.01" value={fiyat} onChange={(e) => setFiyat(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold focus:border-orange-500 outline-none" placeholder="0.00" />
              </div>
            </div>

            <button type="submit" className="w-full mt-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
              <Plus size={18} /> Listeye Ekle
            </button>
          </form>
        </div>

        {liste.length > 0 && (
          <div className="bg-gradient-to-br from-orange-500 to-red-500 p-1 rounded-3xl shadow-xl shadow-orange-500/10">
            <div className="bg-white p-6 rounded-[22px]">
              <h2 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                <ArrowDownToLine size={18} className="text-orange-500" /> Depoya Girecekler
              </h2>
              
              <div className="space-y-4">
                {liste.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center group">
                    <div>
                      <p className="font-bold text-slate-800">{item.name}</p>
                      <p className="text-xs font-medium text-slate-500">{item.miktar} {item.unit} x ₺{item.alis_fiyati}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-black text-slate-800">₺{(item.miktar * item.alis_fiyati).toLocaleString('tr-TR')}</span>
                      <button onClick={() => listedenCikar(item.id, item.alis_fiyati)} className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between items-end">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bizim Borçlanacağımız Tutar</span>
                <span className="text-3xl font-black text-orange-600 leading-none">₺{genelToplam.toLocaleString('tr-TR')}</span>
              </div>

              <button onClick={alisiTamamla} disabled={loading} 
                className="w-full mt-6 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50">
                <CheckCircle2 size={20} />
                {loading ? 'İşleniyor...' : 'Girişi Onayla ve Stoğa Ekle'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}