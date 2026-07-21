"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Building2, Phone, X, Store } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function FirmalarPage() {
  const [firmalar, setFirmalar] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Firma Ekleme Modal State
  const [modalAcik, setModalAcik] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', balance: '' });
  const [kaydediliyor, setKaydediliyor] = useState(false);

  useEffect(() => {
    fetchFirmalar();
  }, []);

  const fetchFirmalar = async () => {
    setLoading(true);
    // 'firma' türündeki kişileri/ardiyeleri çekiyoruz ve bağlı sipariş/işlem geçmişlerini dahil ediyoruz
    const { data } = await supabase
      .from('contacts')
      .select(`*, orders(type, total_amount, customer_name)`)
      .eq('type', 'firma')
      .order('name');

    if (data) {
      // Her firmanın bakiye hesaplamasını detay sayfasındaki net mantıkla güncelliyoruz
      const hesaplananFirmalar = data.map(firma => {
        const siparisler = firma.orders || [];
        const aldiklarimiz = siparisler.filter((i: any) => i.type === 'alis' || (i.type === 'borc' && !i.customer_name?.toLowerCase().includes('ek borç')));
        const bizdenCikanlar = siparisler.filter((i: any) => i.type === 'satis' || i.type === 'tahsilat' || (i.type === 'borc' && i.customer_name?.toLowerCase().includes('ek borç')));

        const toplamAldiklarimiz = aldiklarimiz.reduce((acc: number, curr: any) => acc + (curr.total_amount || 0), 0);
        const toplamBizdenCikanlar = bizdenCikanlar.reduce((acc: number, curr: any) => acc + (curr.total_amount || 0), 0);

        // Net bakiye (Detay sayfasiyla birebir aynı hesap)
        const netBakiye = toplamAldiklarimiz - toplamBizdenCikanlar;

        return {
          ...firma,
          hesaplananBakiye: netBakiye
        };
      });

      setFirmalar(hesaplananFirmalar);
    }
    setLoading(false);
  };

  const firmaKaydet = async (e: any) => {
    e.preventDefault();
    setKaydediliyor(true);
    try {
      await supabase.from('contacts').insert([{
        name: form.name,
        phone: form.phone,
        type: 'firma',
        balance: Number(form.balance) || 0
      }]);
      setForm({ name: '', phone: '', balance: '' });
      setModalAcik(false);
      fetchFirmalar();
    } catch (error: any) {
      alert("Hata oluştu: " + error.message);
    } finally {
      setKaydediliyor(false);
    }
  };

  const firmaSil = async (e: any, id: string, isim: string) => {
    e.stopPropagation();
    const onay = window.confirm(`${isim} isimli firmayı silmek istediğinize emin misiniz?`);
    if (!onay) return;

    try {
      await supabase.from('contacts').delete().eq('id', id);
      fetchFirmalar();
    } catch (error: any) {
      alert("Silme hatası: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-28 font-sans selection:bg-indigo-100 flex flex-col items-center">
      
      {/* ÜST HEADER */}
      <header className="w-full max-w-md bg-white/80 backdrop-blur-md px-6 py-4 border-b border-slate-200/60 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-10 h-10 bg-slate-50 border border-slate-200/60 rounded-2xl flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">Ardiyeler / Firmalar</h1>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">Tedarikçi ve Firma Takibi</p>
          </div>
        </div>
        <button onClick={() => setModalAcik(true)} className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center hover:bg-indigo-100 transition-colors shadow-sm active:scale-95">
          <Plus size={22} />
        </button>
      </header>

      <main className="w-full max-w-md p-5 space-y-3">
        
        {/* FIRMA LİSTESİ */}
        {loading ? (
          <div className="text-center text-slate-400 py-12 font-medium">Firmalar yükleniyor...</div>
        ) : firmalar.length === 0 ? (
          <div className="text-center py-12 px-6 bg-white rounded-3xl border border-slate-200/60 shadow-sm space-y-3">
            <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
              <Store size={24} />
            </div>
            <p className="text-slate-600 font-bold text-sm">Kayıtlı ardiye/firma bulunmuyor.</p>
            <p className="text-slate-400 text-xs">Sağ üstteki + butonunu kullanarak hemen yeni bir ardiye ekleyebilirsiniz.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {firmalar.map((f) => {
              const bakiyeDegeri = f.hesaplananBakiye ?? 0;
              const bizimBorcumuzVar = bakiyeDegeri > 0;
              const bakiyeSifir = bakiyeDegeri === 0;

              return (
                <div 
                  key={f.id} 
                  onClick={() => router.push(`/firma/${f.id}`)} 
                  className="bg-white p-4.5 rounded-3xl shadow-sm border border-slate-200/80 flex justify-between items-center group hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors shrink-0">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 text-base">{f.name}</h3>
                      <p className="text-xs font-medium text-slate-400 mt-0.5 flex items-center gap-1">
                        <Phone size={12} /> {f.phone || 'Telefon yok'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={`font-black text-base ${bizimBorcumuzVar ? 'text-indigo-600' : 'text-red-500'}`}>
                        ₺{Math.abs(bakiyeDegeri).toLocaleString('tr-TR')}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        {bakiyeSifir ? 'Sıfır / Kapalı' : bizimBorcumuzVar ? 'Bizim Borcumuz' : 'Alacağımız'}
                      </p>
                    </div>

                    {/* SİLME BUTONU */}
                    <button 
                      onClick={(e) => firmaSil(e, f.id, f.name)}
                      className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors"
                      title="Firmayı Sil"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* YENİ FİRMA EKLEME MODALI */}
      {modalAcik && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-900">Yeni Ardiye / Firma Ekle</h3>
              <button onClick={() => setModalAcik(false)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={firmaKaydet} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Firma / Ardiye Adı</label>
                <input required type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 outline-none font-bold text-slate-800 focus:border-indigo-500" placeholder="Örn: Yılmaz Yapı Market" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Telefon Numarası</label>
                <input type="text" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 outline-none font-medium text-slate-800 focus:border-indigo-500" placeholder="0532..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Başlangıç Bakiyesi (₺)</label>
                <input type="number" step="0.01" value={form.balance} onChange={(e) => setForm({...form, balance: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 outline-none font-bold text-slate-800 focus:border-indigo-500" placeholder="0.00" />
              </div>

              <button type="submit" disabled={kaydediliyor} 
                className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/25 transition-all active:scale-95">
                {kaydediliyor ? 'Kaydediliyor...' : 'Firmayı Kaydet'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}