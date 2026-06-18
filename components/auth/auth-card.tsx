"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FiEye, FiEyeOff, FiShield } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { PublicUserRole } from "@/lib/types";

export function LoginCard() {
  const router = useRouter();
  const params = useSearchParams();
  const { login, signInWithGoogle, isSupabaseConnected, resendVerificationEmail } = useAuth();
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [loginRole, setLoginRole] = useState<PublicUserRole>("penerima");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError("");
    setLoading(true);
    const result = await login({ email: String(form.get("email") || ""), password: String(form.get("password") || ""), role: loginRole });
    setLoading(false);
    if (!result.ok) { setError(result.error); return; }
    const next = params.get("next");
    router.push(next || result.redirectTo);
  }

  async function resendSignupVerification() {
    const email = params.get("email") || "";
    setError("");
    setNotice("");
    setLoading(true);
    const result = await resendVerificationEmail(email);
    setLoading(false);
    if (!result.ok) { setError(result.error); return; }
    setNotice(result.message || "Email verifikasi sudah dikirim ulang.");
  }

  async function continueWithGoogleLogin() {
    setError("");
    setLoading(true);
    const result = await signInWithGoogle(loginRole);
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-[560px] rounded-[2rem] p-6 shadow-soft md:p-10">
      <h2 className="text-3xl font-extrabold text-brand-900 md:text-4xl">Masuk ke Akun Anda</h2>
      <p className="mt-3 text-stone-500">Pilih akses donatur atau penerima saat masuk. Satu email bisa dipakai untuk dua role publik, sedangkan admin tetap lewat login khusus.</p>
      {params.get("registered") === "1" && <div className="mt-4 rounded-2xl bg-brand-50 p-3 text-sm font-bold text-brand-800"><p>Registrasi berhasil. Verifikasi email terlebih dahulu, lalu masuk.</p>{params.get("email") && <button type="button" onClick={resendSignupVerification} disabled={loading || !isSupabaseConnected} className="mt-2 text-brand-900 underline underline-offset-4">Kirim ulang email verifikasi</button>}</div>}
      {params.get("verified") === "1" && <div className="mt-4 rounded-2xl bg-brand-50 p-3 text-sm font-bold text-brand-800">Email berhasil diverifikasi. Silakan login dengan email dan kata sandi Anda.</div>}
      {notice && <p className="mt-3 rounded-2xl bg-blue-50 p-3 text-sm font-bold text-blue-700">{notice}</p>}
      <div className="mt-4 rounded-2xl bg-brand-50 p-3 text-xs font-bold text-brand-800"><FiShield className="mr-2 inline" /> Mode database: {isSupabaseConnected ? "Supabase aktif" : "Demo lokal terintegrasi"}</div>
      <form onSubmit={submit} className="mt-8 space-y-5">
        <div><Label>Login Sebagai</Label><div className="grid grid-cols-2 gap-3">{(["penerima", "donatur"] as PublicUserRole[]).map((item) => <button key={item} type="button" onClick={() => setLoginRole(item)} className={cn("h-12 rounded-2xl border text-sm font-bold capitalize transition", loginRole === item ? "border-brand-700 bg-brand-50 text-brand-800" : "border-stone-200 text-stone-500 hover:bg-stone-50")}>{item}</button>)}</div><p className="mt-2 text-xs text-stone-400">Pilihan ini menentukan dashboard yang dibuka setelah login.</p></div>
        <div><Label>Email</Label><Input name="email" type="email" autoComplete="email" required placeholder="Masukkan email Anda" /></div>
        <div><Label>Kata Sandi</Label><div className="relative"><Input name="password" type={show ? "text" : "password"} autoComplete="current-password" required placeholder="Masukkan kata sandi Anda" className="pr-12" /><button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400" aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}>{show ? <FiEyeOff /> : <FiEye />}</button></div></div>
        <div className="flex justify-end text-sm"><Link href="/forgot-password" className="font-bold text-brand-700">Lupa kata sandi?</Link></div>
        {error && <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
        <Button disabled={loading} className="h-[52px] w-full">{loading ? "Memproses..." : "Masuk"}</Button>
        <div className="flex items-center gap-4 text-sm text-stone-400"><span className="h-px flex-1 bg-stone-200" />atau<span className="h-px flex-1 bg-stone-200" /></div>
        <Button type="button" variant="secondary" className="w-full" onClick={continueWithGoogleLogin} disabled={loading}><img src="/assets/logo-google.jpeg" alt="Google" className="h-5 w-5 rounded-full object-contain" /> Continue with Google</Button>
        <p className="-mt-2 text-center text-xs text-stone-400">Nama akun akan mengikuti Google. Role mengikuti pilihan di atas dan bisa ditautkan sebagai role kedua.</p>
        <p className="text-center text-sm text-stone-500">Belum punya akun? <Link href="/register" className="font-extrabold text-brand-700">Daftar sekarang</Link></p>
        <p className="text-center text-xs text-stone-400">Administrator? <Link href="/admin/login" className="font-extrabold text-brand-700">Buka Login Admin</Link></p>
      </form>
    </Card>
  );
}


