import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users, pegawai } from "@/db/schema";
import { eq } from "drizzle-orm";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "NIP",
      credentials: {
        nip: { label: "NIP", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.nip || !credentials?.password) {
          throw new Error("NIP dan Password harus diisi!");
        }

        // Cari relasi data User & Pegawai berdasarkan NIP
        const result = await db
          .select({
            userId: users.id,
            idPegawai: users.idPegawai,
            password: users.password,
            role: users.role,
            isActive: users.isActive,
            nip: pegawai.nip,
            namaLengkap: pegawai.namaLengkap
          })
          .from(users)
          .innerJoin(pegawai, eq(users.idPegawai, pegawai.id))
          .where(eq(pegawai.nip, credentials.nip))
          .limit(1);

        const user = result[0];

        if (!user) throw new Error("Akun dengan NIP tersebut tidak ditemukan!");
        if (!user.isActive) throw new Error("Akun Anda sedang dinonaktifkan!");

        // Cocokin password dari input form sama hash di tabel users
        const isMatch = await bcrypt.compare(credentials.password, user.password);
        if (!isMatch) throw new Error("Password salah!");

        // Kembalikan data buat disimpan di session cookie
        return {
          id: user.userId,
          name: user.namaLengkap,
          nip: user.nip,
          role: user.role,
          idPegawai: user.idPegawai
        };
      }
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const authUser = user as typeof user & {
          role: string;
          nip: string;
          idPegawai: number;
        };
        token.role = authUser.role;
        token.nip = authUser.nip;
        token.idPegawai = authUser.idPegawai;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          role: token.role,
          nip: token.nip,
          idPegawai: token.idPegawai
        } as NonNullable<typeof session.user> & {
          role: typeof token.role;
          nip: typeof token.nip;
          idPegawai: typeof token.idPegawai;
        };
      }
      return session;
    }
  },
  pages: {
    signIn: '/login', // Nanti halaman form login lu taruh di sini
  }
});

export { handler as GET, handler as POST };