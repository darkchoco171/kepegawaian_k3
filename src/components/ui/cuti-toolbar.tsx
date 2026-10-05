'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CutiToolbar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const query = searchParams.get('query') || '';
  const jenis = searchParams.get('jenis') || '';

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateUrl(e.target.value, jenis);
  };

  const handleJenisChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateUrl(query, e.target.value);
  };

  const updateUrl = (searchQuery: string, selectedJenis: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (searchQuery) params.set('query', searchQuery);
    else params.delete('query');

    if (selectedJenis) params.set('jenis', selectedJenis);
    else params.delete('jenis');

    params.set('page', '1');
    router.replace(`/admin/cuti?${params.toString()}`);
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
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jenis Cuti:</span>
        <select 
          defaultValue={jenis}
          onChange={handleJenisChange}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1a4b8c] bg-white"
        >
          <option value="">Semua Jenis Cuti</option>
          <option value="Tahunan">Tahunan</option>
          <option value="Sakit">Sakit</option>
          <option value="Besar">Besar</option>
          <option value="Melahirkan">Melahirkan</option>
          <option value="Alasan Penting">Alasan Penting</option>
        </select>
      </div>
    </div>
  );
}