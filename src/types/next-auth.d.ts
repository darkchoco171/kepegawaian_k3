import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      nip: string;
      idPegawai: string;
    } & DefaultSession['user'];
  }

  interface User {
    role: string;
    nip: string;
    idPegawai: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    nip?: string;
    idPegawai?: string;
  }
}
