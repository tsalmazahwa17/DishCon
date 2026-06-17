"use client";

import Link from "next/link";
import { FiBox, FiCheckCircle, FiClock, FiHeart, FiPlus, FiTrendingUp } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { useDishconData } from "@/lib/dishcon-store";
import { EmptyState, MetricCard, StatusBadge } from "@/components/pages/shared";

export function DonorDashboardPage() {
  const { donations, requests, loading } = useDishconData();
  const active = donations.filter((d) => ["active", "pending_verification", "reserved"].includes(d.status)).length;
  const completed = requests.filter((request) => request.status === "completed").reduce((sum, item) => sum + item.portions, 0);
  const waiting = requests.filter((request) => request.status === "approved").length;
  const saved = completed * 0.45;

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={FiBox} label="Donasi Aktif" value={active} hint="Sedang menunggu atau tersedia" />
        <MetricCard icon={FiCheckCircle} label="Total Porsi Disalurkan" value={completed} hint="Mengikuti data akun Anda" tone="orange" />
        <MetricCard icon={FiClock} label="Menunggu Diambil" value={waiting} hint="Donasi siap diambil penerima" />
        <MetricCard icon={FiHeart} label="Dampak Terselamatkan" value={`${saved.toFixed(1)} kg`} hint="Estimasi makanan dari limbah" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="soft-panel p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-black text-brand-900">Riwayat Donasi Terbaru</h2>
            <Link href="/donor/history" className="font-bold text-brand-700">Lihat Semua Riwayat →</Link>
          </div>
          {loading ? <p className="text-stone-500">Memuat data...</p> : donations.length === 0 ? (
            <EmptyState
              title="Belum ada riwayat donasi"
              description="Akun baru dimulai dengan data bersih. Buat donasi pertama agar riwayat dan statistik terisi otomatis dari database akun Anda."
              action={<Button asChild><Link href="/donor/donate"><FiPlus /> Buat Donasi Baru</Link></Button>}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="mockup-table min-w-[760px] w-full">
                <thead><tr><th>Makanan</th><th>Porsi</th><th>Lokasi</th><th>Batas Ambil</th><th>Status</th></tr></thead>
                <tbody>{donations.slice(0, 5).map((item) => (
                  <tr key={item.id}><td><b>{item.food_name}</b><p className="text-xs text-stone-500">{item.category}</p></td><td>{item.portions} porsi</td><td>{item.location}</td><td>{new Date(item.pickup_deadline).toLocaleString("id-ID")}</td><td><StatusBadge status={item.status} /></td></tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <div className="rounded-[2rem] border border-brand-100 bg-gradient-to-br from-brand-700 to-brand-900 p-6 text-white shadow-card">
            <h3 className="text-xl font-black">Ringkasan Dampak</h3>
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl bg-white/10 p-4"><b>{saved.toFixed(1)} kg</b><p className="text-sm text-white/75">makanan terselamatkan</p></div>
              <div className="rounded-2xl bg-white/10 p-4"><b>{completed} porsi</b><p className="text-sm text-white/75">porsi tersalurkan</p></div>
            </div>
            <Button asChild className="mt-5 w-full bg-white text-brand-800 hover:bg-brand-50"><Link href="/donor/donate"><FiPlus /> Buat Donasi Baru</Link></Button>
          </div>
          <div className="soft-panel p-5">
            <h3 className="font-black text-brand-900">Insight AI Donatur</h3>
            <div className="mt-4 space-y-3 text-sm text-stone-600">
              <p className="rounded-2xl bg-brand-50 p-3"><FiTrendingUp className="mr-2 inline" /> Data insight akan aktif setelah ada minimal 3 donasi.</p>
              <p>Rekomendasi waktu terbaik, jenis makanan, dan pola penerima akan dihitung dari database akun Anda.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
