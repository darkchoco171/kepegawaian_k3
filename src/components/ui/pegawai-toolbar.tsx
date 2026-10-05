'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import ModalTambahPegawai from '@/components/ui/modal-tambah-pegawai';

const DAFTAR_TIM = [
    "Akreditasi dan Pengembangan Kelembagaan K3 Bidang Kesehatan Kerja",
    "Akreditasi dan Pengembangan Kelembagaan K3 Bidang Teknik Kesehatan Kerja",
    "Evaluasi dan Pengembangan Manajemen Kelembagaan K3 Bidang Pembinaan Kesehatan Kerja",
    "Sistem Manajemen Mutu K3",
    "Akreditasi dan Standardisasi Lembaga Audit Sistem Manajemen Mutu K3",
    "Evaluasi Audit Sistem Manajemen Mutu K3",
    "Akreditasi dan Pengembangan Kelembagaan K3 Bidang Keselamatan Kerja",
    "Akreditasi dan Pengembangan Kelembagaan K3 Bidang Teknik Keselamatan Kerja",
    "Akreditasi dan Pengembangan Kelembagaan K3 Bidang Pembinaan Keselamatan Kerja",
    "Standardisasi dan Pengembangan Personel K3",
    "Standardisasi, Evaluasi dan Pengembangan Personel K3 Bidang Mekanik",
    "Standardisasi, Evaluasi, dan Pengembangan Personel K3 Bidang Teknik dan Lingkungan Kerja",
    "Dit. Wasuji",
    "Dit. Sistem",
    "Dit. Sesditjen Binwasnaker",
    "Tata Usaha"
    ];

export default function PegawaiToolbar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const query = searchParams.get('query') || '';
  const tim = searchParams.get('tim') || '';

  // Fungsi yang jalan otomatis tiap kali ada huruf yang diketik atau dihapus
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchQuery = e.target.value;
    updateUrl(searchQuery, tim);
  };

  // Fungsi saat dropdown sub bagian diganti
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTim = e.target.value;
    updateUrl(query, selectedTim);
  };

  // Helper buat update parameter URL secara instan
  const updateUrl = (searchQuery: string, selectedTim: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (searchQuery) {
      params.set('query', searchQuery);
    } else {
      params.delete('query');
    }

    if (selectedTim) {
      params.set('tim', selectedTim);
    } else {
      params.delete('tim');
    }

    params.set('page', '1'); // Reset ke halaman 1
    router.replace(`/admin/pegawai?${params.toString()}`); // Pakai replace biar history browser nggak penuh
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Data Pegawai</h2>
        <p className="text-sm text-slate-500 mt-1">Kelola data pegawai Biro Kelembagaan Keselamatan dan Kesehatan Kerja</p>
      </div>
      
      <div className="flex flex-wrap items-center gap-3">
        {/* Input Search Live (Tanpa perlu form submit) */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            defaultValue={query}
            onChange={handleSearchChange}
            placeholder="Cari nama atau NIP..." 
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4b8c] focus:border-transparent w-full md:w-56"
          />
        </div>

        {/* Dropdown Filter Sub Bagian */}
        <select 
          defaultValue={tim}
          onChange={handleFilterChange}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1a4b8c] w-full md:w-72 truncate"
        >
          <option value="">Semua Sub Bagian</option>
          {DAFTAR_TIM.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        {/* Tombol Tambah Pegawai */}
        <ModalTambahPegawai />
      </div>
    </div>
  );
}