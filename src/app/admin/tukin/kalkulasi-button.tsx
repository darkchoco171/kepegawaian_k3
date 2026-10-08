// src/app/admin/tukin/kalkulasi-button.tsx
'use client';

import { useState } from 'react';
import { Calculator, Loader2 } from 'lucide-react';
import { kalkulasiTukinMassal } from './actions';

export default function KalkulasiButton({ bulan, tahun }: { bulan: number; tahun: number }) {
  const [loading, setLoading] = useState(false);

  const handleKalkulasi = async () => {
    setLoading(true);
    const res = await kalkulasiTukinMassal(bulan, tahun);
    setLoading(false);
    
    // Lu bisa ganti alert ini pakai toast (sonner / react-hot-toast) kalau lu pakai di project lu
    if (res.status === 'success') {
      alert(res.message); 
    } else {
      alert(`Gagal: ${res.message}`);
    }
  };

  return (
    <button 
      onClick={handleKalkulasi}
      disabled={loading}
      className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Calculator className="w-4 h-4" />
      )}
      {loading ? 'Menghitung...' : 'Kalkulasi Tukin'}
    </button>
  );
}