import React from 'react';
import NavbarAdmin from '@/components/layout/navbar-admin';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f4f7fa] text-slate-800 font-sans pb-12">
      {/* Navbar akan nempel terus di atas */}
      <NavbarAdmin />
      
      {/* Isi halaman (dashboard, pegawai, dll) akan dirender di sini */}
      <main className="max-w-[1400px] mx-auto px-6 mt-6">
        {children}
      </main>
    </div>
  );
}