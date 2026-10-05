'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function TukinToolbar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Ambil bulan saat ini sebagai default (YYYY-MM)
  const dateNow = new Date();
  const yyyy = dateNow.getFullYear();
  const mm = String(dateNow.getMonth() + 1).padStart(2, '0');
  const defaultBulan = `${yyyy}-${mm}`;

  const query = searchParams.get('query') || '';
  const rentangBulan = searchParams.get('bulan') || defaultBulan;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateUrl(e.target.value, rentangBulan);
  };

  const handleBulanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateUrl(query, e.target.value);
  };

  const updateUrl = (searchQuery: string, selectedBulan: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (searchQuery) params.set('query', searchQuery);
    else params.delete('query');

    if (selectedBulan) params.set('bulan', selectedBulan);
    else params.delete('bulan');

    params.set('page', '1'); 
    router.replace(`/admin/tukin?${params.toString()}`);
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 border-b border-slate-100">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input 
          type="text" 
          defaultValue={query}
          onChange={handleSearchChange}
          placeholder="Cari nama pegawai..." 
          className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4b8c] w-full md:w-64"
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Periode Tukin:</span>
        <input 
          type="month" 
          defaultValue={rentangBulan}
          onChange={handleBulanChange}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1a4b8c] bg-white"
        />
      </div>
    </div>
  );
}