"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FiClock, FiMap, FiMapPin, FiShield, FiShoppingBag, FiZap } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useDishconData } from "@/lib/dishcon-store";
import { buildMapsDirectionsUrl, estimateDistanceKm, formatDistanceKm } from "@/lib/maps";
import { EmptyState, StatusBadge } from "@/components/pages/shared";

function NutritionBox({ label, value }: { label: string; value?: unknown }) {
  return <div className="rounded-2xl bg-white p-4"><span className="text-xs font-black uppercase tracking-widest text-stone-400">{label}</span><p className="mt-1 font-black text-ink">{value !== undefined && value !== null && value !== "" ? String(value) : "-"}</p></div>;
}

function listValue(value: unknown) {
  return Array.isArray(value) && value.length ? value.join(", ") : "-";
}

export function FoodDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const { donations, profiles, loading } = useDishconData();
  const donation = donations.find((item) => item.id === params.id);
  const donor = profiles.find((profile) => profile.id === donation?.donor_id);
  const distance = donation ? estimateDistanceKm(user?.address, donation.location) : 0;

  if (loading) return <p className="text-stone-500">Memuat detail makanan...</p>;
  if (!donation) return <EmptyState title="Makanan tidak ditemukan" description="Data makanan tidak tersedia, sudah selesai, atau tidak dapat diakses oleh akun Anda." action={<Button asChild><Link href="/recipient/catalog">Kembali ke Katalog</Link></Button>} />;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <section className="space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-card">
          <div className="grid h-[340px] place-items-center overflow-hidden bg-gradient-to-br from-brand-50 to-amber-50 text-7xl">
            {donation.image_url ? <img src={donation.image_url} alt={donation.food_name} className="h-full w-full object-cover" /> : "🍱"}
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-2"><StatusBadge status={donation.status} />{donation.halal && <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-black text-brand-700"><FiShield className="mr-1 inline" /> Halal</span>}</div>
            <h2 className="mt-4 text-3xl font-black text-brand-900">{donation.food_name}</h2>
            <p className="mt-2 flex items-start gap-2 text-stone-500"><FiMapPin className="mt-1 shrink-0" /> {donation.location}</p>
            <p className="mt-2 text-sm font-black text-brand-700">Estimasi jarak dari alamat profil: {formatDistanceKm(distance)}</p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-brand-50 p-4"><span className="text-xs font-black uppercase tracking-widest text-brand-700">Porsi tersisa</span><p className="mt-1 text-2xl font-black text-brand-900">{donation.portions}</p></div>
              <div className="rounded-2xl bg-orange-50 p-4"><span className="text-xs font-black uppercase tracking-widest text-orange-700">Batas ambil</span><p className="mt-1 font-black text-orange-900">{new Date(donation.pickup_deadline).toLocaleString("id-ID")}</p></div>
              <div className="rounded-2xl bg-blue-50 p-4"><span className="text-xs font-black uppercase tracking-widest text-blue-700">Kategori</span><p className="mt-1 font-black text-blue-900">{donation.category}</p></div>
            </div>
          </div>
        </div>

        <div className="soft-panel p-6">
          <h3 className="text-xl font-black text-brand-900">Detail Makanan</h3>
          <p className="mt-3 whitespace-pre-line leading-7 text-stone-600">{donation.description || "Tidak ada deskripsi tambahan dari donatur."}</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <NutritionBox label="Donatur" value={donor?.name || "Donatur"} />
            <NutritionBox label="Penyimpanan" value={donation.storage_method} />
            <NutritionBox label="Waktu Produksi" value={donation.production_time ? new Date(donation.production_time).toLocaleString("id-ID") : "-"} />
            <NutritionBox label="Status Kelayakan" value={donation.expiry?.risk_level || donation.expiry_risk || "Belum dianalisis"} />
          </div>
        </div>

        <div className="soft-panel p-6">
          <div className="flex items-center gap-3"><FiZap className="text-2xl text-blue-700" /><h3 className="text-xl font-black text-brand-900">Detail AI Nutrition</h3></div>
          <p className="mt-2 text-sm text-stone-500">Data berikut berasal dari hasil AI Nutrition yang tersimpan pada donasi.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <NutritionBox label="Kalori / porsi" value={donation.nutrition?.calories_estimate ?? donation.nutrition?.calories} />
            <NutritionBox label="Protein / porsi" value={donation.nutrition?.protein} />
            <NutritionBox label="Karbohidrat / porsi" value={donation.nutrition?.carbohydrate ?? donation.nutrition?.carbs} />
            <NutritionBox label="Lemak / porsi" value={donation.nutrition?.fat} />
            <NutritionBox label="Bahan Utama" value={listValue(donation.nutrition?.ingredients_detected)} />
            <NutritionBox label="Bumbu Utama" value={listValue(donation.nutrition?.seasonings_detected)} />
          </div>
          <div className="mt-4 rounded-3xl bg-blue-50 p-5 text-sm leading-7 text-blue-900"><b>Alergen:</b> {Array.isArray(donation.nutrition?.allergens) && donation.nutrition.allergens.length ? donation.nutrition.allergens.join(", ") : "Tidak teridentifikasi"}<br /><b>Catatan nutrisi:</b> {String(donation.nutrition?.nutrition_note || donation.nutrition?.recommendation || "Belum ada catatan AI.")}</div>
        </div>

        <div className="soft-panel p-6">
          <div className="flex items-center gap-3"><FiClock className="text-2xl text-orange-700" /><h3 className="text-xl font-black text-brand-900">Detail AI Expiry Risk</h3></div>
          <p className="mt-2 text-sm text-stone-500">Data berikut berasal dari hasil AI Expiry Risk yang tersimpan pada donasi.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <NutritionBox label="Tingkat Risiko" value={donation.expiry?.risk_level || donation.expiry_risk} />
            <NutritionBox label="Aman Dikonsumsi" value={donation.expiry?.safe_hours !== undefined ? `${donation.expiry.safe_hours} jam` : undefined} />
            <NutritionBox label="Konsumsi Sebelum" value={donation.expiry?.recommended_consume_before} />
            <NutritionBox label="Saran Penyimpanan" value={donation.expiry?.storage_recommendation || donation.nutrition?.recommendation} />
          </div>
          <div className="mt-4 rounded-3xl bg-orange-50 p-5 text-sm leading-7 text-orange-900"><b>Alasan:</b> {donation.expiry?.expiry_reason || "Belum ada alasan AI."}<br /><b>Peringatan:</b> {Array.isArray(donation.expiry?.food_safety_warnings) && donation.expiry.food_safety_warnings.length ? donation.expiry.food_safety_warnings.join(", ") : "Tidak ada peringatan khusus."}</div>
        </div>
      </section>

      <aside className="space-y-5">
        <div className="rounded-[2rem] bg-gradient-to-br from-brand-700 to-brand-900 p-6 text-white shadow-card">
          <FiShoppingBag className="text-3xl" />
          <h3 className="mt-4 text-2xl font-black">Ajukan Pengambilan</h3>
          <p className="mt-3 text-sm leading-6 text-white/75">Setelah membaca detail makanan, Anda dapat melanjutkan ke form pengajuan. Stok akan berkurang otomatis ketika admin menyetujui pengajuan.</p>
          {donation.status === "active" && donation.portions > 0 ? (
            <Button asChild className="mt-5 w-full bg-white text-brand-800 hover:bg-brand-50"><Link href={`/recipient/request?donation=${donation.id}`}>Ajukan Makanan</Link></Button>
          ) : (
            <Button disabled className="mt-5 w-full bg-white text-brand-800 hover:bg-brand-50">Stok Tidak Tersedia</Button>
          )}
        </div>
        <div className="soft-panel p-5">
          <h3 className="font-black text-brand-900">Navigasi</h3>
          <p className="mt-2 text-sm text-stone-500">Rute memakai alamat profil penerima sebagai titik awal dan lokasi input donatur sebagai tujuan.</p>
          <Button type="button" variant="secondary" className="mt-4 w-full" onClick={() => window.open(buildMapsDirectionsUrl(user?.address, donation.location), "_blank", "noopener,noreferrer")}><FiMap /> Buka Peta</Button>
        </div>
        <div className="rounded-[2rem] border border-orange-100 bg-orange-50 p-5"><FiClock className="text-orange-700" /><p className="mt-2 text-sm font-semibold text-orange-900">Pastikan pengambilan dilakukan sebelum batas ambil dan periksa kondisi makanan saat serah terima.</p></div>
      </aside>
    </div>
  );
}
