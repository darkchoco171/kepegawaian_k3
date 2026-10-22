'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function Pagination({
  totalPages,
  currentPage,
  totalData,
  totalLabel = 'data',
}: {
  totalPages: number;
  currentPage: number;
  totalData: number;
  totalLabel?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const changePage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500">
      <p>Menampilkan halaman {currentPage} dari {totalPages} (Total {totalData} {totalLabel})</p>
      <div className="flex items-center gap-1">
        <button
          disabled={currentPage <= 1}
          onClick={() => changePage(currentPage - 1)}
          className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 disabled:text-slate-300 disabled:cursor-not-allowed transition"
        >
          Sebelumnya
        </button>
        <span className="px-4 py-2 border border-[#1a4b8c] rounded-lg bg-[#1a4b8c] text-white font-bold">
          {currentPage}
        </span>
        <button
          disabled={currentPage >= totalPages}
          onClick={() => changePage(currentPage + 1)}
          className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 disabled:text-slate-300 disabled:cursor-not-allowed transition"
        >
          Selanjutnya
        </button>
      </div>
    </div>
  );
}