"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Truck, FileText, ArrowDownLeft, ArrowUpRight, X, RefreshCcw, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function TedarikciDetayPage() {
  const params = useParams();
  const router = useRouter();
  const [tedarikci, setTedarikci] = useState<any>(null);
  const [islemler, setIslemler] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Para İşlemi Modal State
  const [modalAcik, setModalAcik] = useState(false);
  const [islemYon, setIslemYon] = useState<'odeme-yap' | 'para-al'>('odeme-yap');
  const [tutar, setTutar] = useState('');
  const [not, setNot] = useState('');

  useEffect(() => {
    veriGetir();
  }, [params.id]);

  const veriGetir = async () => {
    if (!params.id) return;
    setLoading(true);

    const { data: tData } = await supabase.from('contacts').select('*').eq('id', params.id).single();
    if (tData) setTedarikci(tData);

    if (tData) {
      // Tedarikçiye ait tüm sipariş ve alış fişlerini çekiyoruz
      const { data: oData } = await supabase.from('orders')
        .select(`id, created_at, total_amount, type, customer_name, order_items ( quantity, price, products ( name, unit ) )`)
        .eq('contact_id', tData.id)
        .order('created_at', { ascending: false });
      
      if (oData) setIslemler(oData);
    }
    setLoading(false);
  };

  const paraTransferiYap = async (e: any) => {
    e.preventDefault();
    if (!tutar || Number(tutar) <= 0) return;

    // Tedarikçiye ödeme yaptıysak borcumuz azalır (Bakiye artar)
    const degisim = islemYon === 'odeme-yap' ? Number(tutar) : -Number(tutar);
    const yeniBakiye = (tedarikci.balance || 0) + degisim;

    await supabase.from('contacts').update({ balance: yeniBakiye }).eq('id', tedarikci.id);
    await supabase.from('orders').insert({
      contact_id: tedarikci.id,
      customer_name: not || (islemYon === 'odeme-yap' ? 'Tedarikçiye Ödeme Yapıldı' : 'Tedarikçiden İade/Para Alındı'),
      total_amount: Number(tutar),
      type: islemYon === 'odeme-yap' ? 'odeme_cikisi' : 'tahsilat'
    });

    setModalAcik(false); setTutar(''); setNot(''); veriGetir();
  };

  // TEKİL İŞLEM (FİŞ) SİLME
  const fisSil = async (islemId: string, islemTipi: string, islemTutari: number) => {
    const onay = window.confirm("Bu işlemi silmek istediğinize emin misiniz?");
    if (!onay) return;

    try {
      await supabase.from('order_items').delete().eq('order_id', islemId);
      await supabase.from('orders').delete().eq('id', islemId);

      let yeniBakiye = tedarikci.balance;
      
      if (islemTipi === 'alis' || islemTipi === 'tahsilat') {
        yeniBakiye += islemTutari;
      } else if (islemTipi === 'odeme_cikisi' || islemTipi === 'borc') {
        yeniBakiye -= islemTutari;
      }
      
      await supabase.from('contacts').update({ balance: yeniBakiye }).eq('id', tedarikci.id);
      
      setTedarikci({ ...tedarikci, balance: yeniBakiye });
      setIslemler(islemler.filter(i => i.id !== islemId));
    } catch (error: any) {
      alert("Silme hatası: " + error.message);
    }
  };

  // HESABI SIFIRLAMA
  const hesabiSifirla = async () => {
    if (islemler.length === 0 && tedarikci.balance === 0) {
      alert("Zaten silinecek bir geçmiş bulunmuyor.");
      return;
    }

    const onay = window.confirm(`DİKKAT!\n\n${tedarikci.name} adlı tedarikçinin TÜM geçmişi silinecek ve bakiye 0 TL olacaktır.\n\nTedarikçi rehberde kalmaya devam edecektir. Onaylıyor musunuz?`);
    if (!onay) return;

    try {
      setLoading(true);
      const orderIds = islemler.map(i => i.id);

      if (orderIds.length > 0) {
        for (const oid of orderIds) {
          await supabase.from('order_items').delete().eq('order_id', oid);
        }
      }

      await supabase.from('orders').delete().eq('contact_id', tedarikci.id);
      await supabase.from('contacts').update({ balance: 0 }).eq('id', tedarikci.id);

      setTedarikci({ ...tedarikci, balance: 0 });
      setIslemler([]);
      setLoading(false);
      alert("Geçmiş temizlendi ve bakiye sıfırlandı!");
    } catch (error: any) {
      alert("Hata: " + error.message);
      setLoading(false);
    }
  };

  // TEDARİKÇİYİ SİLME
  const tedarikciKompleSil = async () => {
    if (islemler.length > 0) {
      alert("Önce tedarikçinin geçmiş işlemlerini sıfırlamalısınız.");
      return;
    }
    const onay = window.confirm(`${tedarikci.name} isimli tedarikçiyi tamamen silmek üzeresiniz. Emin misiniz?`);
    if (!onay) return;

    try {
      await supabase.from('contacts').delete().eq('id', tedarikci.id);
      router.push('/'); 
    } catch (error: any) {
      alert("Silinirken hata oluştu: " + error.message);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Yükleniyor...</div>;
  if (!tedarikci) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Tedarikçi bulunamadı.</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans">
      
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg px-6 py-5 border-b border-slate-200/60 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600"><ArrowLeft size={20} /></Link>
          <h1 className="text-xl font-black text-slate-900">Tedarikçi Profili</h1>
        </div>
      </header>

      <main className="p-6 space-y-6">
        
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative">
          
          <div className="absolute top-4 right-4 flex gap-2">
            <button onClick={hesabiSifirla} className="px-3 py-2 text-xs font-bold flex items-center gap-1.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-all" title="Geçmişi Sıfırla">
              <RefreshCcw size={14} /> Sıfırla
            </button>
            <button onClick={tedarikciKompleSil} className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all" title="Sil">
              <Trash2 size={18} />
            </button>
          </div>

          <div className="flex items-center gap-4 mb-6 pr-32">
            <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 shrink-0"><Truck size={32} /></div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">{tedarikci.name}</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">{tedarikci.phone || 'Telefon yok'}</p>
            </div>
          </div>

          <div className={`p-5 rounded-2xl border flex flex-col items-center justify-center mb-4 ${tedarikci.balance < 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
            <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${tedarikci.balance < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
              {tedarikci.balance < 0 ? 'Bu Tedarikçiye Olan Borcumuz' : 'Bakiye Durumu'}
            </p>
            <span className={`text-4xl font-black ${tedarikci.balance < 0 ? 'text-red-700' : 'text-emerald-700'}`}>
              ₺{Math.abs(tedarikci.balance || 0).toLocaleString('tr-TR')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <button onClick={() => { setIslemYon('odeme-yap'); setModalAcik(true); }} className="bg-slate-800 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold shadow-md hover:bg-slate-700"><ArrowUpRight size={18} /> Ödeme Yap</button>
            <button onClick={() => { setIslemYon('para-al'); setModalAcik(true); }} className="bg-emerald-50 text-emerald-600 py-3 rounded-xl flex items-center justify-center gap-2 font-bold border border-emerald-100 hover:bg-emerald-100"><ArrowDownLeft size={18} /> Para Al</button>
          </div>
        </div>

        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider pl-2">Alış ve İşlem Geçmişi</h3>

        <div className="space-y-4">
          {islemler.map((islem, idx) => (
            <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative">
              <button onClick={() => fisSil(islem.id, islem.type, islem.total_amount)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors" title="Sil">
                <Trash2 size={16} />
              </button>

              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-3 pr-8">
                <span className="text-sm font-bold text-slate-500">{new Date(islem.created_at).toLocaleDateString('tr-TR')}</span>
                
                {islem.type === 'alis' && <span className="text-xs font-black text-orange-500 bg-orange-50 px-2 py-1 rounded-md">Malzeme Aldık (Borç Yazıldı)</span>}
                {islem.type === 'odeme_cikisi' && <span className="text-xs font-black text-slate-600 bg-slate-100 px-2 py-1 rounded-md">Ödeme Yapıldı</span>}
                {islem.type === 'tahsilat' && <span className="text-xs font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md">Para Alındı</span>}
              </div>

              <div className="flex justify-between items-end">
                <div className="space-y-1 w-2/3">
                  {islem.order_items && islem.order_items.length > 0 ? islem.order_items.map((k: any, i: number) => (
                    <p key={i} className="text-sm font-medium text-slate-700">
                      {k.products?.name} <span className="text-slate-400 text-xs">({k.quantity} {k.products?.unit})</span>
                    </p>
                  )) : (
                    <p className="text-sm font-bold text-slate-700">{islem.customer_name}</p>
                  )}
                </div>
                <div className="text-right font-black text-lg text-slate-800">₺{islem.total_amount?.toLocaleString('tr-TR')}</div>
              </div>
            </div>
          ))}
          {islemler.length === 0 && <p className="text-center text-slate-400 text-sm py-4">Henüz kayıtlı hareket yok.</p>}
        </div>
      </main>

      {modalAcik && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black">{islemYon === 'odeme-yap' ? 'Tedarikçiye Ödeme Yap' : 'Tedarikçiden Para Al'}</h3>
              <button onClick={() => setModalAcik(false)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500"><X size={18} /></button>
            </div>
            <form onSubmit={paraTransferiYap} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">Tutar (₺)</label>
                <input required type="number" step="0.01" value={tutar} onChange={(e) => setTutar(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-center text-2xl font-black outline-none" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">Açıklama</label>
                <input type="text" value={not} onChange={(e) => setNot(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none" placeholder="Banka havalesi vb." />
              </div>
              <button type="submit" className="w-full py-4 rounded-xl font-bold text-white bg-slate-800 shadow-lg active:scale-95">Onayla</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}