export function ForgotPasswordCard() {
  const { requestPasswordReset, isSupabaseConnected } = useAuth();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setMessage("");
    setError("");
    setLoading(true);
    const result = await requestPasswordReset(String(form.get("email") || ""));
    setLoading(false);
    if (!result.ok) { setError(result.error); return; }
    setMessage(result.message || "Link reset kata sandi sudah dikirim.");
  }

  return (
    <Card className="w-full max-w-[520px] rounded-[2rem] p-6 shadow-soft md:p-10">
      <h2 className="text-3xl font-extrabold text-brand-900 md:text-4xl">Lupa Kata Sandi</h2>
      <p className="mt-3 leading-7 text-stone-500">Masukkan email akun Anda. Sistem akan mengirim link reset kata sandi melalui Supabase Auth.</p>
      <div className="mt-4 rounded-2xl bg-brand-50 p-3 text-xs font-bold text-brand-800"><FiShield className="mr-2 inline" /> Mode database: {isSupabaseConnected ? "Supabase aktif" : "Demo lokal"}</div>
      <form onSubmit={submit} className="mt-8 space-y-5">
        <div><Label>Email</Label><Input name="email" type="email" autoComplete="email" required placeholder="contoh@email.com" /></div>
        {message && <p className="rounded-2xl bg-brand-50 p-3 text-sm font-semibold text-brand-700">{message}</p>}
        {error && <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
        <Button disabled={loading} className="h-[52px] w-full">{loading ? "Mengirim link..." : "Kirim Link Reset"}</Button>
        <p className="text-center text-sm text-stone-500"><Link href="/login" className="font-extrabold text-brand-700">Kembali ke login</Link></p>
      </form>
    </Card>
  );
}

