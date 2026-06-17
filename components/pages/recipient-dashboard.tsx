"use client";

import Link from "next/link";
import { FiCalendar, FiCheckCircle, FiFeather, FiMap, FiSearch, FiZap } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { useDishconData } from "@/lib/dishcon-store";
import { useAuth } from "@/lib/auth-context";
import { buildMapsDirectionsUrl, estimateDistanceKm, formatDistanceKm } from "@/lib/maps";
import { buildReceivedNutritionSummary, formatNutritionValue } from "@/lib/nutrition";
import { EmptyState, MetricCard, StatusBadge } from "@/components/pages/shared";

export function RecipientDashboardPage() {
  const { user } = useAuth();
  const { requests, donations, loading, preferences } = useDishconData();
  const pending = requests.filter((r) => r.status === "pending").length;
  const approvedRequests = requests.filter((r) => r.status === "approved");
  const approved = approvedRequests.length;
  const completedRequests = requests.filter((r) => r.status === "completed");
  const received = completedRequests.reduce((sum, item) => sum + item.portions, 0);
  const availableDonations = donations
    .map((item) => ({ ...item, distanceKm: estimateDistanceKm(user?.address, item.location) }))
    .filter((item) => item.status === "active" && item.portions > 0 && item.distanceKm <= preferences.maxDistanceKm && (!preferences.halal || item.halal) && (preferences.preferredCategories.length === 0 || preferences.preferredCategories.includes(item.category)));
  const nextRequest = approvedRequests[0];
  const nextDonation = donations.find((item) => item.id === nextRequest?.donation_id);
  const nutritionSummary = buildReceivedNutritionSummary(requests, donations);

  function openMap() {
    if (!nextDonation) {
      window.alert("Belum ada pengajuan disetujui yang memiliki lokasi pengambilan.");
      return;
    }
    window.open(buildMapsDirectionsUrl(user?.address, nextDonation.location), "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={FiCalendar} label="Permintaan Menunggu" value={pending} hint="Data dari akun Anda" />
        <MetricCard icon={FiCheckCircle} label="Permintaan Disetujui" value={approved} hint="Siap dijadwalkan" />
        <MetricCard icon={FiFeather} label="Makanan Diterima" value={`${received} porsi`} hint="Total selesai" tone="orange" />
        <MetricCard icon={FiFeather} label="Emisi Diselamatkan" value={`${(received * 0.18).toFixed(1)} kg CO2`} hint="Estimasi dampak" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="space-y-6">
          <div className="soft-panel p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="text-xl font-black text-brand-900">Rekomendasi Makanan Tersedia</h2><p className="text-stone-500">Mengikuti preferensi halal, kategori, dan jarak maksimal {preferences.maxDistanceKm} km.</p></div>
              <Link href="/recipient/catalog" className="font-bold text-brand-700">Lihat Semua →</Link>
            </div>
            {loading ? <p className="text-stone-500">Memuat data...</p> : availableDonations.length === 0 ? (
              <EmptyState
                title="Belum ada makanan tersedia"
                description="Katalog akan terisi saat donatur mengunggah makanan, admin mengaktifkan status donasi, dan makanan sesuai preferensi jarak/kategori Anda."
                action={<Button asChild><Link href="/recipient/catalog"><FiSearch /> Buka Katalog</Link></Button>}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {availableDonations.slice(0, 4).map((item) => (
                  <div key={item.id} className="overflow-hidden rounded-3xl border border-stone-200">
                    {item.image_url && <img src={item.image_url} alt={item.food_name} className="h-36 w-full object-cover" />}
                    <div className="p-4">
                      <p className="font-black text-ink">{item.food_name}</p>
                      <p className="mt-1 text-sm text-stone-500">{item.location}</p>
                      <p className="mt-2 text-xs font-bold text-brand-700">{formatDistanceKm(item.distanceKm)} dari alamat profil</p>
                      <p className="mt-2 text-xs font-bold text-blue-700"><FiZap className="mr-1 inline" /> {item.expiry?.risk_level || item.expiry_risk || "Analisis AI belum tersedia"}</p>
                      <p className="mt-1 text-xs text-stone-500">Kalori AI: {String(item.nutrition?.calories_estimate ?? item.nutrition?.calories ?? "-")} / porsi</p>
                      <div className="mt-3 flex items-center justify-between"><span className="rounded-xl bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">{item.portions} porsi</span><div className="flex gap-2"><Button asChild size="sm" variant="secondary"><Link href={`/recipient/food/${item.id}`}>Detail</Link></Button><Button asChild size="sm"><Link href={`/recipient/request?donation=${item.id}`}>Ajukan</Link></Button></div></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="soft-panel p-6">
            <h2 className="mb-4 text-xl font-black text-brand-900">Riwayat Pengajuan Terbaru</h2>
            {requests.length === 0 ? (
              <EmptyState title="Belum ada pengajuan" description="Setelah Anda mengajukan makanan, status menunggu, disetujui, atau selesai akan muncul di sini." />
            ) : (
              <div className="overflow-x-auto">
                <table className="mockup-table min-w-[700px] w-full"><thead><tr><th>ID</th><th>Makanan</th><th>Porsi</th><th>Status</th><th>Tanggal</th></tr></thead><tbody>{requests.slice(0, 5).map((r) => <tr key={r.id}><td>{r.id}</td><td>{r.food_name}</td><td>{r.portions}</td><td><StatusBadge status={r.status} /></td><td>{new Date(r.created_at).toLocaleDateString("id-ID")}</td></tr>)}</tbody></table>
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-5">
          <div className="rounded-[2rem] bg-gradient-to-br from-brand-700 to-brand-900 p-6 text-white shadow-card">
            <h3 className="text-2xl font-black">Navigasi Pengambilan</h3>
            {nextDonation ? (
              <div className="mt-4 rounded-2xl bg-white/10 p-4 text-sm"><b>{nextDonation.food_name}</b><p className="mt-1 text-white/80">Dari: {user?.address || "lokasi perangkat"}</p><p className="text-white/80">Tujuan: {nextDonation.location}</p></div>
            ) : <p className="mt-4 rounded-2xl bg-white/10 p-4 text-sm text-white/80">Belum ada jadwal pengambilan yang disetujui.</p>}
            <Button type="button" onClick={openMap} disabled={!nextDonation} className="mt-5 w-full bg-white text-brand-800 hover:bg-brand-50"><FiMap /> Buka Peta Navigasi</Button>
          </div>
          <div className="soft-panel p-5">
            <h3 className="font-black text-brand-900">Ringkasan Nutrisi Diterima</h3>
            <p className="mt-3 text-sm text-stone-500">Total ini bertambah otomatis berdasarkan pengajuan yang sudah selesai dan porsi makanan yang benar-benar diterima.</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-blue-50 p-3"><span className="text-blue-700">Kalori</span><b className="block text-blue-900">{formatNutritionValue(nutritionSummary.totals.calories, "kkal")}</b></div>
              <div className="rounded-2xl bg-brand-50 p-3"><span className="text-brand-700">Protein</span><b className="block text-brand-900">{formatNutritionValue(nutritionSummary.totals.protein, "g")}</b></div>
              <div className="rounded-2xl bg-orange-50 p-3"><span className="text-orange-700">Karbo</span><b className="block text-orange-900">{formatNutritionValue(nutritionSummary.totals.carbohydrate, "g")}</b></div>
              <div className="rounded-2xl bg-stone-50 p-3"><span className="text-stone-500">Lemak</span><b className="block text-ink">{formatNutritionValue(nutritionSummary.totals.fat, "g")}</b></div>
            </div>
            <div className="mt-4 space-y-2">
              {nutritionSummary.details.slice(0, 3).map(({ request, donation }) => <div key={request.id} className="rounded-2xl border border-stone-200 p-3 text-xs"><b>{request.food_name}</b><p className="mt-1 text-stone-500">{request.portions} porsi · Kalori AI: {String(donation?.nutrition?.calories_estimate ?? donation?.nutrition?.calories ?? "-")}</p></div>)}
              {nutritionSummary.details.length === 0 && <p className="rounded-2xl bg-stone-50 p-3 text-sm text-stone-500">Belum ada makanan selesai yang memiliki data nutrisi.</p>}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
