export function validatePasswordChange(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): string | null {
  if (Buffer.byteLength(currentPassword, 'utf8') > 72) {
    return 'Kata sandi saat ini tidak valid.';
  }

  const newPasswordBytes = Buffer.byteLength(newPassword, 'utf8');
  if (newPassword.length < 12 || newPasswordBytes > 72) {
    return 'Kata sandi baru harus terdiri dari minimal 12 karakter dan maksimal 72 byte.';
  }

  if (newPassword !== confirmPassword) {
    return 'Konfirmasi kata sandi baru tidak cocok.';
  }

  return null;
}
