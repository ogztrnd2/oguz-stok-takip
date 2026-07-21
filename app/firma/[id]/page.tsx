"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Building2, ShoppingCart, Package, Banknote, Plus, Trash2, X, RefreshCcw, Printer, ArrowDownToLine, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import Link from 'next/link';

export default function FirmaDetayPage() {
  const params = useParams();
  const router = useRouter();
  const [firma, setFirma] = useState<any>(null);
  const [islemler, setIslemler] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalAcik, setModalAcik] = useState(false);
  const [islemTipi, setIslemTipi] = useState<'odeme' | 'tahsilat' | 'borc'>('odeme');
  const [islemTutari, setIslemTutari] = useState('');
  const [islemNotu, setIslemNotu] = useState('');

  useEffect(() => {
    veriGetir();
  }, [params.id]);

  const veriGetir = async () => {
    if (!params.id) return;
    setLoading(true);

    const { data: firmaData } = await supabase.from('contacts').select('*').eq('id', params.id).single();
    if (firmaData) setFirma(firmaData);

    if (firmaData) {
      const { data: siparisler } = await supabase
        .from('orders')
        .select(`id, created_at, total_amount, type, customer_name, order_items ( quantity, price, products ( name, unit ) )`)
        .eq('contact_id', firmaData.id)
        .order('created_at', { ascending: false });
        
      if (siparisler) setIslemler(siparisler);
    }
    setLoading(false);
  };

  const paraIslemiYap = async (e: any) => {
    e.preventDefault();
    if (!islemTutari || Number(islemTutari) <= 0) return;

    const tutar = Number(islemTutari);
    let yeniBakiye = firma.balance;
    let dbTipi = 'tahsilat';
    let aciklamaMetin = islemNotu;

    if (islemTipi === 'odeme') {
      yeniBakiye -= tutar;
      dbTipi = 'tahsilat';
      aciklamaMetin = islemNotu || 'Firmaya Ödeme Yapıldı';
    } else if (islemTipi === 'tahsilat') {
      yeniBakiye += tutar;
      dbTipi = 'borc';
      aciklamaMetin = islemNotu || 'Firmadan Ödeme Alındı';
    } else if (islemTipi === 'borc') {
      yeniBakiye += tutar;
      dbTipi = 'borc';
      aciklamaMetin = islemNotu || 'Ek Borç / Masraf';
    }

    await supabase.from('contacts').update({ balance: yeniBakiye }).eq('id', firma.id);
    await supabase.from('orders').insert({
      contact_id: firma.id,
      customer_name: aciklamaMetin,
      total_amount: tutar,
      type: dbTipi
    });

    setModalAcik(false); setIslemTutari(''); setIslemNotu(''); veriGetir();
  };

  const fisSil = async (islemId: string, islemTipi: string, tutar: number) => {
    const onay = window.confirm("Bu işlemi silmek istediğinize emin misiniz?");
    if (!onay) return;

    try {
      await supabase.from('order_items').delete().eq('order_id', islemId);
      await supabase.from('orders').delete().eq('id', islemId);

      let yeniBakiye = firma.balance;
      if (islemTipi === 'alis') yeniBakiye -= tutar;
      else if (islemTipi === 'satis') yeniBakiye += tutar;
      else if (islemTipi === 'tahsilat') yeniBakiye += tutar;
      else if (islemTipi === 'borc') yeniBakiye -= tutar;
      
      await supabase.from('contacts').update({ balance: yeniBakiye }).eq('id', firma.id);

      setFirma({ ...firma, balance: yeniBakiye });
      setIslemler(islemler.filter(i => i.id !== islemId));
    } catch (error: any) {
      alert("Silme hatası: " + error.message);
    }
  };

  const hesabiSifirla = async () => {
    if (islemler.length === 0 && firma.balance === 0) {
      alert("Zaten silinecek bir geçmiş bulunmuyor.");
      return;
    }

    const onay = window.confirm(`DİKKAT!\n\n${firma.name} adlı firmanın TÜM işlem geçmişi silinecektir. Bakiye 0 TL olacaktır.\n\nOnaylıyor musunuz?`);
    if (!onay) return;

    try {
      setLoading(true);
      const orderIds = islemler.map(i => i.id);

      if (orderIds.length > 0) {
        for (const oid of orderIds) {
          await supabase.from('order_items').delete().eq('order_id', oid);
        }
      }

      await supabase.from('orders').delete().eq('contact_id', firma.id);
      await supabase.from('contacts').update({ balance: 0 }).eq('id', firma.id);

      setFirma({ ...firma, balance: 0 });
      setIslemler([]);
      setLoading(false);
      alert("Hesap geçmişi temizlendi ve bakiye sıfırlandı!");
    } catch (error: any) {
      alert("Hata: " + error.message);
      setLoading(false);
    }
  };

  const firmaKompleSil = async () => {
    if (islemler.length > 0) {
      alert("Önce firmanın geçmiş işlemlerini sıfırlamalısınız.");
      return;
    }
    const onay = window.confirm(`${firma.name} isimli firmayı tamamen silmek üzeresiniz. Emin misiniz?`);
    if (!onay) return;

    try {
      await supabase.from('contacts').delete().eq('id', firma.id);
      router.push('/firmalar'); 
    } catch (error: any) {
      alert("Silinirken hata oluştu: " + error.message);
    }
  };

  const pdfCikart = () => {
    window.print();
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-medium text-slate-500">Yükleniyor...</div>;
  if (!firma) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-medium text-slate-500">Firma bulunamadı.</div>;

  const aldiklarimiz = islemler.filter(i => i.type === 'alis' || (i.type === 'borc' && !i.customer_name?.toLowerCase().includes('ek borç')));
  const bizdenCikanlar = islemler.filter(i => i.type === 'satis' || i.type === 'tahsilat' || (i.type === 'borc' && i.customer_name?.toLowerCase().includes('ek borç')));

  const toplamAldiklarimiz = aldiklarimiz.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
  const toplambizdenCikanlar = bizdenCikanlar.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);

  const netBakiye = toplamAldiklarimiz - toplambizdenCikanlar;
  const bizimBorcumuzVar = netBakiye > 0;
  const bakiyeSifir = netBakiye === 0;

  return (
    <div className="min-h-screen bg-slate-100 pb-24 font-sans selection:bg-indigo-100">
      
      {/* ÜST HEADER */}
      <header className="print:hidden sticky top-0 z-50 bg-white/85 backdrop-blur-md px-6 py-4 border-b border-slate-200/60 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/firmalar" className="w-10 h-10 bg-slate-50 border border-slate-200/60 rounded-2xl flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900">Ardiye / Firma Profili</h1>
          </div>
        </div>

        <button 
          onClick={pdfCikart}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-500/20 transition-all active:scale-95"
        >
          <Printer size={16} /> PDF Çıkart / Yazdır
        </button>
      </header>

      {/* YAZDIRILACAK / PDF EKSTRESİ (TARİHLER EKLENDİ) */}
      <div className="hidden print:block bg-white p-6 font-sans text-slate-900 space-y-4 text-xs">
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
          <div>
            <h1 className="text-lg font-black tracking-tight">OĞUZHAN TİCARET</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Ardiye & Firma Hesap Ekstresi</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-500">Rapor Tarihi: <span className="text-slate-900">{new Date().toLocaleDateString('tr-TR')}</span></p>
          </div>
        </div>

        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Firma / Ardiye Adı</p>
            <h2 className="text-sm font-black text-slate-900">{firma.name}</h2>
            <p className="text-[10px] text-slate-500">{firma.phone || 'Telefon yok'}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              {bakiyeSifir ? 'Hesap Kapalı' : bizimBorcumuzVar ? 'Bizim Onlara Borcumuz' : 'Alacağımız (Onların Bize Borcu)'}
            </p>
            <p className={`text-base font-black ${bizimBorcumuzVar ? 'text-indigo-600' : 'text-red-600'}`}>
              ₺{Math.abs(netBakiye).toLocaleString('tr-TR')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-black uppercase text-[10px] text-purple-700 bg-purple-50 p-2 rounded mb-2 tracking-wider">📥 Aldıklarımız (Mal ve Ödemeler)</h3>
            <table className="w-full text-left border-collapse">
              <tbody className="divide-y divide-slate-100 text-[10px] font-medium">
                {aldiklarimiz.map((islem) => (
                  <tr key={islem.id}>
                    <td className="py-2">
                      <span className="block font-bold text-slate-400 text-[9px]">{new Date(islem.created_at).toLocaleDateString('tr-TR')}</span>
                      <span className="font-bold text-slate-800">{islem.type === 'alis' ? 'Mal Alışı' : islem.customer_name}</span>
                      {islem.order_items?.map((k: any, i: number) => (
                        <span key={i} className="block text-[9px] text-slate-500">• {k.products?.name} ({k.quantity} {k.products?.unit})</span>
                      ))}
                    </td>
                    <td className="py-2 text-right font-black text-purple-700 align-top">₺{islem.total_amount?.toLocaleString('tr-TR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 pt-2 border-t border-purple-200 flex justify-between items-center font-black text-purple-800 text-xs">
              <span>Aldıklarımız Toplamı:</span>
              <span>₺{toplamAldiklarimiz.toLocaleString('tr-TR')}</span>
            </div>
          </div>

          <div>
            <h3 className="font-black uppercase text-[10px] text-blue-700 bg-blue-50 p-2 rounded mb-2 tracking-wider">📤 Bizden Çıkanlar (Mal ve Ödemeler)</h3>
            <table className="w-full text-left border-collapse">
              <tbody className="divide-y divide-slate-100 text-[10px] font-medium">
                {bizdenCikanlar.map((islem) => (
                  <tr key={islem.id}>
                    <td className="py-2">
                      <span className="block font-bold text-slate-400 text-[9px]">{new Date(islem.created_at).toLocaleDateString('tr-TR')}</span>
                      <span className="font-bold text-slate-800">{islem.type === 'satis' ? 'Mal Verildi' : islem.customer_name}</span>
                      {islem.order_items?.map((k: any, i: number) => (
                        <span key={i} className="block text-[9px] text-slate-500">• {k.products?.name} ({k.quantity} {k.products?.unit})</span>
                      ))}
                    </td>
                    <td className="py-2 text-right font-black text-blue-700 align-top">₺{islem.total_amount?.toLocaleString('tr-TR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 pt-2 border-t border-blue-200 flex justify-between items-center font-black text-blue-800 text-xs">
              <span>Bizden Çıkanlar Toplamı:</span>
              <span>₺{toplambizdenCikanlar.toLocaleString('tr-TR')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* NORMAL EKRAN GÖRÜNÜMÜ */}
      <main className="print:hidden p-5 space-y-5 max-w-xl mx-auto">
        
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 relative overflow-hidden">
          
          <div className="absolute top-4 right-4 flex gap-2">
            <button 
              onClick={hesabiSifirla} 
              className="px-3 py-2 text-xs font-bold flex items-center gap-1.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-all"
              title="Geçmişi Temizle ve Sıfırla"
            >
              <RefreshCcw size={14} /> Sıfırla
            </button>
            <button 
              onClick={firmaKompleSil} 
              className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
              title="Firmayı Sil"
            >
              <Trash2 size={18} />
            </button>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
              <Building2 size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 leading-tight">{firma.name}</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">{firma.phone || 'Telefon eklenmemiş'}</p>
            </div>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col items-center justify-center mb-4 text-center">
            <p className="text-[11px] font-black uppercase tracking-wider mb-1 text-slate-500">
              {bakiyeSifir ? '✨ Hesap Kapalı / Bakiye Sıfır' : bizimBorcumuzVar ? '🟢 Bizim Onlara Borcumuz' : '🔴 Alacağımız (Onların Bize Borcu)'}
            </p>
            <span className={`text-4xl font-black ${bizimBorcumuzVar ? 'text-indigo-600' : 'text-red-500'}`}>
              ₺{Math.abs(netBakiye).toLocaleString('tr-TR')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 mb-2.5">
            <Link href={`/alis-gir?firma=${firma.id}`} className="bg-purple-600 text-white py-3 px-3 rounded-xl flex items-center justify-center gap-2 font-bold shadow-md hover:bg-purple-700 active:scale-95 transition-all text-xs">
              <ArrowDownToLine size={16} /> Mal Al
            </Link>
            <Link href={`/satis-yap?firma=${firma.id}`} className="bg-blue-600 text-white py-3 px-3 rounded-xl flex items-center justify-center gap-2 font-bold shadow-md hover:bg-blue-700 active:scale-95 transition-all text-xs">
              <ShoppingCart size={16} /> Mal Ver
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2.5 mb-3">
            <button onClick={() => { setIslemTipi('odeme'); setModalAcik(true); }} className="bg-emerald-600 text-white py-3 px-3 rounded-xl flex items-center justify-center gap-2 font-bold shadow-md hover:bg-emerald-700 active:scale-95 transition-all text-xs">
              <Banknote size={16} /> Ödeme Yap
            </button>
            <button onClick={() => { setIslemTipi('tahsilat'); setModalAcik(true); }} className="bg-teal-600 text-white py-3 px-3 rounded-xl flex items-center justify-center gap-2 font-bold shadow-md hover:bg-teal-700 active:scale-95 transition-all text-xs">
              <Banknote size={16} /> Ödeme Al
            </button>
          </div>
          
          <button onClick={() => { setIslemTipi('borc'); setModalAcik(true); }} className="w-full bg-slate-100 text-slate-700 py-3 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-slate-200 transition-colors text-xs">
            <Plus size={16} /> Ekstra Borç / Masraf Ekle
          </button>
        </div>

        {/* İKİ SÜTUNLU LİSTE GÖRÜNÜMÜ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* ALDIKLARIMIZ */}
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="text-xs font-black text-purple-700 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <ArrowDownLeft size={16} /> Aldıklarımız (Mal ve Ödemeler)
              </h3>
              <div className="space-y-2.5">
                {aldiklarimiz.map((islem) => (
                  <div key={islem.id} className="bg-purple-50/50 p-3 rounded-2xl border border-purple-100 relative group">
                    <button onClick={() => fisSil(islem.id, islem.type, islem.total_amount)} className="absolute top-3 right-3 text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                    <div className="flex justify-between items-center pr-6 mb-1">
                      <span className="text-[10px] font-bold text-slate-400">{new Date(islem.created_at).toLocaleDateString('tr-TR')}</span>
                      <span className="text-sm font-black text-purple-700">₺{islem.total_amount?.toLocaleString('tr-TR')}</span>
                    </div>
                    {islem.type === 'alis' ? (
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-800">Mal Alışı</p>
                        {islem.order_items?.map((k: any, idx: number) => (
                          <p key={idx} className="text-[11px] text-slate-600">• {k.products?.name} ({k.quantity} {k.products?.unit} x ₺{k.price})</p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-slate-800">{islem.customer_name}</p>
                    )}
                  </div>
                ))}
                {aldiklarimiz.length === 0 && (
                  <p className="text-center text-slate-400 text-xs py-4">Henüz kayıt yok.</p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-purple-100 bg-purple-50/80 p-3.5 rounded-2xl flex justify-between items-center">
              <span className="text-xs font-black text-purple-900 uppercase tracking-wider">Aldıklarımız Toplamı</span>
              <span className="text-base font-black text-purple-700">₺{toplamAldiklarimiz.toLocaleString('tr-TR')}</span>
            </div>
          </div>

          {/* BİZDEN ÇIKANLAR */}
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="text-xs font-black text-blue-700 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <ArrowUpRight size={16} /> Bizden Çıkanlar (Mal ve Ödemeler)
              </h3>
              <div className="space-y-2.5">
                {bizdenCikanlar.map((islem) => (
                  <div key={islem.id} className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100 relative group">
                    <button onClick={() => fisSil(islem.id, islem.type, islem.total_amount)} className="absolute top-3 right-3 text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                    <div className="flex justify-between items-center pr-6 mb-1">
                      <span className="text-[10px] font-bold text-slate-400">{new Date(islem.created_at).toLocaleDateString('tr-TR')}</span>
                      <span className="text-sm font-black text-blue-700">₺{islem.total_amount?.toLocaleString('tr-TR')}</span>
                    </div>
                    {islem.type === 'satis' ? (
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-800">Mal Çıkışı / Verilen</p>
                        {islem.order_items?.map((k: any, idx: number) => (
                          <p key={idx} className="text-[11px] text-slate-600">• {k.products?.name} ({k.quantity} {k.products?.unit} x ₺{k.price})</p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-slate-800">{islem.customer_name}</p>
                    )}
                  </div>
                ))}
                {bizdenCikanlar.length === 0 && (
                  <p className="text-center text-slate-400 text-xs py-4">Henüz kayıt yok.</p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-blue-100 bg-blue-50/80 p-3.5 rounded-2xl flex justify-between items-center">
              <span className="text-xs font-black text-blue-900 uppercase tracking-wider">Bizden Çıkanlar Toplamı</span>
              <span className="text-base font-black text-blue-700">₺{toplambizdenCikanlar.toLocaleString('tr-TR')}</span>
            </div>
          </div>

        </div>

      </main>

      {/* MODAL */}
      {modalAcik && (
        <div className="print:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-900">
                {islemTipi === 'odeme' ? 'Ödeme Yap (Bizden Çıkan Para)' : islemTipi === 'tahsilat' ? 'Ödeme Al (Firmadan Gelen Para)' : 'Ekstra Borç / Masraf Ekle'}
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
                <input type="text" value={islemNotu} onChange={(e) => setIslemNotu(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none" placeholder="Nakit, Havale, vb." />
              </div>
              <button type="submit" className="w-full py-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg active:scale-95">Onayla</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}