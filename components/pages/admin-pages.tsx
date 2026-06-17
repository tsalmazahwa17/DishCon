"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  FiActivity, FiCheck, FiDatabase, FiEye, FiGift, FiMap, FiMapPin, FiSearch,
  FiShield, FiUser, FiUsers, FiX, FiZap
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useDishconData } from "@/lib/dishcon-store";
import { buildMapsEmbedUrl, buildMapsSearchUrl } from "@/lib/maps";
import type { Donation, FoodRequest, Profile } from "@/lib/types";
import { EmptyState, MetricCard, StatusBadge } from "@/components/pages/shared";
import { ProfilePage, NotificationsPage, SettingsPage } from "@/components/pages/account-pages";

function profileLabel(profiles: Profile[], id?: string) {
  if (!id) return "-";
  const profile = profiles.find((item) => item.id === id);
  return profile ? `${profile.name}${profile.organization ? ` (${profile.organization})` : ""}` : id.slice(0, 8);
}

function listValue(value: unknown) {
  return Array.isArray(value) && value.length ? value.join(", ") : "-";
}

function Detail({ label, value }: { label: string; value: unknown }) {
  return <div className="rounded-2xl bg-stone-50 p-4"><span className="text-xs font-black uppercase tracking-widest text-stone-400">{label}</span><p className="mt-1 font-bold text-ink">{value !== undefined && value !== null && value !== "" ? String(value) : "-"}</p></div>;
}

function AiNutritionPanel({ donation }: { donation: Donation }) {
  return (
    <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
      <b className="text-blue-900">AI Nutrition & Alergen</b>
      <div className="mt-3 grid gap-2 text-sm text-blue-900 md:grid-cols-2">
        <p>Kalori/porsi: {String(donation.nutrition?.calories_estimate ?? donation.nutrition?.calories ?? "-")}</p>
        <p>Protein: {String(donation.nutrition?.protein ?? "-")}</p>
        <p>Karbohidrat: {String(donation.nutrition?.carbohydrate ?? donation.nutrition?.carbs ?? "-")}</p>
        <p>Lemak: {String(donation.nutrition?.fat ?? "-")}</p>
      </div>
      <div className="mt-3 space-y-1 text-sm leading-6 text-blue-900">
        <p><b>Bahan utama:</b> {listValue(donation.nutrition?.ingredients_detected)}</p>
        <p><b>Bumbu utama:</b> {listValue(donation.nutrition?.seasonings_detected)}</p>
        <p><b>Alergen:</b> {Array.isArray(donation.nutrition?.allergens) && donation.nutrition.allergens.length ? donation.nutrition.allergens.join(", ") : "Tidak teridentifikasi"}</p>
        <p><b>Catatan:</b> {String(donation.nutrition?.nutrition_note || donation.nutrition?.recommendation || "-")}</p>
      </div>
    </div>
  );
}

function AiExpiryPanel({ donation }: { donation: Donation }) {
  return (
    <div className="rounded-3xl border border-orange-100 bg-orange-50 p-5">
      <b className="text-orange-900">AI Expiry Risk</b>
      <p className="mt-3 text-lg font-black text-orange-700">{donation.expiry?.risk_level || donation.expiry_risk || "Belum dianalisis"}</p>
      <div className="mt-3 space-y-2 text-sm leading-6 text-orange-900">
        <p><b>Aman dikonsumsi:</b> {donation.expiry?.safe_hours !== undefined ? `${donation.expiry.safe_hours} jam` : "-"}</p>
        <p><b>Konsumsi sebelum:</b> {donation.expiry?.recommended_consume_before || "-"}</p>
        <p><b>Penyimpanan:</b> {donation.expiry?.storage_recommendation || donation.nutrition?.recommendation || "-"}</p>
        <p><b>Alasan:</b> {donation.expiry?.expiry_reason || "-"}</p>
        <p><b>Peringatan:</b> {Array.isArray(donation.expiry?.food_safety_warnings) && donation.expiry.food_safety_warnings.length ? donation.expiry.food_safety_warnings.join(", ") : "Tidak ada peringatan khusus"}</p>
      </div>
    </div>
  );
}

