'use client';

import { useActionState, useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import { Eye, EyeOff } from 'lucide-react';
import { changePassword, type PasswordChangeState } from '@/app/admin/profil/actions';

const initialState: PasswordChangeState = {};

export default function PasswordChangeForm() {
  const [state, formAction, isPending] = useActionState(changePassword, initialState);
  const [visiblePasswords, setVisiblePasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const togglePasswordVisibility = (field: keyof typeof visiblePasswords) => {
    setVisiblePasswords((current) => ({ ...current, [field]: !current[field] }));
  };

  useEffect(() => {
    if (state.success) {
      void signOut({ callbackUrl: '/login' });
    }
  }, [state.success]);

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Ubah kata sandi</h2>
        <p className="text-sm text-slate-500 mt-1">
          Masukkan kata sandi saat ini untuk mengatur kata sandi baru.
        </p>
      </div>

      {state.error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          Kata sandi berhasil diubah. Mengarahkan Anda ke halaman login…
        </p>
      )}

      <form action={formAction} className="space-y-4 max-w-xl">
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-slate-700 mb-1">
            Kata sandi saat ini
          </label>
          <div className="relative">
            <input
              id="currentPassword"
              name="currentPassword"
              type={visiblePasswords.currentPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              maxLength={72}
              disabled={isPending || state.success}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('currentPassword')}
              aria-label={visiblePasswords.currentPassword ? 'Sembunyikan kata sandi saat ini' : 'Tampilkan kata sandi saat ini'}
              aria-pressed={visiblePasswords.currentPassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800"
            >
              {visiblePasswords.currentPassword
                ? <EyeOff aria-hidden="true" className="h-4 w-4" />
                : <Eye aria-hidden="true" className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-1">
            Kata sandi baru
          </label>
          <div className="relative">
            <input
              id="newPassword"
              name="newPassword"
              type={visiblePasswords.newPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={12}
              maxLength={72}
              disabled={isPending || state.success}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('newPassword')}
              aria-label={visiblePasswords.newPassword ? 'Sembunyikan kata sandi baru' : 'Tampilkan kata sandi baru'}
              aria-pressed={visiblePasswords.newPassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800"
            >
              {visiblePasswords.newPassword
                ? <EyeOff aria-hidden="true" className="h-4 w-4" />
                : <Eye aria-hidden="true" className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1">Minimal 12 karakter.</p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">
            Konfirmasi kata sandi baru
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={visiblePasswords.confirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={12}
              maxLength={72}
              disabled={isPending || state.success}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('confirmPassword')}
              aria-label={visiblePasswords.confirmPassword ? 'Sembunyikan konfirmasi kata sandi' : 'Tampilkan konfirmasi kata sandi'}
              aria-pressed={visiblePasswords.confirmPassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800"
            >
              {visiblePasswords.confirmPassword
                ? <EyeOff aria-hidden="true" className="h-4 w-4" />
                : <Eye aria-hidden="true" className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending || state.success}
          className="rounded-lg bg-[#0b3b7c] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? 'Menyimpan…' : 'Simpan kata sandi baru'}
        </button>
      </form>
    </section>
  );
}
