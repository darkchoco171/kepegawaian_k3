import React from 'react';
import { Gift, Medal, CalendarDays, Award } from 'lucide-react';
import { db } from '@/lib/db';

export default async function WidgetUltahSlks() {
  const dataPegawai = await db.query.pegawai.findMany({
    columns: {
      id: true,
      namaLengkap: true,
      nip: true,
      tglLahir: true,
      tanggalMulaiKerja: true, // Tetap ditarik buat jaga-jaga kalau dibutuhin UI lain
    }
  });

  const today = new Date();
  const currentMonth = today.getMonth(); 
  const currentYear = today.getFullYear();
  const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  // --- LOGIKA 1: FILTER ULTAH BULAN INI (DITAMBAH TANGGAL LENGKAP) ---
  const ultahBulanIni = dataPegawai
    .filter(p => {
      if (!p.tglLahir) return false;
      return new Date(p.tglLahir).getMonth() === currentMonth;
    })
    .map(p => {
      const tgl = new Date(p.tglLahir!);
      const umurNanti = currentYear - tgl.getFullYear();
      const tglLengkap = `${tgl.getDate()} ${namaBulan[tgl.getMonth()]} ${tgl.getFullYear()}`;
      return { ...p, tglInt: tgl.getDate(), umur: umurNanti, tglLengkap };
    })
    .sort((a, b) => a.tglInt - b.tglInt);

  // --- LOGIKA 2: FILTER SLKS BERDASARKAN NIP (Digit ke 9 - 12) ---
  const slksTahunIni = dataPegawai
    .map(p => {
      const cleanNip = p.nip?.replace(/\s/g, '') || '';
      
      // Bypass kalau NIP kurang dari 12 digit (biar gak error)
      if (cleanNip.length < 12) return { ...p, masaKerja: 0, isSlks: false, tahunTmt: 0 };

      // Ambil digit ke-9 s.d 12 (index 8,9,10,11) buat nyari Tahun CPNS
      const tahunTmt = parseInt(cleanNip.substring(8, 12));
      const masaKerja = currentYear - tahunTmt;
      
      const isSlks = masaKerja === 10 || masaKerja === 20 || masaKerja === 30;
      return { ...p, masaKerja, isSlks, tahunTmt };
    })
    .filter(p => p.isSlks)
    .sort((a, b) => b.masaKerja - a.masaKerja); 

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      
      {/* WIDGET ULANG TAHUN */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#1a4b8c] flex items-center justify-center shadow-inner">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Ulang Tahun Bulan Ini</h3>
              <p className="text-[10px] text-slate-500 font-medium">Periode: {namaBulan[currentMonth]} {currentYear}</p>
            </div>
          </div>
          <span className="bg-[#1a4b8c] text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
            {ultahBulanIni.length} Pegawai
          </span>
        </div>
        
        <div className="p-2 flex-1 overflow-y-auto max-h-[300px]">
          {ultahBulanIni.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
              <Gift className="w-8 h-8 opacity-20 mb-2" />
              <p className="text-xs">Tidak ada yang berulang tahun bulan ini.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {ultahBulanIni.map((p, idx) => (
                <li key={idx} className="p-3 hover:bg-slate-50 transition rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-xs border border-slate-200">
                      {p.tglInt}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{p.namaLengkap}</p>
                      {/* Tanggal ultah lengkap muncul di sini */}
                      <p className="text-[10px] text-slate-500">{p.tglLengkap} • NIP. {p.nip}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 block">Ke-</span>
                    <span className="text-lg font-extrabold text-[#1a4b8c] leading-none">{p.umur}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* WIDGET SLKS (NIP BASED) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-inner">
              <Medal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Kandidat Penerima SLKS</h3>
              <p className="text-[10px] text-slate-500 font-medium">Tahun {currentYear} (10, 20, 30 Tahun)</p>
            </div>
          </div>
          <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
            {slksTahunIni.length} Pegawai
          </span>
        </div>
        
        <div className="p-2 flex-1 overflow-y-auto max-h-[300px]">
          {slksTahunIni.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
              <Award className="w-8 h-8 opacity-20 mb-2" />
              <p className="text-xs">Belum ada kandidat SLKS tahun ini.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {slksTahunIni.map((p, idx) => {
                const badgeColor = 
                  p.masaKerja === 30 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                  p.masaKerja === 20 ? 'bg-slate-200 text-slate-700 border-slate-300' : 
                  'bg-orange-100 text-orange-800 border-orange-200';

                return (
                  <li key={idx} className="p-3 hover:bg-slate-50 transition rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border shadow-sm ${badgeColor}`}>
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 truncate max-w-[200px]">{p.namaLengkap}</p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          {/* Menampilkan TMT yang diambil dari digit NIP */}
                          <CalendarDays className="w-3 h-3" /> TMT CPNS: {p.tahunTmt}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Masa Kerja</span>
                      <span className="text-sm font-extrabold text-slate-800">{p.masaKerja} Tahun</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

    </div>
  );
}