function DonationDetail({ donation, profiles, onClose }: { donation: Donation | null; profiles: Profile[]; onClose: () => void }) {
  return (
    <Dialog open={Boolean(donation)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
        {donation && <>
          <DialogTitle className="pr-10 text-2xl font-black text-brand-900">Verifikasi Donasi: {donation.food_name}</DialogTitle>
          <DialogDescription className="mt-2">Seluruh informasi berikut berasal dari input donatur dan hasil analisis AI.</DialogDescription>
          {donation.image_url && <img src={donation.image_url} alt={donation.food_name} className="mt-5 h-64 w-full rounded-3xl object-cover" />}
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Detail label="Donatur" value={profileLabel(profiles, donation.donor_id)} />
            <Detail label="Kategori" value={donation.category} />
            <Detail label="Jumlah" value={`${donation.portions} porsi tersisa`} />
            <Detail label="Halal" value={donation.halal ? "Ya" : "Tidak / belum diklaim"} />
            <Detail label="Lokasi" value={donation.location} />
            <Detail label="Penyimpanan" value={donation.storage_method || "-"} />
            <Detail label="Waktu Produksi" value={donation.production_time ? new Date(donation.production_time).toLocaleString("id-ID") : "-"} />
            <Detail label="Batas Ambil" value={new Date(donation.pickup_deadline).toLocaleString("id-ID")} />
          </div>
          <div className="mt-4 rounded-3xl border border-stone-200 p-4"><b>Deskripsi Donatur</b><p className="mt-2 whitespace-pre-line text-sm leading-6 text-stone-600">{donation.description || "Tidak ada deskripsi."}</p></div>
          <div className="mt-4 grid gap-4 md:grid-cols-2"><AiNutritionPanel donation={donation} /><AiExpiryPanel donation={donation} /></div>
          <Button type="button" variant="secondary" className="mt-4 w-full" onClick={() => window.open(buildMapsSearchUrl(donation.location), "_blank", "noopener,noreferrer")}><FiMap /> Buka Lokasi Input Donatur</Button>
        </>}
      </DialogContent>
    </Dialog>
  );
}

function RequestDetail({ request, profiles, donations, onClose }: { request: FoodRequest | null; profiles: Profile[]; donations: Donation[]; onClose: () => void }) {
  const donation = request ? donations.find((item) => item.id === request.donation_id) : undefined;
  return (
    <Dialog open={Boolean(request)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
        {request && <>
          <DialogTitle className="pr-10 text-2xl font-black text-brand-900">Detail Pengajuan {request.id}</DialogTitle>
          <DialogDescription className="mt-2">Data penerima terhubung langsung dengan donasi dan hasil AI makanan yang dipilih.</DialogDescription>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Detail label="Penerima" value={profileLabel(profiles, request.recipient_id)} />
            <Detail label="Donatur" value={profileLabel(profiles, request.donor_id)} />
            <Detail label="Makanan" value={request.food_name} />
            <Detail label="Jumlah Diajukan" value={`${request.portions} porsi`} />
            <Detail label="Metode" value="Pengambilan mandiri" />
            <Detail label="Status" value={request.status} />
          </div>
          <div className="mt-4 rounded-3xl border border-stone-200 p-4"><b>Catatan Penerima</b><p className="mt-2 text-sm leading-6 text-stone-600">{request.note || "Tidak ada catatan."}</p></div>
          {donation && <>
            <div className="mt-4 rounded-3xl bg-brand-50 p-4"><b className="text-brand-900">Lokasi Penyaluran</b><p className="mt-1 text-sm text-brand-800">{donation.location}</p><Button type="button" variant="secondary" className="mt-3" onClick={() => window.open(buildMapsSearchUrl(donation.location), "_blank", "noopener,noreferrer")}><FiMap /> Lihat Peta</Button></div>
            <div className="mt-4 grid gap-4 md:grid-cols-2"><AiNutritionPanel donation={donation} /><AiExpiryPanel donation={donation} /></div>
          </>}
        </>}
      </DialogContent>
    </Dialog>
  );
}

export function AdminDashboardPage() {
  const { donations, requests, notifications, loading } = useDishconData();
  const pendingDonations = donations.filter((item) => item.status === "pending_verification");
  const pendingRequests = requests.filter((item) => item.status === "pending");
  const assessed = donations.filter((item) => item.nutrition && item.expiry_risk).length;
  const coverage = donations.length ? Math.round((assessed / donations.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={FiGift} label="Total Donasi" value={donations.length} hint={`${pendingDonations.length} menunggu verifikasi`} />
        <MetricCard icon={FiUsers} label="Total Pengajuan" value={requests.length} hint={`${pendingRequests.length} perlu tindakan`} tone="blue" />
        <MetricCard icon={FiZap} label="Cakupan AI" value={`${coverage}%`} hint={`${assessed} donasi sudah dianalisis`} tone="purple" />
        <MetricCard icon={FiActivity} label="Aktivitas Admin" value={notifications.length} hint="Notifikasi akun admin" tone="orange" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <section className="space-y-6">
          <div className="grid gap-5 md:grid-cols-3">
            <Link href="/admin/donations" className="soft-panel p-5 transition hover:-translate-y-1"><FiGift className="text-2xl text-brand-700" /><h3 className="mt-4 font-black text-ink">Verifikasi Donasi</h3><p className="mt-2 text-3xl font-black text-brand-700">{pendingDonations.length}</p><p className="text-sm text-stone-500">foto, input, dan hasil AI</p></Link>
            <Link href="/admin/requests" className="soft-panel p-5 transition hover:-translate-y-1"><FiDatabase className="text-2xl text-blue-700" /><h3 className="mt-4 font-black text-ink">Verifikasi Pengajuan</h3><p className="mt-2 text-3xl font-black text-blue-700">{pendingRequests.length}</p><p className="text-sm text-stone-500">data penerima terintegrasi</p></Link>
            <Link href="/admin/zones" className="soft-panel p-5 transition hover:-translate-y-1"><FiMapPin className="text-2xl text-orange-700" /><h3 className="mt-4 font-black text-ink">Zona Distribusi</h3><p className="mt-2 text-3xl font-black text-orange-700">{new Set(donations.map((item) => item.location)).size}</p><p className="text-sm text-stone-500">berdasarkan lokasi donatur</p></Link>
          </div>

          <div className="soft-panel p-5">
            <div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-black text-brand-900">Antrian Produksi</h2><p className="text-stone-500">Data nyata dari form donatur dan penerima.</p></div>{loading && <span className="text-sm text-stone-500">Memuat...</span>}</div>
            {pendingDonations.length === 0 && pendingRequests.length === 0 ? <EmptyState title="Tidak ada antrian" description="Semua donasi dan pengajuan sudah diproses." /> : <div className="grid gap-4 md:grid-cols-2"><div className="rounded-3xl border border-stone-200 p-5"><b>Donasi Menunggu</b>{pendingDonations.slice(0, 4).map((item) => <div key={item.id} className="mt-3 flex items-center justify-between rounded-2xl bg-stone-50 p-3"><span><b className="block text-sm">{item.food_name}</b><span className="text-xs text-stone-500">{item.portions} porsi</span></span><StatusBadge status={item.status} /></div>)}</div><div className="rounded-3xl border border-stone-200 p-5"><b>Pengajuan Menunggu</b>{pendingRequests.slice(0, 4).map((item) => <div key={item.id} className="mt-3 flex items-center justify-between rounded-2xl bg-stone-50 p-3"><span><b className="block text-sm">{item.food_name}</b><span className="text-xs text-stone-500">{item.portions} porsi</span></span><StatusBadge status={item.status} /></div>)}</div></div>}
          </div>
        </section>

        <aside className="space-y-5">
          <div className="soft-panel p-5"><h3 className="font-black text-brand-900">Aktivitas Terbaru</h3>{notifications.length === 0 ? <p className="mt-3 text-sm text-stone-500">Belum ada aktivitas admin.</p> : <div className="mt-4 space-y-3">{notifications.slice(0, 6).map((item) => <div key={item.id} className="rounded-2xl bg-stone-50 p-3"><b className="text-sm">{item.title}</b><p className="text-xs text-stone-500">{item.message}</p></div>)}</div>}</div>
          <div className="rounded-[2rem] border border-brand-100 bg-brand-50 p-5"><FiShield className="text-2xl text-brand-700" /><h3 className="mt-3 font-black text-brand-900">Akses Admin Terkendali</h3><p className="mt-2 text-sm text-brand-800">Admin tidak dapat didaftarkan melalui formulir publik. Role admin dibuat oleh pengelola sistem.</p></div>
        </aside>
      </div>
    </div>
  );
}

export function AdminDonationsPage() {
  const { donations, profiles, loading, updateDonationStatus } = useDishconData();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<Donation | null>(null);
  const filtered = useMemo(() => donations.filter((item) => {
    const donor = profileLabel(profiles, item.donor_id);
    return `${item.food_name} ${item.location} ${donor}`.toLowerCase().includes(q.toLowerCase()) && (status === "all" || item.status === status);
  }), [donations, profiles, q, status]);

  return <>
    <section className="soft-panel p-5">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="text-2xl font-black text-brand-900">Manajemen & Verifikasi Donasi</h2><p className="text-stone-500">Memeriksa foto, data form, AI Nutrition, dan Expiry Risk sebelum makanan ditampilkan.</p></div><div className="flex gap-2"><div className="relative"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" /><Input value={q} onChange={(event) => setQ(event.target.value)} className="pl-10" placeholder="Cari donasi..." /></div><select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-2xl border border-stone-200 px-3 text-sm font-bold"><option value="all">Semua</option><option value="pending_verification">Menunggu</option><option value="active">Aktif</option><option value="rejected">Ditolak</option><option value="completed">Selesai</option></select></div></div>
      {loading ? <p>Memuat data...</p> : filtered.length === 0 ? <EmptyState title="Belum ada donasi" description="Donasi yang dibuat akun donatur akan tampil otomatis pada halaman ini." /> : <div className="overflow-x-auto"><table className="mockup-table min-w-[1100px] w-full"><thead><tr><th>Foto</th><th>Makanan</th><th>Donatur</th><th>Lokasi</th><th>AI Assessment</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td>{item.image_url ? <img src={item.image_url} alt="" className="h-14 w-16 rounded-xl object-cover" /> : <div className="grid h-14 w-16 place-items-center rounded-xl bg-stone-100">🍱</div>}</td><td><b>{item.food_name}</b><p className="text-xs text-stone-500">{item.portions} porsi · {item.category}</p></td><td>{profileLabel(profiles, item.donor_id)}</td><td>{item.location}</td><td><p className="max-w-[260px] text-xs"><b>{String(item.nutrition?.calories_estimate || "Belum ada")}</b><br />{item.expiry_risk || "Belum dianalisis"}</p></td><td><StatusBadge status={item.status} /></td><td><div className="flex gap-2"><Button size="sm" variant="secondary" onClick={() => setSelected(item)}><FiEye /> Detail</Button><Button size="sm" onClick={() => updateDonationStatus(item.id, "active")} disabled={item.status === "active"}><FiCheck /> Aktifkan</Button><Button size="sm" variant="secondary" onClick={() => updateDonationStatus(item.id, "rejected")} disabled={item.status === "rejected"}><FiX /> Tolak</Button></div></td></tr>)}</tbody></table></div>}
    </section>
    <DonationDetail donation={selected} profiles={profiles} onClose={() => setSelected(null)} />
  </>;
}

export function AdminRequestsPage() {
  const { requests, donations, profiles, loading, updateRequestStatus } = useDishconData();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<FoodRequest | null>(null);
  const filtered = useMemo(() => requests.filter((item) => {
    const recipient = profileLabel(profiles, item.recipient_id);
    return `${item.id} ${item.food_name} ${recipient}`.toLowerCase().includes(q.toLowerCase()) && (status === "all" || item.status === status);
  }), [profiles, q, requests, status]);

  return <>
    <section className="soft-panel p-5">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="text-2xl font-black text-brand-900">Manajemen & Verifikasi Pengajuan</h2><p className="text-stone-500">Pengajuan terhubung dengan profil penerima dan donasi yang dipilih.</p></div><div className="flex gap-2"><div className="relative"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" /><Input value={q} onChange={(event) => setQ(event.target.value)} className="pl-10" placeholder="Cari pengajuan..." /></div><select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-2xl border border-stone-200 px-3 text-sm font-bold"><option value="all">Semua</option><option value="pending">Menunggu</option><option value="approved">Disetujui</option><option value="rejected">Ditolak</option><option value="completed">Selesai</option></select></div></div>
      {loading ? <p>Memuat data...</p> : filtered.length === 0 ? <EmptyState title="Belum ada pengajuan" description="Pengajuan penerima akan tampil otomatis setelah dikirim dari halaman katalog." /> : <div className="overflow-x-auto"><table className="mockup-table min-w-[1050px] w-full"><thead><tr><th>ID</th><th>Penerima</th><th>Makanan</th><th>Donatur</th><th>Porsi</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td>{item.id}</td><td>{profileLabel(profiles, item.recipient_id)}</td><td><b>{item.food_name}</b><p className="text-xs text-stone-500">{"Pengambilan mandiri"}</p></td><td>{profileLabel(profiles, item.donor_id)}</td><td>{item.portions}</td><td><StatusBadge status={item.status} /></td><td><div className="flex gap-2"><Button size="sm" variant="secondary" onClick={() => setSelected(item)}><FiEye /> Detail</Button><Button size="sm" onClick={() => updateRequestStatus(item.id, "approved")} disabled={item.status === "approved"}><FiCheck /> Setujui</Button><Button size="sm" variant="secondary" onClick={() => updateRequestStatus(item.id, "rejected")} disabled={item.status === "rejected"}><FiX /> Tolak</Button>{item.status === "approved" && <Button size="sm" onClick={() => updateRequestStatus(item.id, "completed")}>Selesaikan</Button>}</div></td></tr>)}</tbody></table></div>}
    </section>
    <RequestDetail request={selected} profiles={profiles} donations={donations} onClose={() => setSelected(null)} />
  </>;
}

