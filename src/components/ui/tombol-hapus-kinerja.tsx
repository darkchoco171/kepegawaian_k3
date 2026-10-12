'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TombolHapusKinerja({ 
  id, 
  actionFn, 
  tipe 
}: { 
  id: string; 
  actionFn: (id: string) => Promise<any>;
  tipe: 'kinerja' | 'ak';
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleHapus = async () => {
    const confirmMsg = tipe === 'kinerja' 
      ? 'Yakin mau hapus data Kinerja Bulanan ini?' 
      : 'Yakin mau hapus data Angka Kredit ini?';

    if (!window.confirm(confirmMsg)) return;

    setLoading(true);
    const res = await actionFn(id);
    setLoading(false);
    
    if (res?.status === 'error') {
      alert(res.message);
    } else {
      router.refresh();
    }
  };

  return (
    <button 
      onClick={handleHapus} 
      disabled={loading}
      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
      title="Hapus Data"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
    </button>
  );
}