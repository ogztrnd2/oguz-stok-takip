"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowDownToLine, Plus, Trash2, CheckCircle2, Calendar } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function AlisGir() {
  const [urunler, setUrunler] = useState<any[]>([]);
  const [tedarikciler, setTedarikciler] = useState<any[]>([]);
  const [liste, setListe] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mesaj, setMesaj] = useState('');
  
  // Varsayılan olarak bugünün tarihini "YYYY-MM-DD" formatında alıyoruz
  const [islemTarihi, setIslemTarihi] = useState(new Date().toISOString().split('T')[0]);
  
  const [seciliTedarikciId, setSeciliTedarikciId] = useState('');
  const [seciliUrunId, setSeciliUrunId] = useState('');
  const [miktar, setMiktar] = useState('');
  const [fiyat, setFiyat] = useState('');

  useEffect(() => {
    const verileriGetir = async () => {
      const { data: uData } = await supabase.from('products').select('*').order('name');
      if (uData) setUrunler(uData);

      const { data: tData } = await supabase.from('contacts').select('*').in('type', ['tedarikci', 'firma']).order('name');
      if (tData) setTedarikciler(tData);
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

      // Veritabanı saat dilimi sorunları olmaması için saati öğlen 12 olarak ayarlıyoruz.
      const bugunStr = new Date().toISOString().split('T')[0];
      let veritabaniTarihi = new Date().toISOString();
      if (islemTarihi !== bugunStr) {
        veritabaniTarihi = new Date(`${islemTarihi}T12:00:00`).toISOString();
      }

      // 1. İşlemi ANA FİŞ (orders) tablosuna 'alis' olarak kaydet
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{ 
          contact_id: seciliTedarikciId,
          customer_name: tedarikci?.name || 'Firma/Tedarikçi', 
          total_amount: genelToplam,
          type: 'alis',
          created_at: veritabaniTarihi // Seçilen tarihi gönderiyoruz
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
    <div className="min-h-screen bg-slate-100 pb-28 font-sans selection:bg-orange-100 flex flex-col items-center">
      
      {/* ÜST HEADER */}
      <header className="w-full max-w-md bg-white/80 backdrop-blur-md px-6 py-4 border-b border-slate-200/60 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-10 h-10 bg-slate-50 border border-slate-200/60 rounded-2xl flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">Malzeme Girişi</h1>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">Alış ve Stok Ekleme</p>
          </div>
        </div>
      </header>

      <main className="w-full max-w-md p-5 space-y-5">
        
        {mesaj === 'basarili' && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-3xl flex items-center gap-3 font-bold shadow-sm">
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center shrink-0"><CheckCircle2 size={24} /></div>
            <p className="text-sm">Malzemeler depoya eklendi, stok arttı ve fiş oluşturuldu!</p>
          </div>
        )}

        {mesaj !== '' && mesaj !== 'basarili' && (
          <div className="bg-red-50 text-red-600 p-4 rounded-3xl text-sm font-medium border border-red-100">
            {mesaj}
          </div>
        )}

        {/* TARİH VE KİŞİ / FİRMA SEÇİMİ */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200/80 space-y-4">
          
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Calendar size={14} /> 1. İşlem Tarihi
            </label>
            <input 
              type="date" 
              value={islemTarihi} 
              onChange={(e) => setIslemTarihi(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-800 outline-none focus:border-orange-500 text-sm appearance-none"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">2. Kimden Alındı? (Firma/Tedarikçi)</label>
            <select value={seciliTedarikciId} onChange={(e) => setSeciliTedarikciId(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-slate-800 outline-none focus:border-orange-500 text-sm">
              <option value="">-- Seçiniz --</option>
              {tedarikciler.map((t) => (
                <option key={t.id} value={t.id}>{t.name} {t.type === 'firma' ? '(Firma)' : '(Tedarikçi)'}</option>
              ))}
            </select>
          </div>

        </div>

        {/* MALZEME EKLEME FORMU */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200/80 space-y-4">
          <label className="block text-xs font-black uppercase tracking-wider text-slate-400">3. Gelen Malzeme ve Ölçü Ekle</label>
          
          <form onSubmit={listeyeEkle} className="space-y-3">
            <select value={seciliUrunId} onChange={(e) => setSeciliUrunId(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold text-slate-800 outline-none focus:border-orange-500 text-sm">
              <option value="">-- Malzeme Seçin --</option>
              {urunler.map((u) => (
                <option key={u.id} value={u.id}>{u.name} (Stok: {u.stock_quantity} {u.unit})</option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Miktar / Adet</label>
                <input required type="number" step="any" value={miktar} onChange={(e) => setMiktar(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-800 outline-none text-sm focus:border-orange-500" placeholder="0" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Birim Fiyat (₺)</label>
                <input required type="number" step="0.01" value={fiyat} onChange={(e) => setFiyat(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-800 outline-none text-sm focus:border-orange-500" placeholder="0.00" />
              </div>
            </div>

            <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 flex items-center justify-center gap-2 text-sm shadow-md active:scale-95 transition-all">
              <Plus size={18} /> Listeye Ekle
            </button>
          </form>
        </div>

        {/* LİSTE */}
        {liste.length > 0 && (
          <div className="bg-gradient-to-br from-orange-500 to-red-500 p-1 rounded-3xl shadow-xl shadow-orange-500/10">
            <div className="bg-white p-5 rounded-[22px]">
              
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <ArrowDownToLine size={16} className="text-orange-500" /> Depoya Girecekler
                </span>
                <span className="text-xs font-black text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg">{liste.length} Kalem</span>
              </div>
              
              <div className="space-y-2.5 max-h-60 overflow-y-auto">
                {liste.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <p className="font-black text-slate-800 text-sm">{item.name}</p>
                      <p className="text-xs font-medium text-slate-400">{item.miktar} {item.unit} x ₺{item.alis_fiyati}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-slate-700 text-sm">₺{(item.miktar * item.alis_fiyati).toLocaleString('tr-TR')}</span>
                      <button onClick={() => listedenCikar(item.id, item.alis_fiyati)} className="text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="pt-4 mt-2 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Toplam Tutar:</span>
                <span className="font-black text-xl text-orange-600">₺{genelToplam.toLocaleString('tr-TR')}</span>
              </div>

              <button onClick={alisiTamamla} disabled={loading} 
                className="w-full mt-6 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50">
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