export function AdminUsersPage() {
  const { profiles, loading } = useDishconData();
  const [q, setQ] = useState("");
  const filtered = profiles.filter((item) => `${item.name} ${item.email} ${item.role} ${item.organization || ""}`.toLowerCase().includes(q.toLowerCase()));
  return <section className="soft-panel p-6"><div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h2 className="text-2xl font-black text-brand-900">Manajemen Pengguna</h2><p className="mt-1 text-stone-500">Profil donatur, penerima, dan admin terpusat untuk keperluan verifikasi.</p></div><div className="relative"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" /><Input value={q} onChange={(event) => setQ(event.target.value)} className="pl-10" placeholder="Cari pengguna..." /></div></div>{loading ? <p>Memuat pengguna...</p> : filtered.length === 0 ? <EmptyState title="Belum ada pengguna" description="Daftar pengguna akan muncul setelah akun dibuat." /> : <div className="overflow-x-auto"><table className="mockup-table min-w-[850px] w-full"><thead><tr><th>Nama</th><th>Email</th><th>Role</th><th>Organisasi</th><th>Alamat</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td><b>{item.name}</b><p className="text-xs text-stone-500">{item.phone || "-"}</p></td><td>{item.email}</td><td><StatusBadge status={item.role} /></td><td>{item.organization || "-"}</td><td>{item.address || "-"}</td></tr>)}</tbody></table></div>}</section>;
}

