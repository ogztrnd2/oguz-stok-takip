"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Package, Trash2, RefreshCcw, TrendingUp, Calendar, Edit3, X, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function UrunDetayPage() {
  const params = useParams();
  const router = useRouter();
  const [urun, setUrun] = useState<any>(null);
  const [hareketler, setHareketler] = useState<any[]>([]);
  const [sonAlisFiyati, setSonAlisFiyati] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Sadece pencereler için kullanılan Zihni / Tevfik sekmesi
  const [aktifSekme, setAktifSekme] = useState<'zihni' | 'tevfik'>('zihni');

  // Stok Düzenleme Modal State
  const [duzenleModalAcik, setDuzenleModalAcik] = useState(false);
  const [yeniStok, setYeniStok] = useState('');
  const [guncelleniyor, setGuncelleniyor] = useState(false);

  useEffect(() => {
    veriGetir();
  }, [params.id]);

  const veriGetir = async () => {
    if (!params.id) return;
    setLoading(true);

    const { data: uData } = await supabase.from('products').select('*').eq('id', params.id).single();
    if (uData) {
      setUrun(uData);
      setYeniStok(uData.stock_quantity?.toString() || '0');
    }

    if (uData) {
      const { data: itemData } = await supabase
        .from('order_items')
        .select(`
          id, quantity, price,
          orders ( id, created_at, type, customer_name, contact_id )
        `)
        .eq('product_id', uData.id)
        .order('id', { ascending: false });

      if (itemData) {
        // TypeScript tip güvenliği ve dizi/obje ihtimaline karşı orders verisini güvenli işliyoruz
        const formatli = itemData
          .filter(item => {
            const siparis = Array.isArray(item.orders) ? item.orders[0] : item.orders;
            return siparis?.type === 'alis';
          })
          .map(item => {
            const siparis = Array.isArray(item.orders) ? item.orders[0] : item.orders;
            return {
              itemId: item.id,
              orderId: siparis?.id,
              tarih: siparis?.created_at,
              tip: siparis?.type,
              karsiTaraf: siparis?.customer_name || 'Bilinmeyen',
              miktar: item.quantity,
              fiyat: item.price
            };
          })
          .sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime());

        setHareketler(formatli);

        if (formatli.length > 0) {
          setSonAlisFiyati(formatli[0].fiyat);
        } else {
          setSonAlisFiyati(0);
        }
      }
    }
    setLoading(false);
  };

  const stokGuncelleKaydet = async (e: any) => {
    e.preventDefault();
    setGuncelleniyor(true);

    try {
      const guncelStok = Number(yeniStok);
      await supabase.from('products').update({ stock_quantity: guncelStok }).eq('id', urun.id);

      setUrun({ ...urun, stock_quantity: guncelStok });
      setDuzenleModalAcik(false);
      alert("Stok miktarı güncellendi!");
    } catch (error: any) {
      alert("Hata: " + error.message);
    } finally {
      setGuncelleniyor(false);
    }
  };

  const hareketSil = async (itemId: string, miktar: number) => {
    const onay = window.confirm("Bu hareketi silmek istediğinize emin misiniz? Stok miktarı güncellenecektir.");
    if (!onay) return;

    try {
      await supabase.from('order_items').delete().eq('id', itemId);
      const yeniDeger = urun.stock_quantity - miktar;
      await supabase.from('products').update({ stock_quantity: yeniDeger }).eq('id', urun.id);
      veriGetir();
    } catch (error: any) {
      alert("Silme hatası: " + error.message);
    }
  };

  const urunGecmisiniSifirla = async () => {
    if (hareketler.length === 0) {
      alert("Silinecek geçmiş bulunmuyor.");
      return;
    }

    const onay = window.confirm(`DİKKAT!\n\n${urun.name} için TÜM alış geçmişi silinecektir. Stok 0 olacaktır. Onaylıyor musunuz?`);
    if (!onay) return;

    try {
      setLoading(true);
      const itemIds = hareketler.map(h => h.itemId);
      for (const id of itemIds) {
        await supabase.from('order_items').delete().eq('id', id);
      }

      await supabase.from('products').update({ stock_quantity: 0 }).eq('id', urun.id);
      setUrun({ ...urun, stock_quantity: 0 });
      setSonAlisFiyati(0);
      setHareketler([]);
      setLoading(false);
      alert("Geçmiş temizlendi ve stok sıfırlandı!");
    } catch (error: any) {
      alert("Hata: " + error.message);
      setLoading(false);
    }
  };

  const urunuKompleSil = async () => {
    if (hareketler.length > 0) {
      alert("Önce hareket geçmişini sıfırlamalısınız.");
      return;
    }

    const onay = window.confirm(`${urun.name} malzemesini tamamen silmek üzeresiniz. Emin misiniz?`);
    if (!onay) return;

    try {
      await supabase.from('products').delete().eq('id', urun.id);
      router.push('/products');
    } catch (error: any) {
      alert("Hata: " + error.message);
    }
  };

  // Malzemenin pencere olup olmadığını kontrol ediyoruz (İsminin içinde "pencere" geçiyorsa)
  const pencereMi = urun?.name?.toLowerCase().includes('pencere');

  // Sadece pencere ise Zihni ve Tevfik olarak ayırıyoruz
  const zihniHareketler = hareketler.filter(h => h.karsiTaraf.toLowerCase().includes('zihni'));
  const tevfikHareketler = hareketler.filter(h => h.karsiTaraf.toLowerCase().includes('tevfik'));

  const zihniSonFiyat = zihniHareketler.length > 0 ? zihniHareketler[0].fiyat : 0;
  const tevfikSonFiyat = tevfikHareketler.length > 0 ? tevfikHareketler[0].fiyat : 0;

  const gosterilecekHareketler = pencereMi 
    ? (aktifSekme === 'zihni' ? zihniHareketler : tevfikHareketler)
    : hareketler; // Normal malzemeyse tüm alışları göster

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-medium text-slate-500">Yükleniyor...</div>;
  if (!urun) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-medium text-slate-500">Malzeme bulunamadı.</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans selection:bg-blue-100">
      
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg px-6 py-5 border-b border-slate-200/60 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/products" className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900">{pencereMi ? 'Pencere Detayı' : 'Malzeme Detayı'}</h1>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-6">
        
        {/* ÜST BİLGİ KARTI */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
          
          <div className="absolute top-4 right-4 flex gap-2">
            <button onClick={urunGecmisiniSifirla} className="px-3 py-2 text-xs font-bold flex items-center gap-1.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-all" title="Geçmişi Sıfırla">
              <RefreshCcw size={14} /> Sıfırla
            </button>
            <button onClick={urunuKompleSil} className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all" title="Sil">
              <Trash2 size={18} />
            </button>
          </div>

          <div className="flex items-center gap-4 mb-6 pr-32">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
              <Package size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 leading-tight">{urun.name}</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">{pencereMi ? 'Ölçü / Pencere Çeşidi' : `Birim: ${urun.unit}`}</p>
            </div>
          </div>

          {/* EĞER PENCERE İSE ZİHNİ VE TEVFİK SEKMELERİ GÖSTER */}
          {pencereMi ? (
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Tedarikçi Son Alış Fiyatları</p>
              <div className="grid grid-cols-2 gap-3 bg-slate-100 p-1.5 rounded-2xl">
                <button 
                  onClick={() => setAktifSekme('zihni')}
                  className={`py-3.5 px-3 rounded-xl flex flex-col items-center justify-center transition-all ${aktifSekme === 'zihni' ? 'bg-white text-blue-600 shadow-sm ring-2 ring-blue-500/20' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">Zihni Alış</span>
                  <span className="text-lg font-black mt-0.5">₺{zihniSonFiyat > 0 ? zihniSonFiyat.toLocaleString('tr-TR') : '0'}</span>
                </button>
                
                <button 
                  onClick={() => setAktifSekme('tevfik')}
                  className={`py-3.5 px-3 rounded-xl flex flex-col items-center justify-center transition-all ${aktifSekme === 'tevfik' ? 'bg-white text-purple-600 shadow-sm ring-2 ring-purple-500/20' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">Tevfik Alış</span>
                  <span className="text-lg font-black mt-0.5">₺{tevfikSonFiyat > 0 ? tevfikSonFiyat.toLocaleString('tr-TR') : '0'}</span>
                </button>
              </div>
            </div>
          ) : null}

          {/* GÜNCEL STOK VE SON ALIŞ FİYATI KARTLARI */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
              <p className="text-xs font-bold uppercase tracking-wider mb-1 text-slate-400">Depo Güncel Stok</p>
              <span className="text-3xl font-black text-blue-600">
                {urun.stock_quantity} <span className="text-sm">{urun.unit}</span>
              </span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
              <p className="text-xs font-bold uppercase tracking-wider mb-1 text-slate-400">Son Alış Fiyatı</p>
              <span className="text-3xl font-black text-emerald-600">
                ₺{sonAlisFiyati > 0 ? sonAlisFiyati.toLocaleString('tr-TR') : '0'}
              </span>
            </div>
          </div>

          <button onClick={() => setDuzenleModalAcik(true)} className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-md active:scale-95">
            <Edit3 size={18} /> Stoğu Manuel Düzenle
          </button>
        </div>

        {/* GEÇMİŞ LİSTESİ BAŞLIĞI */}
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider pl-2 flex items-center gap-2">
          <TrendingUp size={16} className={pencereMi ? (aktifSekme === 'zihni' ? 'text-blue-500' : 'text-purple-500') : 'text-orange-500'}/> 
          {pencereMi 
            ? (aktifSekme === 'zihni' ? 'Zihni\'den Yapılan Tüm Alışlar' : 'Tevfik\'ten Yapılan Tüm Alışlar')
            : 'Malzeme Giriş Geçmişi (Depoya Gelenler)'
          }
        </h3>

        <div className="space-y-4">
          {gosterilecekHareketler.map((h, idx) => (
            <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative">
              <button onClick={() => hareketSil(h.itemId, h.miktar)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors" title="Sil">
                <Trash2 size={16} />
              </button>

              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-3 pr-8">
                <div className="flex items-center gap-2 text-slate-500">
                  <Calendar size={16} />
                  <span className="text-sm font-bold">{new Date(h.tarih).toLocaleDateString('tr-TR')}</span>
                </div>
                <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{h.karsiTaraf}</span>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-800 text-sm">Alış Birim Fiyatı</p>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">₺{h.fiyat}</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-emerald-600">
                    +{h.miktar} {urun.unit}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {gosterilecekHareketler.length === 0 && (
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center">
              <p className="text-slate-500 font-medium text-sm">Henüz kayıtlı alış hareketi bulunmuyor.</p>
            </div>
          )}
        </div>

      </main>

      {/* MANUEL STOK GÜNCELLEME MODALI */}
      {duzenleModalAcik && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-900">Stok Miktarını Düzenle</h3>
              <button onClick={() => setDuzenleModalAcik(false)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200"><X size={18} /></button>
            </div>

            <form onSubmit={stokGuncelleKaydet} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Güncel Stok Miktarı ({urun.unit})</label>
                <input required type="number" step="any" value={yeniStok} onChange={(e) => setYeniStok(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-center text-2xl font-black text-blue-600 outline-none" />
              </div>

              <button type="submit" disabled={guncelleniyor} className="w-full mt-2 py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg active:scale-95 transition-all">
                <CheckCircle2 size={18} /> {guncelleniyor ? 'Kaydediliyor...' : 'Stoğu Güncelle'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}