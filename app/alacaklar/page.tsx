"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Users, Phone, X, CheckCircle2, Home } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AlacaklarPage() {
  const [musteriler, setMusteriler] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Müşteri Ekleme Modal State
  const [modalAcik, setModalAcik] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', balance: '' });
  const [kaydediliyor, setKaydediliyor] = useState(false);

  useEffect(() => {
    fetchMusteriler();
  }, []);

  const fetchMusteriler = async () => {
    setLoading(true);
    const { data } = await supabase.from('contacts').select('*').eq('type', 'musteri').order('name');
    if (data) setMusteriler(data);
    setLoading(false);
  };

  const musteriKaydet = async (e: any) => {
    e.preventDefault();
    setKaydediliyor(true);
    try {
      await supabase.from('contacts').insert([{
        name: form.name,
        phone: form.phone,
        type: 'musteri',
        balance: Number(form.balance) || 0
      }]);
      setForm({ name: '', phone: '', balance: '' });
      setModalAcik(false);
      fetchMusteriler();
    } catch (error: any) {
      alert("Hata oluştu: " + error.message);
    } finally {
      setKaydediliyor(false);
    }
  };

  const musteriSil = async (e: any, id: string, isim: string) => {
    e.stopPropagation();
    const onay = window.confirm(`${isim} isimli müşteriyi silmek istediğinize emin misiniz?`);
    if (!onay) return;

    try {
      await supabase.from('contacts').delete().eq('id', id);
      fetchMusteriler();
    } catch (error: any) {
      alert("Silme hatası: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-28 font-sans selection:bg-emerald-100 flex flex-col items-center">
      
      {/* ÜST HEADER */}
      <header className="w-full max-w-md bg-white/80 backdrop-blur-md px-6 py-4 border-b border-slate-200/60 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/" className="w-10 h-10 bg-slate-50 border border-slate-200/60 rounded-2xl flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors" title="Listeye Dön">
            <ArrowLeft size={20} />
          </Link>
          <Link href="/" className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-colors" title="Ana Sayfaya Dön">
            <Home size={20} />
          </Link>
          <div className="ml-1">
            <h1 className="text-lg font-black tracking-tight text-slate-900 leading-none">Alacaklı Defteri</h1>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">Müşteri Borç Takibi</p>
          </div>
        </div>
        <button onClick={() => setModalAcik(true)} className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center hover:bg-emerald-100 transition-colors shadow-sm active:scale-95">
          <Plus size={22} />
        </button>
      </header>

      <main className="w-full max-w-md p-5 space-y-3">
        
        {/* MÜŞTERİ LİSTESİ */}
        {loading ? (
          <div className="text-center text-slate-400 py-12 font-medium">Müşteriler yükleniyor...</div>
        ) : musteriler.length === 0 ? (
          <div className="text-center py-12 px-6 bg-white rounded-3xl border border-slate-200/60 shadow-sm space-y-3">
            <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
              <Users size={24} />
            </div>
            <p className="text-slate-600 font-bold text-sm">Kayıtlı müşteri bulunmuyor.</p>
            <p className="text-slate-400 text-xs">Sağ üstteki + butonunu kullanarak hemen yeni bir müşteri ekleyebilirsiniz.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {musteriler.map((m) => (
              <div 
                key={m.id} 
                onClick={() => router.push(`/cari/${m.id}`)} 
                className="bg-white p-4.5 rounded-3xl shadow-sm border border-slate-200/80 flex justify-between items-center group hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer active:scale-[0.98]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-amber-50 text-amber-600 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors shrink-0">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-base">{m.name}</h3>
                    <p className="text-xs font-medium text-slate-400 mt-0.5 flex items-center gap-1">
                      <Phone size={12} /> {m.phone || 'Telefon yok'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className={`font-black text-lg ${m.balance > 0 ? 'text-red-500' : 'text-slate-800'}`}>
                      ₺{(m.balance || 0).toLocaleString('tr-TR')}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Borç</p>
                  </div>

                  {/* SİLME BUTONU */}
                  <button 
                    onClick={(e) => musteriSil(e, m.id, m.name)}
                    className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors"
                    title="Müşteriyi Sil"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* YENİ MÜŞTERİ EKLEME MODALI */}
      {modalAcik && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-900">Yeni Müşteri Ekle</h3>
              <button onClick={() => setModalAcik(false)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={musteriKaydet} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Müşteri Adı Soyadı</label>
                <input required type="text" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 outline-none font-bold text-slate-800 focus:border-emerald-500" placeholder="Örn: Ahmet Yılmaz" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Telefon Numarası</label>
                <input type="text" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 outline-none font-medium text-slate-800 focus:border-emerald-500" placeholder="0532..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Başlangıç Borcu (₺)</label>
                <input type="number" step="0.01" value={form.balance} onChange={(e) => setForm({...form, balance: e.target.value})} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 outline-none font-bold text-slate-800 focus:border-emerald-500" placeholder="0.00" />
              </div>

              <button type="submit" disabled={kaydediliyor} 
                className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-500/25 transition-all active:scale-95">
                {kaydediliyor ? 'Kaydediliyor...' : 'Müşteriyi Kaydet'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}