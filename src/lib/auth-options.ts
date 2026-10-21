import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { users, pegawai } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'NIP',
      credentials: {
        nip: { label: 'NIP', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.nip || !credentials?.password) {
          throw new Error('NIP dan Password harus diisi!');
        }

        const result = await db
          .select({
            userId: users.id,
            idPegawai: users.idPegawai,
            password: users.password,
            role: users.role,
            isActive: users.isActive,
            nip: pegawai.nip,
            namaLengkap: pegawai.namaLengkap,
          })
          .from(users)
          .innerJoin(pegawai, eq(users.idPegawai, pegawai.id))
          .where(eq(pegawai.nip, credentials.nip))
          .limit(1);

        const user = result[0];

        if (!user) throw new Error('Akun dengan NIP tersebut tidak ditemukan!');
        if (!user.isActive) throw new Error('Akun Anda sedang dinonaktifkan!');

        const isMatch = await bcrypt.compare(credentials.password, user.password);
        if (!isMatch) throw new Error('Password salah!');

        return {
          id: user.userId,
          name: user.namaLengkap,
          nip: user.nip,
          role: user.role,
          idPegawai: user.idPegawai,
        };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.nip = user.nip;
        token.idPegawai = user.idPegawai;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = token.role ?? '';
        session.user.nip = token.nip ?? '';
        session.user.idPegawai = token.idPegawai ?? '';
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};