export function ResetPasswordCard() {
  const router = useRouter();
  const { updatePassword, isSupabaseConnected } = useAuth();
  const [show, setShow] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    async function prepareRecoverySession() {
      if (!supabase) {
        if (active) {
          setError("Reset kata sandi membutuhkan koneksi Supabase.");
          setReady(true);
        }
        return;
      }
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError && active) setError(exchangeError.message);
      }
      if (active) setReady(true);
    }
    prepareRecoverySession();
    return () => { active = false; };
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") || "");
    const confirm = String(form.get("confirm") || "");
    setMessage("");
    setError("");
    if (password !== confirm) { setError("Konfirmasi kata sandi belum sama."); return; }
    setLoading(true);
    const result = await updatePassword(password);
    setLoading(false);
    if (!result.ok) { setError(result.error); return; }
    setMessage(result.message || "Kata sandi berhasil diperbarui.");
    setTimeout(() => router.replace("/login"), 1200);
  }

  return (
    <Card className="w-full max-w-[520px] rounded-[2rem] p-6 shadow-soft md:p-10">
      <h2 className="text-3xl font-extrabold text-brand-900 md:text-4xl">Reset Kata Sandi</h2>
      <p className="mt-3 leading-7 text-stone-500">Buat kata sandi baru untuk akun DishCon Anda.</p>
      <div className="mt-4 rounded-2xl bg-brand-50 p-3 text-xs font-bold text-brand-800"><FiShield className="mr-2 inline" /> Mode database: {isSupabaseConnected ? "Supabase aktif" : "Demo lokal"}</div>
      <form onSubmit={submit} className="mt-8 space-y-5">
        <div><Label>Kata Sandi Baru</Label><div className="relative"><Input name="password" type={show ? "text" : "password"} minLength={8} required placeholder="Minimal 8 karakter" className="pr-12" /><button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400" aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}>{show ? <FiEyeOff /> : <FiEye />}</button></div></div>
        <div><Label>Konfirmasi Kata Sandi Baru</Label><Input name="confirm" type={show ? "text" : "password"} minLength={8} required placeholder="Ulangi kata sandi baru" /></div>
        {message && <p className="rounded-2xl bg-brand-50 p-3 text-sm font-semibold text-brand-700">{message}</p>}
        {error && <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
        <Button disabled={loading || !ready} className="h-[52px] w-full">{loading ? "Menyimpan..." : ready ? "Simpan Kata Sandi Baru" : "Memeriksa link..."}</Button>
        <p className="text-center text-sm text-stone-500"><Link href="/login" className="font-extrabold text-brand-700">Kembali ke login</Link></p>
      </form>
    </Card>
  );
}

export function RegisterCard() {
  const router = useRouter();
  const { register, signInWithGoogle, isSupabaseConnected } = useAuth();
  const [role, setRole] = useState<PublicUserRole>("donatur");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError("");
    if (form.get("password") !== form.get("confirm")) { setError("Konfirmasi kata sandi belum sama."); return; }
    setLoading(true);
    const result = await register({
      name: String(form.get("name") || ""),
      email: String(form.get("email") || ""),
      phone: String(form.get("phone") || ""),
      password: String(form.get("password") || ""),
      role,
      address: String(form.get("address") || ""),
      organization: String(form.get("organization") || ""),
      beneficiaries: Number(form.get("beneficiaries") || 0)
    });
    setLoading(false);
    if (!result.ok) { setError(result.error); return; }
    router.push(result.redirectTo);
  }

  async function continueWithGoogle() {
    setError("");
    setLoading(true);
    const result = await signInWithGoogle(role);
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-[560px] rounded-[2rem] p-6 shadow-soft md:p-10">
      <h2 className="text-3xl font-extrabold text-brand-900 md:text-4xl">Buat Akun DishCon</h2>
      <p className="mt-3 text-stone-500">Pendaftaran publik hanya tersedia untuk donatur dan penerima. Akun admin dibuat khusus oleh pengelola sistem.</p>
      <div className="mt-4 rounded-2xl bg-brand-50 p-3 text-xs font-bold text-brand-800"><FiShield className="mr-2 inline" /> Mode database: {isSupabaseConnected ? "Supabase aktif" : "Demo lokal terintegrasi"}</div>
      <form onSubmit={submit} className="mt-8 space-y-5">
        <div><Label>Nama Lengkap / Nama Organisasi</Label><Input name="name" required placeholder="Masukkan nama lengkap atau organisasi" /></div>
        <div className="grid gap-4 md:grid-cols-2"><div><Label>Email</Label><Input name="email" type="email" required placeholder="contoh@email.com" /></div><div><Label>Nomor Telepon</Label><Input name="phone" type="tel" inputMode="tel" pattern="[0-9+\-\s()]+" required placeholder="08xxxxxxxxxx" /></div><div><Label>Kata Sandi</Label><Input name="password" type="password" minLength={8} required placeholder="Minimal 8 karakter" /></div><div><Label>Konfirmasi Kata Sandi</Label><Input name="confirm" type="password" minLength={8} required placeholder="Ulangi kata sandi" /></div></div>
        <div><Label>Daftar Sebagai</Label><div className="grid grid-cols-2 gap-3">{(["donatur", "penerima"] as PublicUserRole[]).map((item) => <button key={item} type="button" onClick={() => setRole(item)} className={cn("h-12 rounded-2xl border text-sm font-bold capitalize transition", role === item ? "border-brand-700 bg-brand-50 text-brand-800" : "border-stone-200 text-stone-500 hover:bg-stone-50")}>{item}</button>)}</div></div>
        <div className="flex items-center gap-4 text-sm text-stone-400"><span className="h-px flex-1 bg-stone-200" />atau<span className="h-px flex-1 bg-stone-200" /></div>
        <Button type="button" variant="secondary" className="h-[52px] w-full" onClick={continueWithGoogle} disabled={loading}><img src="/assets/logo-google.jpeg" alt="Google" className="h-5 w-5 rounded-full object-contain" /> Continue with Google</Button>
        <p className="-mt-2 text-center text-xs text-stone-400">Role yang dipilih akan diterapkan setelah Google selesai mengautentikasi akun.</p>
        <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-4"><p className="mb-4 font-extrabold text-brand-900">Informasi Tambahan</p><div className="grid gap-4 md:grid-cols-2"><div><Label>Organisasi</Label><Input name="organization" placeholder={role === "donatur" ? "Nama restoran/komunitas" : "Nama panti/komunitas"} /></div><div><Label>Jumlah Penerima Manfaat</Label><Input name="beneficiaries" type="number" min="0" placeholder="Contoh: 50" /></div><div className="md:col-span-2"><Label>Alamat</Label><Input name="address" required placeholder="Alamat ini digunakan sebagai titik awal navigasi" /></div></div></div>
        {error && <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
        <Button disabled={loading} className="h-[52px] w-full">{loading ? "Mendaftarkan..." : "Daftar Sekarang"}</Button>
        <p className="text-center text-sm text-stone-500">Sudah punya akun? <Link href="/login" className="font-extrabold text-brand-700">Masuk</Link></p>
      </form>
    </Card>
  );
}


