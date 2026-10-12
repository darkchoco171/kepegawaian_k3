'use client';

import React, { useState } from 'react';
import { Calculator, Download, Loader2, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { kalkulasiTukinMassal } from '@/app/admin/tukin/actions';
import { getExportDataTukin } from '@/app/admin/tukin/excel-actions';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export default function TukinToolbar({ bulan, tahun }: { bulan: number; tahun: number }) {
  const [loadingKalkulasi, setLoadingKalkulasi] = useState(false);
  const [loadingExport, setLoadingExport] = useState(false);
  
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const handleKalkulasi = async () => {
    setLoadingKalkulasi(true);
    const res = await kalkulasiTukinMassal(bulan, tahun);
    setLoadingKalkulasi(false);
    alert(res.message);
    router.refresh();
  };

  const handleExport = async () => {
    setLoadingExport(true);
    
    // Panggil fungsi export yang sekarang mengembalikan base64 string
    const base64Data = await getExportDataTukin(bulan, tahun);
    
    if (!base64Data) {
      alert('Data kosong, belum ada yang bisa di-export!');
      setLoadingExport(false);
      return;
    }

    // Ubah base64 string jadi Blob / File Excel di sisi client
    const workbook = XLSX.read(base64Data, { type: 'base64' });
    XLSX.writeFile(workbook, `Rekap_Tukin_${bulan}_${tahun}.xlsx`);
    
    setLoadingExport(false);
  };

  return (
    <div className="p-4 border-b border-slate-200 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white">
      
      {/* BAGIAN KIRI: Kolom Search & Filter Periode */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari nama pegawai..." 
            defaultValue={searchParams.get('query')?.toString()}
            onChange={(e) => {
              const params = new URLSearchParams(searchParams);
              if (e.target.value) {
                params.set('query', e.target.value);
              } else {
                params.delete('query');
              }
              router.replace(`${pathname}?${params.toString()}`);
            }}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4b8c]"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Periode:</span>
          <div className="relative w-full sm:w-auto">
            <input 
              type="month" 
              defaultValue={`${tahun}-${String(bulan).padStart(2, '0')}`}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams);
                params.set('bulan', e.target.value);
                router.replace(`${pathname}?${params.toString()}`);
              }}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4b8c]"
            />
          </div>
        </div>
      </div>

      {/* BAGIAN KANAN: Tombol-tombol Aksi Massal */}
      <div className="flex items-center gap-2 w-full xl:w-auto justify-end flex-wrap">
        <button onClick={handleExport} disabled={loadingExport} className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold transition">
          {loadingExport ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Export
        </button>

        <button onClick={handleKalkulasi} disabled={loadingKalkulasi} className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow-sm">
          {loadingKalkulasi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
          Kalkulasi Tukin
        </button>
      </div>

    </div>
  );
}