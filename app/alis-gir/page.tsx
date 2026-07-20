"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowDownToLine, CheckCircle2, Calculator } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function AlisGir() {
  const [urunler, setUrunler] = useState<any[]>([]);
  const [tedarikciler, setTedarikciler] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mesaj, setMesaj] = useState('');

  const [form, setForm] = useState({
    product_id: '',
    contact_id: '',
    quantity: '',
    unit_price: '',
    total_price: ''
  });

  useEffect(() => {
    const verileriGetir = async () => {
      // Ürünleri Çek
      const { data: pData } = await supabase.from('products').select('*').order('name');
      if (pData) {
        setUrunler(pData);
        if (pData.length > 0) {
          setForm(prev => ({ 
            ...prev, 
            product_id: pData[0].id,
            unit_price: pData[0].buy_price.toString() // İlk ürünün alış fiyatını otomatik getir
          }));
        }
      }

      // Tedarikçileri Çek
      const { data: tData } = await supabase.from('contacts').select('id, name').eq('type', 'tedarikci').order('name');
      if (tData) {
        setTedarikciler(tData);
      }
    };
    verileriGetir();
  }, []);

  // Ürün değiştiğinde birim fiyatını otomatik güncelle
  const urunDegisti = (e: any) => {
    const pId = e.target.value;
    const urun = urunler.find(u => u.id === pId);
    
    let yeniBirimFiyat = '';
    if (urun) yeniBirimFiyat = urun.buy_price.toString();

    // Mevcut miktar varsa toplam tutarı yeniden hesapla
    let yeniToplam = form.total_price;
    if (form.quantity && yeniBirimFiyat) {
      yeniToplam = (Number(form.quantity) * Number(yeniBirimFiyat)).toString();
    }

    setForm({ 
      ...form, 
      product_id: pId, 
      unit_price: yeniBirimFiyat, 
      total_price: yeniToplam 
    });
  };

  // Miktar veya Birim Fiyat değiştiğinde Toplam Tutarı otomatik hesapla
  const handleMiktarBirim = (e: any) => {
    const { name, value } = e.target;
    
    const miktar = name === 'quantity' ? value : form.quantity;
    const birim = name === 'unit_price' ? value : form.unit_price;

    let toplam = form.total_price;
    if (miktar && birim) {
      toplam = (Number(miktar) * Number(birim)).toString();
    } else {
      toplam = '';
    }

    setForm({ ...form, [name]: value, total_price: toplam });
  };

  // Sadece Toplam Tutar veya Tedarikçi değiştiğinde
  const handleGenel = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const alisKaydet = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setMesaj('');

    if (!form.product_id) {
      setMesaj('Lütfen önce sisteme bir ürün kaydedin.');
      setLoading(false);
      return;
    }

    try {
      // 1. İşlemi Kaydet
      const { error: txError } = await supabase.from('transactions').insert([
        {
          product_id: form.product_id,
          contact_id: form.contact_id || null,
          type: 'alis',
          quantity: Number(form.quantity),
          total_price: Number(form.total_price) || 0
        }
      ]);

      if (txError) throw txError;

      // 2. Stoğu Güncelle
      const urun = urunler.find(u => u.id === form.product_id);
      if (urun) {
        const yeniStok = Number(urun.stock_quantity) + Number(form.quantity);
        await supabase.from('products').update({ stock_quantity: yeniStok }).eq('id', form.product_id);
      }

      setMesaj('basarili');
      // Başarılı olunca sadece miktarı ve tutarı temizle, ürün ve fiyat sabit kalsın (hızlı giriş için)
      setForm(prev => ({ ...prev, quantity: '', total_price: '' }));
      
      setTimeout(() => setMesaj(''), 3000);

    } catch (error: any) {
      setMesaj('Kayıt sırasında hata oluştu: ' + error.message);
    } finally {
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
          <h1 className="text-xl font-black text-slate-900">Mal Girişi</h1>
          <p className="text-[11px] font-medium text-slate-500">Tedarikçiden Stoğa Ekleme</p>
        </div>
      </header>

      <main className="p-6 space-y-6">
        
        {mesaj === 'basarili' && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-2xl flex items-center gap-3 font-bold shadow-sm shadow-emerald-500/10">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
              <CheckCircle2 size={20} />
            </div>
            Mal girişi başarıyla kaydedildi ve stok güncellendi!
          </div>
        )}

        {mesaj !== '' && mesaj !== 'basarili' && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium border border-red-100">
            {mesaj}
          </div>
        )}

        {/* FORMU İÇEREN KART */}
        <form onSubmit={alisKaydet} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-5">
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tedarikçi (İsteğe Bağlı)</label>
            <select 
              name="contact_id" 
              value={form.contact_id} 
              onChange={handleGenel} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all appearance-none"
            >
              <option value="">-- Tedarikçi Seçin --</option>
              {tedarikciler.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="h-px w-full bg-slate-100 my-4"></div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Gelen Ürünü Seçin</label>
            <select 
              name="product_id" 
              value={form.product_id} 
              onChange={urunDegisti} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all appearance-none"
            >
              {urunler.length === 0 ? (
                <option value="">Sistemde kayıtlı ürün yok...</option>
              ) : (
                urunler.map((urun) => (
                  <option key={urun.id} value={urun.id}>
                    {urun.name} (Mevcut Stok: {urun.stock_quantity} {urun.unit})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Gelen Miktar</label>
              <input required type="number" name="quantity" value={form.quantity} onChange={handleMiktarBirim} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" 
                placeholder="Örn: 100" />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Birim Fiyat (₺)</label>
              <input required type="number" step="0.01" name="unit_price" value={form.unit_price} onChange={handleMiktarBirim} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" 
                placeholder="Örn: 50.00" />
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center mt-2">
            <div className="flex items-center gap-2 text-slate-500">
              <Calculator size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">Otomatik Tutar</span>
            </div>
            <div className="relative w-1/2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₺</span>
              <input type="number" step="0.01" name="total_price" value={form.total_price} onChange={handleGenel} 
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-8 pr-3 text-right font-black text-blue-600 focus:border-blue-500 outline-none transition-all" 
                placeholder="0.00" />
            </div>
          </div>

          <button type="submit" disabled={loading || urunler.length === 0} 
            className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50">
            <ArrowDownToLine size={20} />
            {loading ? 'İşleniyor...' : 'Stoğa Ekle'}
          </button>
        </form>

      </main>
    </div>
  );
}