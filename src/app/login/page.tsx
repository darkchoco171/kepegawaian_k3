"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [nip, setNip] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    const res = await signIn("credentials", {
      nip: nip.replace(/\s/g, ''),
      password,
      redirect: false,
    });

    if (res?.error) {
      setErrorMsg(res.error);
      setIsLoading(false);
    } else {
      router.push("/admin/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      {/* ================= PANEL KIRI (BIRU) ================= */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative bg-[#0b3b7c] flex-col justify-between p-12 overflow-hidden"
        style={{
          // Bikin efek grid tipis di background biru
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      >
        {/* Ornamen Bintang Gede di Kanan Bawah */}
        <div className="absolute -bottom-20 -right-20 opacity-10 pointer-events-none">
          <Shield size={600} strokeWidth={1} />
        </div>

        {/* Header Kiri */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
            <Shield className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm tracking-widest">SIMPEG Kelembagaan K3</h1>
            <p className="text-blue-200 text-[10px]">Kementerian Ketenagakerjaan Republik Indonesia</p>
          </div>
        </div>

        {/* Konten Tengah (Agak ke tengah sesuai request) */}
        <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto relative z-10 w-full">
          <p className="text-orange-400 text-xs font-bold tracking-[0.2em] mb-4">
            SISTEM INFORMASI MANAJEMEN KEPEGAWAIAN
          </p>
          <h2 className="text-white text-5xl font-extrabold leading-[1.1] mb-6">
            Direktorat Kelembagaan Keselamatan dan Kesehatan Kerja
          </h2>
          <p className="text-blue-100 text-sm leading-relaxed mb-12 max-w-md">
            Pengelolaan data pegawai, presensi, tunjangan kinerja, dan administrasi cuti dalam satu panel terpadu.
          </p>

          {/* Cards Statistik Bawah */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/10 border border-white/20 p-4 rounded-xl">
              <p className="text-white font-bold text-sm mb-1">Pegawai</p>
              <p className="text-blue-200 text-xs">Riil</p>
            </div>
            <div className="bg-white/10 border border-white/20 p-4 rounded-xl">
              <p className="text-white font-bold text-sm mb-1">Presensi</p>
              <p className="text-blue-200 text-xs">Harian</p>
            </div>
            <div className="bg-white/10 border border-white/20 p-4 rounded-xl">
              <p className="text-white font-bold text-sm mb-1">TUKIN</p>
              <p className="text-blue-200 text-xs">Terintegrasi presensi</p>
            </div>
          </div>
        </div>

        {/* Footer Kiri */}
        <div className="relative z-10">
          <p className="text-blue-300 text-[11px]">Jl. Jend. Gatot Subroto Kav. 51, Jakarta Selatan 12950</p>
        </div>
      </div>

      {/* ================= PANEL KANAN (FORM LOGIN) ================= */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 lg:p-12">
        <div className="w-full max-w-[400px]">
          
          <div className="mb-10">
            <p className="text-blue-600 font-bold text-[10px] tracking-widest uppercase mb-3">Panel Administrator</p>
            <h2 className="text-slate-800 text-3xl font-extrabold mb-2">Masuk ke akun Anda</h2>
            <p className="text-slate-500 text-sm">Gunakan NIP dan kata sandi yang terdaftar.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-200">
                {errorMsg}
              </div>
            )}

            {/* Input NIP */}
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-2">NIP</label>
              <input name="nip"
                type="text"
                value={nip}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 18) setNip(val);
                }}
                placeholder="18 digit NIP"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                required
              />
              <div className="text-slate-400 text-[10px] text-right mt-1 font-medium">
                {nip.length}/18 digit
              </div>
            </div>

            {/* Input Password */}
            <div>
              <label className="block text-slate-700 text-xs font-bold mb-2">Kata sandi</label>
              <div className="relative">
                <input name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition pr-16"
                  required/>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 text-xs font-bold hover:text-blue-800"
                >
                  {showPassword ? "Tutup" : "Lihat"}
                </button>
              </div>
            </div>

            {/* Tombol Masuk */}
            <button
              type="submit"
              disabled={isLoading || nip.length < 18}
              className="w-full bg-[#0b3b7c] hover:bg-blue-900 text-white font-bold py-3 rounded-lg text-sm transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed mt-2">
              {isLoading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-slate-400 text-[10px]">
              © 2026 SIMPEG K3 - Kementerian Ketenagakerjaan Republik Indonesia
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}