export function AdminAiPage() {
  const { donations } = useDishconData();
  const assessed = donations.filter((item) => item.nutrition && item.expiry_risk);
  const providers = Array.from(new Set(assessed.map((item) => String(item.nutrition?.provider || "unknown"))));
  return <div className="grid gap-6 lg:grid-cols-[1fr_340px]"><section className="soft-panel p-6"><h2 className="text-2xl font-black text-brand-900">Implementasi Artificial Intelligence</h2><p className="mt-2 text-stone-500">AI sudah terhubung ke form donasi dan hasil analisis tersimpan bersama data makanan.</p><div className="mt-6 grid gap-4 md:grid-cols-2"><div className="rounded-3xl border border-blue-100 bg-blue-50 p-5"><b className="text-blue-900">AI Nutrition Estimator</b><p className="mt-2 text-sm text-blue-800">Menghasilkan estimasi kalori, makronutrisi, serat, serta potensi alergen.</p></div><div className="rounded-3xl border border-orange-100 bg-orange-50 p-5"><b className="text-orange-900">AI Expiry Risk Detection</b><p className="mt-2 text-sm text-orange-800">Mempertimbangkan jenis hidangan, waktu produksi, batas ambil, dan penyimpanan.</p></div></div><h3 className="mt-7 text-lg font-black text-brand-900">Hasil Assessment Terbaru</h3>{assessed.length === 0 ? <EmptyState title="Belum ada assessment" description="Jalankan AI dari formulir donasi untuk menampilkan hasil di halaman ini." /> : <div className="mt-4 space-y-3">{assessed.slice(0, 8).map((item) => <div key={item.id} className="grid gap-3 rounded-3xl border border-stone-200 p-4 md:grid-cols-[1fr_180px_1fr]"><div><b>{item.food_name}</b><p className="text-xs text-stone-500">{String(item.nutrition?.provider || "AI")}</p></div><p className="text-sm font-bold text-blue-700">{String(item.nutrition?.calories_estimate || "-")}</p><p className="text-sm text-orange-700">{item.expiry_risk}</p></div>)}</div>}</section><aside className="space-y-5"><div className="soft-panel p-6"><FiActivity className="text-2xl text-brand-700" /><h3 className="mt-3 font-black text-brand-900">Status Implementasi</h3><p className="mt-3 text-4xl font-black text-brand-700">{assessed.length}</p><p className="text-sm text-stone-500">donasi sudah memiliki hasil AI</p></div><div className="soft-panel p-6"><h3 className="font-black text-brand-900">Provider Aktif</h3><div className="mt-3 flex flex-wrap gap-2">{providers.length ? providers.map((provider) => <span key={provider} className="rounded-full bg-stone-100 px-3 py-2 text-xs font-bold">{provider}</span>) : <span className="text-sm text-stone-500">OpenRouter atau local rules akan tercatat setelah assessment.</span>}</div></div></aside></div>;
}

