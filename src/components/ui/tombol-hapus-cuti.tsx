'use client';

import { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { hapusCuti } from '@/app/admin/cuti/actions';

export default function TombolHapusCuti({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleHapus = async () => {
    if (!window.confirm('Hapus pengajuan ini? Saldo cuti akan dikembalikan dan presensi terkait akan dihapus.')) {
      return;
    }

    setLoading(true);
    try {
      const result = await hapusCuti(id);
      window.alert(result.message);
      if (result.success) router.refresh();
    } catch (error) {
      console.error('Gagal menghapus pengajuan cuti:', error);
      window.alert('Terjadi kesalahan saat menghapus pengajuan cuti.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleHapus}
      disabled={loading}
      className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
      title="Hapus pengajuan cuti"
      aria-label="Hapus pengajuan cuti"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
    </button>
  );
}
