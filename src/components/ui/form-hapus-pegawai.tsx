'use client';

import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { hapusPegawaiData } from '@/app/admin/pegawai/actions';

export default function FormHapusPegawai({ id, nama }: { id: string, nama: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Konfirmasi ganda biar aman dari salah pencet
    const konfirmasi = window.confirm(`Yakin ingin menghapus data pegawai "${nama}"? Data yang dihapus tidak bisa dikembalikan.`);
    if (!konfirmasi) return;

    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    await hapusPegawaiData(formData);
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleDelete} className="inline-block">
      <input type="hidden" name="id" value={id} />
      <button 
        type="submit" 
        disabled={isLoading}
        className="inline-flex items-center gap-1 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 border border-red-200 px-3 py-1.5 rounded text-xs font-semibold transition disabled:opacity-50"
        title="Hapus Pegawai"
      >
        <Trash2 className="w-3.5 h-3.5" /> {isLoading ? 'Menghapus...' : 'Hapus'}
      </button>
    </form>
  );
}