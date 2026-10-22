'use client';

import { Search } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export default function KinerjaToolbar({ currentBulan }: { currentBulan: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateFilter = (key: 'query' | 'bulan', value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="p-4 border-b border-slate-200 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white">
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama pegawai..."
            defaultValue={searchParams.get('query') ?? ''}
            onChange={(event) => updateFilter('query', event.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4b8c]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Periode:</span>
          <input
            type="month"
            value={currentBulan}
            onChange={(event) => updateFilter('bulan', event.target.value)}
            className="w-full sm:w-auto px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4b8c]"
          />
        </div>
      </div>
    </div>
  );
}