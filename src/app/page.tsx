import { redirect } from 'next/navigation';

export default function AdminIndexPage() {
  // Langsung lempar ke halaman dasbor
  redirect('/admin/dashboard');
}