"use client";

import { useState } from "react";
import { FiDownload, FiSearch } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDishconData } from "@/lib/dishcon-store";
import { EmptyState, StatusBadge } from "@/components/pages/shared";

export function DonorHistoryPage() {
  const { donations } = useDishconData();
  const [q, setQ] = useState("");
  const filtered = donations.filter((d) => `${d.food_name} ${d.category} ${d.location} ${d.status}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <section className="soft-panel p-5">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h2 className="text-xl font-black text-brand-900">Halaman Riwayat Donasi</h2><p className="text-stone-500">Semua riwayat berasal dari database akun donatur.</p></div><Button variant="secondary"><FiDownload /> Export</Button></div>
      <div className="relative mb-5"><FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" /><Input value={q} onChange={(e) => setQ(e.target.value)} className="pl-11" placeholder="Cari riwayat donasi..." /></div>
      {filtered.length === 0 ? <EmptyState title="Belum ada riwayat donasi" description="Akun baru dimulai bersih. Riwayat akan muncul setelah Anda membuat donasi makanan." /> : <div className="overflow-x-auto"><table className="mockup-table min-w-[800px] w-full"><thead><tr><th>Makanan</th><th>Porsi</th><th>Lokasi</th><th>Waktu Produksi</th><th>Status</th></tr></thead><tbody>{filtered.map((d) => <tr key={d.id}><td><b>{d.food_name}</b><p className="text-xs text-stone-500">{d.category}</p></td><td>{d.portions} porsi</td><td>{d.location}</td><td>{d.production_time ? new Date(d.production_time).toLocaleString("id-ID") : "-"}</td><td><StatusBadge status={d.status} /></td></tr>)}</tbody></table></div>}
    </section>
  );
}

export function RecipientHistoryPage() {
  const { requests } = useDishconData();
  const [q, setQ] = useState("");
  const filtered = requests.filter((r) => `${r.id} ${r.food_name} ${r.status}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <section className="soft-panel p-5">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h2 className="text-xl font-black text-brand-900">Halaman Riwayat Pengajuan</h2><p className="text-stone-500">Track status permintaan makanan dari donatur.</p></div><Button variant="secondary"><FiDownload /> Export</Button></div>
      <div className="relative mb-5"><FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" /><Input value={q} onChange={(e) => setQ(e.target.value)} className="pl-11" placeholder="Search requests..." /></div>
      {filtered.length === 0 ? <EmptyState title="Belum ada riwayat pengajuan" description="Akun baru belum memiliki pengajuan. Setelah memilih makanan dari katalog, statusnya akan tersimpan di sini." /> : <div className="overflow-x-auto"><table className="mockup-table min-w-[760px] w-full"><thead><tr><th>ID Pengajuan</th><th>Tanggal</th><th>Nama Makanan</th><th>Porsi</th><th>Status</th></tr></thead><tbody>{filtered.map((r) => <tr key={r.id}><td>{r.id}</td><td>{new Date(r.created_at).toLocaleString("id-ID")}</td><td><b>{r.food_name}</b></td><td>{r.portions}</td><td><StatusBadge status={r.status} /></td></tr>)}</tbody></table></div>}
    </section>
  );
}
