'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';

export default function NavbarAdmin() {
  const pathname = usePathname();

  const navLinks = [
    { name: 'Dasbor', href: '/admin/dashboard' },
    { name: 'Data Pegawai', href: '/admin/pegawai' },
    { name: 'Presensi', href: '/admin/presensi' },
    { name: 'Tunjangan Kinerja', href: '/admin/tukin' },
    { name: 'Manajemen Cuti', href: '/admin/cuti' },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo & Judul */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1a4b8c] text-white rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-[#1a4b8c] leading-tight text-sm">SIMPEG K3 — Panel Administrator</h1>
            <p className="text-[10px] text-slate-500">Bina Kelembagaan Keselamatan dan Kesehatan Kerja</p>
          </div>
        </div>

        {/* Menu Navigasi Tengah */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link 
                key={link.name} 
                href={link.href}
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${
                  isActive 
                    ? 'bg-white text-[#1a4b8c] shadow-sm border border-slate-200/50' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Profil Kanan */}
        <Link href="/admin/profil" className="flex items-center gap-3 group cursor-pointer">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-800 group-hover:text-[#1a4b8c] transition">Raffi Wahyu Kusuma</p>
            <p className="text-[10px] text-slate-500">Administrator Kepegawaian</p>
          </div>
          <div className="w-10 h-10 bg-[#1a4b8c] text-white rounded-full flex items-center justify-center font-bold shadow-sm group-hover:bg-[#123666] transition">
            R
          </div>
        </Link>
      </div>
    </header>
  );
}