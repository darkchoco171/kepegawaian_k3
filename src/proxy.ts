// src/middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Kalau udah login tapi mau akses halaman /login lagi, tendang ke dashboard
    if (req.nextUrl.pathname === "/login") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      // Security cek: Boleh masuk gak?
      authorized: ({ req, token }) => {
        // Kalau nyoba masuk folder /admin tapi tokennya ga ada (belum login) -> Tolak!
        if (req.nextUrl.pathname.startsWith("/admin") && token === null) {
          return false;
        }
        return true;
      },
    },
    pages: {
      signIn: "/login", // Kalau ditolak, lempar ke sini
    },
  }
);

// Middleware ini disuruh jaga area mana aja?
export const config = {
  matcher: ["/admin/:path*", "/login"],
};