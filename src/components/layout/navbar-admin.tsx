'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, ShieldCheck, X } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

const navLinks = [
  { name: 'Dasbor', href: '/admin/dashboard' },
  { name: 'Data Pegawai', href: '/admin/pegawai' },
  { name: 'Manajemen Kinerja', href: '/admin/manajemen-kinerja' },
  { name: 'Presensi', href: '/admin/presensi' },
  { name: 'Tunjangan Kinerja', href: '/admin/tukin' },
  { name: 'Manajemen Cuti', href: '/admin/cuti' },
];

export default function NavbarAdmin() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 py-3 flex items-center justify-between gap-2">
        <Link href="/admin/dashboard" className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="w-10 h-10 bg-[#1a4b8c] text-white rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="max-w-[130px] truncate font-bold text-[#1a4b8c] leading-tight text-sm sm:max-w-none">
              SIMPEG K3 — Panel Administrator
            </h1>
            <p className="hidden text-[10px] text-slate-500 md:block">
              Direktorat Kelembagaan Keselamatan dan Kesehatan Kerja
            </p>
          </div>
        </Link>

        <nav aria-label="Navigasi utama" className="hidden 2xl:flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.name}
                href={link.href}
                aria-current={isActive ? 'page' : undefined}
                className={`px-3 2xl:px-4 py-2 text-xs 2xl:text-sm font-semibold rounded-md transition-all duration-200 ${
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

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link href="/admin/profil" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 group">
            <div className="text-right hidden 2xl:block">
              <p className="text-sm font-bold text-slate-800 group-hover:text-[#1a4b8c] transition">Raffi Wahyu Kusuma</p>
              <p className="text-[10px] text-slate-500">Administrator Kepegawaian</p>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#1a4b8c] text-white rounded-full flex items-center justify-center font-bold shadow-sm group-hover:bg-[#123666] transition">
              R
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
            aria-label={isMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            aria-expanded={isMenuOpen}
            aria-controls="admin-mobile-navigation"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50 2xl:hidden"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-2 rounded-lg bg-red-50 px-2.5 py-2 text-sm font-semibold text-red-600 transition hover:text-red-700 sm:px-3"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>

      <nav
        id="admin-mobile-navigation"
        aria-label="Navigasi utama"
        className={`${isMenuOpen ? 'block' : 'hidden'} border-t border-slate-200 bg-white px-3 py-3 shadow-lg 2xl:hidden sm:px-6`}
      >
        <div className="mx-auto flex max-w-[1600px] flex-col gap-1">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                aria-current={isActive ? 'page' : undefined}
                className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-blue-50 text-[#1a4b8c]'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}