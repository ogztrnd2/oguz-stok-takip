"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, User, FileText, ShoppingCart, Package, Banknote, Plus, Trash2, X, RefreshCcw, Printer, Home } from 'lucide-react';
import Link from 'next/link';

export default function CariDetayPage() {
  const params = useParams();
  const router = useRouter();
  const [musteri, setMusteri] = useState<any>(null);
  const [islemler, setIslemler] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalAcik, setModalAcik] = useState(false);
  const [islemTipi, setIslemTipi] = useState<'tahsilat' | 'borc'>('tahsilat');
  const [islemTutari, setIslemTutari] = useState('');
  const [islemNotu, setIslemNotu] = useState('');

  useEffect(() => {
    veriGetir();
  }, [params.id]);

  const veriGetir = async () => {
    if (!params.id) return;
    setLoading(true);

    const { data: musteriData } = await supabase.from('contacts').select('*').eq('id', params.id).single();
    if (musteriData) setMusteri(musteriData);

    if (musteriData) {
      const { data: siparisler } = await supabase
        .from('orders')
        .select(`id, created_at, total_amount, type, customer_name, order_items ( quantity, price, products ( name, unit ) )`)
        .eq('contact_id', musteriData.id)
        .order('created_at', { ascending: false });
        
      if (siparisler) setIslemler(siparisler);
    }
    setLoading(false);
  };

  const paraIslemiYap = async (e: any) => {
    e.preventDefault();
    if (!islemTutari || Number(islemTutari) <= 0) return;

    const tutar = Number(islemTutari);
    const yeniBakiye = islemTipi === 'tahsilat' ? musteri.balance - tutar : musteri.balance + tutar;

    await supabase.from('contacts').update({ balance: yeniBakiye }).eq('id', musteri.id);
    await supabase.from('orders').insert({
      contact_id: musteri.id,
      customer_name: islemNotu || (islemTipi === 'tahsilat' ? 'Nakit Tahsilat (Para Girişi)' : 'Manuel Borçlandırma'),
      total_amount: tutar,
      type: islemTipi
    });

    setModalAcik(false); setIslemTutari(''); setIslemNotu(''); veriGetir();
  };

  const fisSil = async (islemId: string, islemTipi: string, tutar: number) => {
    const onay = window.confirm("Bu işlemi tamamen silmek istediğinize emin misiniz?");
    if (!onay) return;

    try {
      await supabase.from('order_items').delete().eq('order_id', islemId);
      await supabase.from('orders').delete().eq('id', islemId);

      let yeniBakiye = musteri.balance;
      if (islemTipi === 'satis' || islemTipi === 'borc') {
        yeniBakiye -= tutar;
      } else if (islemTipi === 'tahsilat') {
        yeniBakiye += tutar;
      }
      
      await supabase.from('contacts').update({ balance: yeniBakiye }).eq('id', musteri.id);

      setMusteri({ ...musteri, balance: yeniBakiye });
      setIslemler(islemler.filter(i => i.id !== islemId));
    } catch (error: any) {
      alert("Silme hatası: " + error.message);
    }
  };

  const hesabiSifirla = async () => {
    if (islemler.length === 0 && musteri.balance === 0) {
      alert("Zaten silinecek bir geçmiş veya bakiye bulunmuyor.");
      return;
    }

    const onay = window.confirm(`DİKKAT!\n\n${musteri.name} adlı müşterinin TÜM satış, tahsilat ve borç geçmişi silinecektir. Bakiye 0 TL olacaktır.\n\nOnaylıyor musunuz?`);
    if (!onay) return;

    try {
      setLoading(true);
      const orderIds = islemler.map(i => i.id);

      if (orderIds.length > 0) {
        for (const oid of orderIds) {
          await supabase.from('order_items').delete().eq('order_id', oid);
        }
      }

      await supabase.from('orders').delete().eq('contact_id', musteri.id);
      await supabase.from('contacts').update({ balance: 0 }).eq('id', musteri.id);

      setMusteri({ ...musteri, balance: 0 });
      setIslemler([]);
      setLoading(false);
      alert("Hesap geçmişi tamamen temizlendi ve bakiye sıfırlandı!");
    } catch (error: any) {
      alert("Sıfırlama sırasında hata oluştu: " + error.message);
      setLoading(false);
    }
  };

  const musteriKompleSil = async () => {
    if (islemler.length > 0) {
      alert("Önce müşterinin geçmiş işlemlerini silmelisiniz veya 'Sıfırla' özelliğini kullanmalısınız.");
      return;
    }
    const onay = window.confirm(`${musteri.name} isimli müşteriyi tamamen silmek üzeresiniz. Emin misiniz?`);
    if (!onay) return;

    try {
      await supabase.from('contacts').delete().eq('id', musteri.id);
      router.push('/alacaklar'); 
    } catch (error: any) {
      alert("Silinirken hata oluştu: " + error.message);
    }
  };

  const pdfCikart = () => {
    window.print();
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-medium text-slate-500">Yükleniyor...</div>;
  if (!musteri) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-medium text-slate-500">Müşteri bulunamadı.</div>;

  return (
    <div className="min-h-screen bg-slate-100 pb-24 font-sans selection:bg-blue-100">
      
      {/* Yazdırma/PDF esnasında gizlenecek üst header */}
      <header className="print:hidden sticky top-0 z-50 bg-white/85 backdrop-blur-md px-6 py-4 border-b border-slate-200/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/alacaklar" className="w-10 h-10 bg-slate-50 border border-slate-200/60 rounded-2xl flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors" title="Listeye Dön">
            <ArrowLeft size={20} />
          </Link>
          <Link href="/" className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-colors" title="Ana Sayfaya Dön">
            <Home size={20} />
          </Link>
          <div className="ml-1">
            <h1 className="text-xl font-black text-slate-900">Müşteri Profili</h1>
          </div>
        </div>

        <button 
          onClick={pdfCikart}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all active:scale-95"
        >
          <Printer size={16} /> PDF Çıkart / Yazdır
        </button>
      </header>

      {/* YAZDIRILACAK / PDF OLACAK ÖZEL KURUMSAL EKSTRE */}
      <div className="hidden print:block bg-white p-6 font-sans text-slate-900 space-y-4 text-xs">
        
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
          <div>
            <h1 className="text-lg font-black tracking-tight">OĞUZHAN TİCARET</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Müşteri Hesap Ekstresi</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-500">Tarih: <span className="text-slate-900">{new Date().toLocaleDateString('tr-TR')}</span></p>
          </div>
        </div>

        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Müşteri Adı</p>
            <h2 className="text-sm font-black text-slate-900">{musteri.name}</h2>
            <p className="text-[10px] text-slate-500">{musteri.phone || 'Telefon yok'}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Güncel Borç Bakiyesi</p>
            <p className="text-base font-black text-red-600">₺{(musteri.balance || 0).toLocaleString('tr-TR')}</p>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-black uppercase text-[10px] text-slate-400 tracking-wider">İşlem Geçmişi</h3>
          
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-300 text-[10px] font-black uppercase text-slate-500">
                <th className="py-1.5">Tarih</th>
                <th className="py-1.5">İşlem / Açıklama</th>
                <th className="py-1.5 text-right">Tutar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px] font-medium">
              {islemler.map((islem) => (
                <tr key={islem.id}>
                  <td className="py-2 text-slate-500">{new Date(islem.created_at).toLocaleDateString('tr-TR')}</td>
                  <td className="py-2 font-bold text-slate-800">
                    {islem.type === 'tahsilat' && `[Tahsilat] ${islem.customer_name}`}
                    {islem.type === 'borc' && `[Borç] ${islem.customer_name}`}
                    {islem.type === 'satis' && (
                      <div>
                        <span className="text-blue-600">Malzeme Çıkışı ({islem.customer_name}):</span>
                        <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                          {islem.order_items?.map((k: any, i: number) => (
                            <span key={i} className="block">• {k.products?.name} ({k.quantity} {k.products?.unit} x ₺{k.price})</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className={`py-2 text-right font-black ${islem.type === 'tahsilat' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {islem.type === 'tahsilat' ? '-' : '+'} ₺{islem.total_amount?.toLocaleString('tr-TR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-8 grid grid-cols-2 gap-8 text-center text-[10px] font-bold text-slate-500">
          <div>
            <p className="border-t border-slate-400 pt-1">Düzenleyen</p>
          </div>
          <div>
            <p className="border-t border-slate-400 pt-1">Müşteri İmzası</p>
          </div>
        </div>

      </div>

      {/* NORMAL EKRAN GÖRÜNÜMÜ */}
      <main className="print:hidden p-5 space-y-5 max-w-md mx-auto">
        
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 relative overflow-hidden">
          
          <div className="absolute top-4 right-4 flex gap-2">
            <button 
              onClick={hesabiSifirla} 
              className="px-3 py-2 text-xs font-bold flex items-center gap-1.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-all"
              title="Geçmişi Temizle ve Bakiyeyi Sıfırla"
            >
              <RefreshCcw size={14} /> Sıfırla
            </button>
            <button 
              onClick={musteriKompleSil} 
              className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
              title="Müşteriyi Tamamen Sil"
            >
              <Trash2 size={18} />
            </button>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
              <User size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 leading-tight">{musteri.name}</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">{musteri.phone || 'Telefon eklenmemiş'}</p>
            </div>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col items-center justify-center mb-4">
            <p className="text-xs font-bold uppercase tracking-wider mb-1 text-slate-500">Güncel Borç Bakiyesi</p>
            <span className={`text-4xl font-black ${musteri.balance > 0 ? 'text-red-500' : 'text-slate-800'}`}>
              ₺{(musteri.balance || 0).toLocaleString('tr-TR')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <Link href={`/satis-yap?musteri=${musteri.id}`} className="bg-slate-800 text-white py-3.5 rounded-xl flex items-center justify-center gap-2 font-bold shadow-md hover:bg-slate-700 active:scale-95 transition-all text-sm">
              <ShoppingCart size={18} /> Malzeme Çık
            </Link>
            <button onClick={() => { setIslemTipi('tahsilat'); setModalAcik(true); }} className="bg-emerald-500 text-white py-3.5 rounded-xl flex items-center justify-center gap-2 font-bold shadow-md hover:bg-emerald-600 active:scale-95 transition-all text-sm">
              <Banknote size={18} /> Para Al
            </button>
          </div>
          
          <button onClick={() => { setIslemTipi('borc'); setModalAcik(true); }} className="w-full bg-slate-100 text-slate-700 py-3 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-slate-200 transition-colors text-sm">
            <Plus size={18} /> Ekstra Borç Ekle
          </button>
        </div>

        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider pl-2 flex items-center gap-2">
          <Package size={16} className="text-blue-500"/> Hesap Hareketleri
        </h3>

        <div className="space-y-3">
          {islemler.map((islem) => (
            <div key={islem.id} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm relative">
              
              <button 
                onClick={() => fisSil(islem.id, islem.type, islem.total_amount)}
                className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"
                title="Bu işlemi sil"
              >
                <Trash2 size={16} />
              </button>

              <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-2.5 pr-6">
                <span className="text-xs font-bold text-slate-400">{new Date(islem.created_at).toLocaleDateString('tr-TR')}</span>
                <span className={`text-base font-black ${islem.type === 'tahsilat' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {islem.type === 'tahsilat' ? '-' : '+'} ₺{islem.total_amount?.toLocaleString('tr-TR')}
                </span>
              </div>

              {islem.type === 'tahsilat' || islem.type === 'borc' ? (
                <div className={`p-3 rounded-xl font-bold text-xs flex items-center gap-2 ${islem.type === 'tahsilat' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {islem.type === 'tahsilat' ? <Banknote size={16}/> : <Plus size={16}/>}
                  {islem.customer_name}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {islem.order_items && islem.order_items.map((kalem: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{kalem.products?.name || 'Bilinmeyen Ürün'}</p>
                        <p className="text-[10px] font-medium text-slate-400">
                          {kalem.quantity} {kalem.products?.unit} x ₺{kalem.price}
                        </p>
                      </div>
                      <div className="font-bold text-slate-700">
                        ₺{(kalem.quantity * kalem.price).toLocaleString('tr-TR')}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          ))}
          {islemler.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-4">Bu müşterinin henüz işlem geçmişi bulunmuyor.</p>
          )}
        </div>

      </main>

      {/* MODAL */}
      {modalAcik && (
        <div className="print:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-lg font-black ${islemTipi === 'tahsilat' ? 'text-emerald-600' : 'text-red-600'}`}>
                {islemTipi === 'tahsilat' ? 'Müşteriden Para Al' : 'Borç Ekle'}
              </h3>
              <button onClick={() => setModalAcik(false)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200"><X size={18} /></button>
            </div>
            <form onSubmit={paraIslemiYap} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">Tutar (₺)</label>
                <input required type="number" step="0.01" value={islemTutari} onChange={(e) => setIslemTutari(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-center text-2xl font-black outline-none" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">Açıklama / Not</label>
                <input type="text" value={islemNotu} onChange={(e) => setIslemNotu(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none" placeholder={islemTipi === 'tahsilat' ? 'Nakit/Elden alındı vb.' : 'Nakliye ücreti vb.'} />
              </div>
              <button type="submit" className={`w-full py-4 rounded-xl font-bold text-white shadow-lg active:scale-95 ${islemTipi === 'tahsilat' ? 'bg-emerald-500' : 'bg-red-500'}`}>Onayla</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}