'use client';

import React, { useState, useRef } from 'react';
import { Upload, Download, Loader2, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { prosesImportPresensiExcel } from '@/app/admin/presensi/actions';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export default function PresensiToolbar({ bulan, tahun }: { bulan: number; tahun: number }) {
  const [loadingImport, setLoadingImport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // --- LOGIKA DOWNLOAD TEMPLATE IMPORT PRESENSI ---
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'No': 1,
        'Nama Pegawai': 'Dr. H. Aryo Wicaksono, M.Si.',
        'NIP': '198001152005011001',
        'Tanggal': '2026-08-03',
        'Hari': 'Monday',
        'Sistem Kerja': 'WFO',
        'Keterangan Cti': '',
        'Cek in': '07:42',
        'Cek out': '18:31',
        'Jam Harus Checkout': '16:12',
        'Jam Masuk': '07:30',
        'Jam Toleransi Masuk': '08:30',
        'Jam Pulang': '16:00',
        'Jam Toleransi Pulang': '17:00',
        'Terlambat': 0,
        'Menit Kerja': 589,
        'Kekurangan Jam Kerja': 0,
        'Jumlah Menit Kekurangan Harian': 0,
        'Persentase Potongan Harian': 0
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Template Presensi ${bulan}-${tahun}`);
    XLSX.writeFile(workbook, `Template_Import_Presensi.xlsx`);
  };

  // --- LOGIKA IMPORT EXCEL ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingImport(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bulan', String(bulan));
      formData.append('tahun', String(tahun));

      // Lempar FormData langsung ke Server Action
      const res = await prosesImportPresensiExcel(formData);
      alert(res.message);
    } catch (err: any) {
      alert(err?.message || 'Gagal memproses file presensi');
    } finally {
      setLoadingImport(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      router.refresh();
    }
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

      {/* BAGIAN KANAN: Tombol Import Presensi */}
      <div className="flex items-center gap-3 w-full xl:w-auto justify-end flex-wrap">
        <button 
          onClick={handleDownloadTemplate} 
          className="text-xs text-[#1a4b8c] hover:underline font-semibold flex items-center gap-1"
        >
          Download Template
        </button>

        <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
        <button 
          onClick={() => fileInputRef.current?.click()} 
          disabled={loadingImport} 
          className="flex items-center gap-2 border border-blue-200 bg-blue-50 hover:bg-blue-100 text-[#1a4b8c] px-4 py-2 rounded-xl text-sm font-semibold transition"
        >
          {loadingImport ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} 
          {loadingImport ? 'Memproses...' : 'Import Data Absen'}
        </button>
      </div>

    </div>
  );
}