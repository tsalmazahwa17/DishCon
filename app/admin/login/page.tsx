import { BrandLogo } from "@/components/brand-logo";
import { AdminLoginCard } from "@/components/auth/auth-card";

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-900 via-[#0b2b24] to-[#07101f] px-5 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col">
        <BrandLogo dark className="text-white" />
        <div className="grid flex-1 items-center gap-12 py-10 lg:grid-cols-[1fr_520px]">
          <section className="max-w-2xl text-white">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-extrabold">DishCon Administration</span>
            <h1 className="mt-8 text-5xl font-black leading-tight md:text-7xl">Kontrol operasional dalam satu panel.</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/65">Verifikasi donasi, pengajuan penerima, zona distribusi, hasil AI, dan pusat pengaduan melalui akses khusus administrator.</p>
          </section>
          <AdminLoginCard />
        </div>
      </div>
    </main>
  );
}
