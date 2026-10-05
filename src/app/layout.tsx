// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIMPEG Kelembagaan K3 | Kementerian Ketenagakerjaan",
  description: "Sistem Informasi Kepegawaian Kelembagaan K3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased bg-[#eef3fa] text-[#0b1c33]">
        {children}
      </body>
    </html>
  );
}