export function AdminLoginCard() {
  const router = useRouter();
  const { loginAdmin, isSupabaseConnected } = useAuth();
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError("");
    setLoading(true);
    const result = await loginAdmin({ email: String(form.get("email") || ""), password: String(form.get("password") || "") });
    setLoading(false);
    if (!result.ok) { setError(result.error); return; }
    router.push(result.redirectTo);
  }

  return (
    <Card className="w-full max-w-[520px] rounded-[2rem] p-6 shadow-soft md:p-10">
      <div className="inline-flex items-center gap-2 rounded-full bg-brand-900 px-4 py-2 text-xs font-black uppercase tracking-widest text-white"><FiShield /> Admin Area</div>
      <h2 className="mt-5 text-3xl font-extrabold text-brand-900 md:text-4xl">Login Administrator</h2>
      <p className="mt-3 leading-7 text-stone-500">Hanya email yang memiliki role <b>admin</b> pada tabel profiles Supabase yang dapat masuk melalui halaman ini.</p>
      <div className="mt-4 rounded-2xl bg-brand-50 p-3 text-xs font-bold text-brand-800">Mode database: {isSupabaseConnected ? "Supabase aktif" : "Demo lokal"}</div>
      {!isSupabaseConnected && <div className="mt-3 rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-3 text-xs text-stone-600"><b className="text-ink">Akun admin demo:</b> admin@dishcon.id / Admin123!</div>}
      <form onSubmit={submit} className="mt-8 space-y-5">
        <div><Label>Email Admin</Label><Input name="email" type="email" autoComplete="email" required placeholder="admin@domain.com" /></div>
        <div><Label>Kata Sandi</Label><div className="relative"><Input name="password" type={show ? "text" : "password"} autoComplete="current-password" required placeholder="Masukkan kata sandi admin" className="pr-12" /><button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400" aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}>{show ? <FiEyeOff /> : <FiEye />}</button></div></div>
        {error && <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
        <Button disabled={loading} className="h-[52px] w-full">{loading ? "Memverifikasi role..." : "Masuk sebagai Admin"}</Button>
        <p className="text-center text-sm text-stone-500"><Link href="/login" className="font-extrabold text-brand-700">Kembali ke login pengguna</Link></p>
      </form>
    </Card>
  );
}
