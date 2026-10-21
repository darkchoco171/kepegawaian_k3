'use server';

import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { eq } from 'drizzle-orm';
import { users } from '@/db/schema';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth-options';
import { validatePasswordChange } from '@/lib/auth/password-policy';

export type PasswordChangeState = {
  error?: string;
  success?: boolean;
};

export async function changePassword(
  _previousState: PasswordChangeState,
  formData: FormData,
): Promise<PasswordChangeState> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: 'Sesi login tidak ditemukan. Silakan login kembali.' };
  }

  const currentPassword = formData.get('currentPassword');
  const newPassword = formData.get('newPassword');
  const confirmPassword = formData.get('confirmPassword');

  if (
    typeof currentPassword !== 'string' ||
    typeof newPassword !== 'string' ||
    typeof confirmPassword !== 'string' ||
    !currentPassword ||
    !newPassword ||
    !confirmPassword
  ) {
    return { error: 'Semua kolom kata sandi wajib diisi.' };
  }

  const validationError = validatePasswordChange(
    currentPassword,
    newPassword,
    confirmPassword,
  );
  if (validationError) {
    return { error: validationError };
  }

  const result = await db
    .select({
      password: users.password,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  const user = result[0];
  if (!user || !user.isActive) {
    return { error: 'Akun tidak ditemukan atau sudah dinonaktifkan.' };
  }

  const currentPasswordMatches = await bcrypt.compare(currentPassword, user.password);
  if (!currentPasswordMatches) {
    return { error: 'Kata sandi saat ini salah.' };
  }

  const sameAsCurrent = await bcrypt.compare(newPassword, user.password);
  if (sameAsCurrent) {
    return { error: 'Kata sandi baru harus berbeda dari kata sandi saat ini.' };
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db
    .update(users)
    .set({
      password: passwordHash,
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.user.id));

  return { success: true };
}
