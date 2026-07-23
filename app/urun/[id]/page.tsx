"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Package, Trash2, RefreshCcw, TrendingUp, Calendar, Edit3, X, CheckCircle2, Building2, Home, FileText } from 'lucide-react';
import Link from 'next/link';

export default function UrunDetayPage() {
  const params = useParams();
  const router = useRouter();
  const [urun, setUrun] = useState<any>(null);
  const [hareketler, setHareketler] = useState<any[]>([]);
  const [sonAlisFiyati, setSonAlisFiyati] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const [aktifSekme, setAktifSekme] = useState<'zihni' | 'tevfik'>('zihni');

  // STOK DÜZENLEME MODALI
  const [duzenleModalAcik, setDuzenleModalAcik] = useState(false);
  const [yeniStok, setYeniStok] = useState('');
  
  // GEÇMİŞ İŞLEM DÜZENLEME MODALI
  const [hareketDuzenleModalAcik, setHareketDuzenleModalAcik] = useState(false);
  const [seciliHareket, setSeciliHareket] = useState<any>(null);
  const [editTarih, setEditTarih] = useState('');
  const [editMiktar, setEditMiktar] = useState('');
  const [editFiyat, setEditFiyat] = useState('');
  const [editNot, setEditNot] = useState('');

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
        const formatli = itemData
          .filter(item => {
            const siparis = Array.isArray(item.orders) ? item.orders[0] : item.orders;
            return siparis?.type === 'alis';
          })
          .map(item => {
            const siparis = Array.isArray(item.orders) ? item.orders[0] : item.orders;
            
            // Gizli olarak kaydettiğimiz notu ayrıştırıyoruz
            const hamAd = siparis?.customer_name || 'Bilinmeyen';
            const parcalar = hamAd.split('|');
            const firmaAdi = parcalar[0];
            const notMetni = parcalar.length > 1 ? parcalar.slice(1).join('|') : null;

            return {
              itemId: item.id,
              orderId: siparis?.id,
              tarih: siparis?.created_at,
              tip: siparis?.type,
              karsiTaraf: firmaAdi,
              islemNotu: notMetni,
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

  // İŞLEMİ DÜZENLEME EKRANINI AÇAN FONKSİYON
  const hareketDuzenleBaslat = (h: any) => {
    setSeciliHareket(h);
    const dateStr = new Date(h.tarih).toISOString().split('T')[0];
    setEditTarih(dateStr);
    setEditMiktar(h.miktar.toString());
    setEditFiyat(h.fiyat.toString());
    setEditNot(h.islemNotu || '');
    setHareketDuzenleModalAcik(true);
  };

  // İŞLEMİ DÜZENLE VE KAYDET (Tarih, Not, Miktar, Fiyat, Bakiye Güncellemesi Dahil)
  const hareketGuncelleKaydet = async (e: any) => {
    e.preventDefault();
    setGuncelleniyor(true);

    try {
      const yeniMiktar = Number(editMiktar);
      const yeniFiyat = Number(editFiyat);
      const eskiMiktar = Number(seciliHareket.miktar);
      const eskiFiyat = Number(seciliHareket.fiyat);
      
      const miktarFarki = yeniMiktar - eskiMiktar;
      const tutarFarki = (yeniMiktar * yeniFiyat) - (eskiMiktar * eskiFiyat);

      // 1. Order Item Güncellemesi (Fiyat ve Miktar)
      await supabase
        .from('order_items')
        .update({ quantity: yeniMiktar, price: yeniFiyat })
        .eq('id', seciliHareket.itemId);

      // 2. Orders Güncellemesi (Tarih, Not ve Tutar)
      const yeniFirmaAd = editNot.trim() !== '' 
        ? `${seciliHareket.karsiTaraf}|${editNot.trim()}`
        : seciliHareket.karsiTaraf;

      const { data: currentOrder } = await supabase.from('orders').select('contact_id, total_amount, created_at').eq('id', seciliHareket.orderId).single();

      if (currentOrder) {
        let veritabaniTarihi = currentOrder.created_at;
        const dateOnly = new Date(currentOrder.created_at).toISOString().split('T')[0];
        
        if (editTarih !== dateOnly) {
          veritabaniTarihi = new Date(`${editTarih}T12:00:00`).toISOString();
        }

        const yeniSiparisToplami = Number(currentOrder.total_amount || 0) + tutarFarki;

        await supabase
          .from('orders')
          .update({ 
            created_at: veritabaniTarihi,
            customer_name: yeniFirmaAd,
            total_amount: yeniSiparisToplami
          })
          .eq('id', seciliHareket.orderId);

        // 3. Firma Bakiyesini Güncelle
        if (tutarFarki !== 0 && currentOrder.contact_id) {
          const { data: contact } = await supabase.from('contacts').select('balance').eq('id', currentOrder.contact_id).single();
          if (contact) {
            // Alış işleminde tutar artarsa bizim borcumuz artar (yani bakiye eksiye gider)
            const yeniBakiye = Number(contact.balance || 0) - tutarFarki;
            await supabase.from('contacts').update({ balance: yeniBakiye }).eq('id', currentOrder.contact_id);
          }
        }
      }

      // 4. Ana Ürün Stok Güncellemesi
      if (miktarFarki !== 0) {
        const yeniStok = urun.stock_quantity + miktarFarki;
        await supabase.from('products').update({ stock_quantity: yeniStok }).eq('id', urun.id);
      }

      setHareketDuzenleModalAcik(false);
      veriGetir(); // Sayfadaki verileri yeniden yükle
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

  const pencereMi = urun?.name?.toLowerCase().includes('pencere');

  const zihniHareketler = hareketler.filter(h => h.karsiTaraf.toLowerCase().includes('zihni'));
  const tevfikHareketler = hareketler.filter(h => h.karsiTaraf.toLowerCase().includes('tevfik'));

  const zihniSonFiyat = zihniHareketler.length > 0 ? zihniHareketler[0].fiyat : 0;
  const tevfikSonFiyat = tevfikHareketler.length > 0 ? tevfikHareketler[0].fiyat : 0;

  const gosterilecekHareketler = pencereMi 
    ? (aktifSekme === 'zihni' ? zihniHareketler : tevfikHareketler)
    : hareketler;

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-medium text-slate-500">Yükleniyor...</div>;
  if (!urun) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-medium text-slate-500">Malzeme bulunamadı.</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans selection:bg-blue-100">
      
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg px-6 py-5 border-b border-slate-200/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/products" className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors" title="Listeye Dön">
            <ArrowLeft size={20} />
          </Link>
          <Link href="/" className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center hover:bg-indigo-100 transition-colors" title="Ana Sayfaya Dön">
            <Home size={20} />
          </Link>
          <div className="ml-2">
            <h1 className="text-xl font-black text-slate-900">{pencereMi ? 'Pencere Detayı' : 'Malzeme Detayı'}</h1>
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-6 space-y-6 max-w-xl mx-auto">
        
        {/* 1. ÜRÜN ÖZET KARTI (Kompakt Tasarım) */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200/80 flex justify-between items-center relative">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
              <Package size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 leading-tight pr-2">{urun.name}</h2>
              <p className="text-sm font-black text-emerald-600 mt-0.5">
                {urun.stock_quantity} <span className="text-xs font-medium text-slate-500">{urun.unit} Depoda</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setDuzenleModalAcik(true)} className="w-10 h-10 bg-slate-50 border border-slate-100 text-slate-600 rounded-xl flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all" title="Stoğu Manuel Düzenle">
              <Edit3 size={18} />
            </button>
            <button onClick={urunuKompleSil} className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all" title="Ürünü Sil">
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {/* 2. EĞER PENCERE İSE SEKMELER */}
        {pencereMi && (
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200/80">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 text-center">Tedarikçi Son Alış Fiyatları</p>
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
              <button 
                onClick={() => setAktifSekme('zihni')}
                className={`py-3 px-2 rounded-xl flex flex-col items-center justify-center transition-all ${aktifSekme === 'zihni' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-blue-500/20' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Zihni</span>
                <span className="text-base font-black mt-0.5">₺{zihniSonFiyat > 0 ? zihniSonFiyat.toLocaleString('tr-TR') : '0'}</span>
              </button>
              <button 
                onClick={() => setAktifSekme('tevfik')}
                className={`py-3 px-2 rounded-xl flex flex-col items-center justify-center transition-all ${aktifSekme === 'tevfik' ? 'bg-white text-purple-600 shadow-sm ring-1 ring-purple-500/20' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Tevfik</span>
                <span className="text-base font-black mt-0.5">₺{tevfikSonFiyat > 0 ? tevfikSonFiyat.toLocaleString('tr-TR') : '0'}</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. EN ÜSTTE İSTENEN GEÇMİŞ LİSTESİ */}
        <div>
          <div className="flex justify-between items-end mb-4 px-2">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-500"/> 
              Malzeme Giriş Geçmişi
            </h3>
            <button onClick={urunGecmisiniSifirla} className="text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg hover:bg-amber-100 flex items-center gap-1.5 transition-colors" title="Geçmişi Sıfırla">
              <RefreshCcw size={12} /> Temizle
            </button>
          </div>

          <div className="space-y-4">
            {gosterilecekHareketler.map((h, idx) => {
              const miktar = Number(h.miktar) || 0;
              const fiyat = Number(h.fiyat) || 0;
              const toplamTutar = miktar * fiyat;

              return (
                <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden group">
                  
                  {/* Düzenle ve Silme Butonları */}
                  <div className="absolute top-4 right-4 flex gap-1.5">
                    <button onClick={() => hareketDuzenleBaslat(h)} className="p-1.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Bu işlemi düzenle">
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => hareketSil(h.itemId, h.miktar)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Bu işlemi sil">
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Tedarikçi, Tarih ve Varsa Not Bilgisi */}
                  <div className="pr-16 mb-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Tedarikçi / Alınan Yer</p>
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="text-sm font-black text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 flex items-center gap-1.5">
                        <Building2 size={14} /> {h.karsiTaraf}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Calendar size={14} />
                      <span className="text-xs font-bold">{new Date(h.tarih).toLocaleDateString('tr-TR')}</span>
                    </div>
                    
                    {/* EKLENEN ŞIK NOT KUTUSU */}
                    {h.islemNotu && (
                      <div className="mt-3 bg-amber-50 border border-amber-100 p-2.5 rounded-xl flex items-start gap-2">
                        <FileText size={14} className="text-amber-500 mt-0.5 shrink-0" />
                        <p className="text-[11px] font-bold text-amber-700 leading-snug">{h.islemNotu}</p>
                      </div>
                    )}
                  </div>

                  {/* Fiyat ve Toplam Hesaplama Kartı */}
                  <div className="bg-slate-50 rounded-2xl p-4 flex justify-between items-center border border-slate-100">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Miktar x Birim Fiyat</p>
                      <p className="text-sm font-bold text-slate-700">
                        {miktar} {urun.unit} <span className="text-slate-400 font-medium mx-1">x</span> ₺{fiyat.toLocaleString('tr-TR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Toplam Tutar</p>
                      <p className="text-xl font-black text-emerald-600">₺{toplamTutar.toLocaleString('tr-TR')}</p>
                    </div>
                  </div>
                  
                </div>
              );
            })}
            
            {gosterilecekHareketler.length === 0 && (
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center">
                <p className="text-slate-500 font-medium text-sm">Bu ürün için henüz alış kaydı bulunmuyor.</p>
              </div>
            )}
          </div>
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

      {/* GEÇMİŞ İŞLEMİ DÜZENLEME MODALI */}
      {hareketDuzenleModalAcik && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-900">İşlemi Düzenle</h3>
              <button onClick={() => setHareketDuzenleModalAcik(false)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200"><X size={18} /></button>
            </div>

            <form onSubmit={hareketGuncelleKaydet} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">İşlem Tarihi</label>
                <input required type="date" value={editTarih} onChange={(e) => setEditTarih(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold text-slate-800 outline-none focus:border-blue-500 text-sm" />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Miktar</label>
                  <input required type="number" step="any" value={editMiktar} onChange={(e) => setEditMiktar(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold text-slate-800 outline-none focus:border-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">B. Fiyat (₺)</label>
                  <input required type="number" step="0.01" value={editFiyat} onChange={(e) => setEditFiyat(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-bold text-slate-800 outline-none focus:border-blue-500 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ekstra Not / Açıklama</label>
                <input type="text" value={editNot} onChange={(e) => setEditNot(e.target.value)} 
                  placeholder="Opsiyonel..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-medium text-slate-800 outline-none focus:border-blue-500 text-sm" />
              </div>

              <button type="submit" disabled={guncelleniyor} className="w-full mt-4 py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                <CheckCircle2 size={18} /> {guncelleniyor ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}