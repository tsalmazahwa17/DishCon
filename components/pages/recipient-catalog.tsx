"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FiFilter, FiMap, FiMapPin, FiSearch, FiShield, FiZap } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDishconData } from "@/lib/dishcon-store";
import { useAuth } from "@/lib/auth-context";
import { buildMapsDirectionsUrl, estimateDistanceKm, formatDistanceKm } from "@/lib/maps";
import { compactNutritionLabel } from "@/lib/nutrition";
import { EmptyState, StatusBadge } from "@/components/pages/shared";

const categories = ["Makanan Berat", "Snack/Kue", "Buah & Sayur", "Minuman"];

export function RecipientCatalogPage() {
  const { user } = useAuth();
  const { donations, loading, preferences } = useDishconData();
  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [halalOnly, setHalalOnly] = useState(false);

  const activeDonations = donations.filter((d) => d.status === "active" && d.portions > 0);
  const filtered = useMemo(() => activeDonations
    .map((item) => ({ ...item, distanceKm: estimateDistanceKm(user?.address, item.location) }))
    .filter((item) => {
      const searchMatch = `${item.food_name} ${item.category} ${item.location}`.toLowerCase().includes(query.toLowerCase());
      const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(item.category);
      const halalMatch = !halalOnly || item.halal;
      const preferenceHalalMatch = !preferences.halal || item.halal;
      const preferenceCategoryMatch = preferences.preferredCategories.length === 0 || preferences.preferredCategories.includes(item.category);
      const distanceMatch = item.distanceKm <= preferences.maxDistanceKm;
      return searchMatch && categoryMatch && halalMatch && preferenceHalalMatch && preferenceCategoryMatch && distanceMatch;
    }), [activeDonations, halalOnly, preferences.halal, preferences.maxDistanceKm, preferences.preferredCategories, query, selectedCategories, user?.address]);

  function toggleCategory(category: string) {
    setSelectedCategories((current) => current.includes(category) ? current.filter((item) => item !== category) : [...current, category]);
  }

  return (
    <div className="grid w-full min-w-0 max-w-full gap-6 overflow-hidden 2xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="soft-panel h-max min-w-0 p-5">
        <div className="mb-4 flex items-center justify-between"><h2 className="font-black text-ink">Filter</h2><button onClick={() => { setQuery(""); setSelectedCategories([]); setHalalOnly(false); }} className="text-sm font-bold text-brand-700">Reset semua</button></div>
        <div className="space-y-5 text-sm">
          <div><p className="mb-2 font-black uppercase tracking-widest text-stone-400">Status</p><label className="flex items-center gap-3"><input type="checkbox" checked readOnly className="accent-brand-700" /> Sudah diverifikasi admin</label></div>
          <div><p className="mb-2 font-black uppercase tracking-widest text-stone-400">Kategori</p>{categories.map((category) => <label key={category} className="mt-2 flex items-center gap-3"><input type="checkbox" checked={selectedCategories.includes(category)} onChange={() => toggleCategory(category)} className="accent-brand-700" /> {category}</label>)}</div>
          <div><p className="mb-2 font-black uppercase tracking-widest text-stone-400">Keamanan</p><label className="flex items-center gap-3"><input type="checkbox" checked={halalOnly} onChange={(event) => setHalalOnly(event.target.checked)} className="accent-brand-700" /> Hanya makanan halal</label></div>
          <div className="rounded-2xl bg-brand-50 p-4"><p className="font-black text-brand-900">Preferensi aktif</p><p className="mt-2 text-xs leading-5 text-brand-800">Katalog otomatis mengikuti halal, kategori favorit, dan jarak maksimal <b>{preferences.maxDistanceKm} km</b> dari halaman Settings.</p></div>
        </div>
      </aside>

      <section className="min-w-0 space-y-5">
        <div className="flex flex-col gap-3 rounded-3xl border border-stone-200 bg-white p-4 shadow-card md:flex-row">
          <div className="relative flex-1"><FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" /><Input value={query} onChange={(e) => setQuery(e.target.value)} className="pl-11" placeholder="Cari nama makanan atau lokasi..." /></div>
          <Button type="button"><FiSearch /> Cari</Button>
          <Button type="button" variant="secondary" onClick={() => setHalalOnly((value) => !value)}><FiFilter /> {halalOnly ? "Halal aktif" : "Filter halal"}</Button>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm"><span className="text-stone-500">Indikator:</span><span className="rounded-full border border-brand-100 bg-brand-50 px-4 py-2 font-bold text-brand-700"><FiShield className="mr-2 inline" /> Terverifikasi</span><span className="rounded-full border border-blue-100 bg-blue-50 px-4 py-2 font-bold text-blue-700"><FiZap className="mr-2 inline" /> Dianalisis AI</span></div>

        <div className="soft-panel min-w-0 p-5">
          <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-black text-ink">Makanan Tersedia <span className="text-base text-stone-400">({filtered.length} hasil)</span></h2></div>
          {loading ? <p className="text-stone-500">Memuat katalog...</p> : filtered.length === 0 ? (
            <EmptyState title="Katalog masih kosong" description="Belum ada donasi aktif yang sesuai preferensi halal, kategori, dan jarak maksimal. Ubah preferensi dari Settings bila perlu." />
          ) : (
            <div className="grid min-w-0 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((item) => (
                <article key={item.id} className="overflow-hidden rounded-[1.7rem] border border-stone-200 bg-white shadow-sm">
                  <div className="grid h-44 place-items-center overflow-hidden bg-gradient-to-br from-brand-50 to-amber-50 text-5xl">{item.image_url ? <img src={item.image_url} alt={item.food_name} className="h-full w-full object-cover" /> : "🍱"}</div>
                  <div className="p-5">
                    <div className="flex flex-wrap gap-2"><StatusBadge status={item.status} />{item.halal && <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-black text-brand-700">Halal</span>}</div>
                    <h3 className="mt-3 text-xl font-black text-ink">{item.food_name}</h3>
                    <p className="mt-1 flex items-start gap-2 text-sm text-stone-500"><FiMapPin className="mt-0.5 shrink-0" /> {item.location}</p>
                    <p className="mt-2 text-xs font-black text-brand-700">Estimasi jarak: {formatDistanceKm(item.distanceKm)} dari alamat profil</p>
                    <div className="mt-3 rounded-2xl bg-blue-50 p-3 text-xs leading-5 text-blue-800"><b>AI Nutrition:</b> {compactNutritionLabel(item.nutrition)}<br /><b>Expiry:</b> {item.expiry_risk || "Belum dinilai"}</div>
                    <div className="mt-3 flex justify-between gap-3 text-sm"><span>{item.portions} porsi tersisa</span><b className="text-right">{new Date(item.pickup_deadline).toLocaleString("id-ID")}</b></div>
                    <Button type="button" variant="secondary" className="mt-4 w-full" onClick={() => window.open(buildMapsDirectionsUrl(user?.address, item.location), "_blank", "noopener,noreferrer")}><FiMap /> Navigasi ke Lokasi</Button>
                    <div className="mt-2 flex gap-2"><Button asChild variant="secondary" className="flex-1"><Link href={`/recipient/food/${item.id}`}>Detail</Link></Button><Button asChild className="flex-1"><Link href={`/recipient/request?donation=${item.id}`}>Ajukan →</Link></Button></div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
