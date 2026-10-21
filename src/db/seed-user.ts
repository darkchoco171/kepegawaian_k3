import { db } from './index';
import { pegawai, users } from './schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function seedUsers() {
  console.log('Sedang membuat akun administrator..');

  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD;
  if (
    !initialPassword ||
    Buffer.byteLength(initialPassword, 'utf8') < 12 ||
    Buffer.byteLength(initialPassword, 'utf8') > 72
  ) {
    console.error('Atur ADMIN_INITIAL_PASSWORD dengan kata sandi sementara 12-72 byte sebelum menjalankan seed.');
    process.exit(1);
  }

  // 1. Cari pegawai yang mau dijadiin admin (Ganti NIP-nya sesuai data dummy lu)
  const targetPegawai = await db.query.pegawai.findFirst({
    where: eq(pegawai.nip, '199506222018011001')
  });

  if (!targetPegawai) {
    console.log('Pegawai tidak ditemukan! Cek lagi NIP-nya.');
    process.exit(1);
  }

  // 2. Hash kata sandi sementara yang disediakan lewat environment.
  const hashedPassword = await bcrypt.hash(initialPassword, 12);

  // 3. Insert ke tabel users
  await db.insert(users).values({
    idPegawai: targetPegawai.id,
    password: hashedPassword,
    role: 'admin',
    isActive: true,
  }).onConflictDoNothing();

  console.log(`Akun administrator berhasil dibuat untuk NIP: ${targetPegawai.nip}`);
  process.exit(0);
}

seedUsers();