export function AdminZonesPage() {
  const { donations } = useDishconData();
  const zones = useMemo(() => {
    const grouped = new Map<string, Donation[]>();
    donations.forEach((donation) => grouped.set(donation.location, [...(grouped.get(donation.location) || []), donation]));
    return [...grouped.entries()].map(([location, items]) => ({ location, items, portions: items.reduce((sum, item) => sum + item.portions, 0), active: items.filter((item) => item.status === "active").length }));
  }, [donations]);
  const [selected, setSelected] = useState("");
  const selectedLocation = selected || zones[0]?.location || "Indonesia";

  return <div className="grid gap-6 xl:grid-cols-[360px_1fr]"><aside className="soft-panel p-5"><h2 className="text-2xl font-black text-brand-900">Zona Distribusi</h2><p className="mt-2 text-sm text-stone-500">Zona dibuat otomatis dari lokasi yang diinput donatur, bukan lokasi statis.</p>{zones.length === 0 ? <div className="mt-5"><EmptyState title="Belum ada zona" description="Lokasi akan muncul setelah donatur mengirim form donasi." /></div> : <div className="mt-5 space-y-3">{zones.map((zone) => <button key={zone.location} type="button" onClick={() => setSelected(zone.location)} className={`w-full rounded-3xl border p-4 text-left transition ${selectedLocation === zone.location ? "border-brand-600 bg-brand-50" : "border-stone-200 hover:border-brand-300"}`}><div className="flex items-start gap-3"><FiMapPin className="mt-1 shrink-0 text-brand-700" /><div><b className="block">{zone.location}</b><p className="mt-1 text-xs text-stone-500">{zone.items.length} donasi · {zone.portions} porsi · {zone.active} aktif</p></div></div></button>)}</div>}</aside><section className="soft-panel overflow-hidden p-5"><div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h3 className="text-xl font-black text-brand-900">Peta Zona Terpilih</h3><p className="text-sm text-stone-500">{selectedLocation}</p></div><Button type="button" variant="secondary" onClick={() => window.open(buildMapsSearchUrl(selectedLocation), "_blank", "noopener,noreferrer")}><FiMap /> Buka Google Maps</Button></div><iframe title={`Peta ${selectedLocation}`} src={buildMapsEmbedUrl(selectedLocation)} className="h-[520px] w-full rounded-[2rem] border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></section></div>;
}

export function AdminProfilePage() { return <ProfilePage role="admin" />; }
export function AdminNotificationsPage() { return <NotificationsPage role="admin" />; }
export function AdminSettingsPage() { return <SettingsPage role="admin" />; }
