"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import Link from "next/link";
import { FiCheckCircle, FiMap, FiMinus, FiPlus, FiSend, FiUser, FiUsers, FiZap } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useDishconData } from "@/lib/dishcon-store";
import { useAuth } from "@/lib/auth-context";
import { buildMapsDirectionsUrl } from "@/lib/maps";
import { Field } from "@/components/pages/shared";

export function RequestFormPage() {
  const params = useSearchParams();
  const donationId = params.get("donation");
  const { user } = useAuth();
  const { donations, createRequest } = useDishconData();
  const selected = useMemo(() => donations.find((d) => d.id === donationId), [donationId, donations]);
  const [portions, setPortions] = useState(1);
  const [kind, setKind] = useState<"organization" | "personal">("organization");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    const form = new FormData(e.currentTarget);
    const food_name = selected?.food_name || String(form.get("food_name") || "").trim();
    if (!food_name) {
      setMessage("Pilih makanan dari katalog atau isi nama makanan terlebih dahulu.");
      return;
    }
    if (selected && selected.status !== "active") {
      setMessage("Donasi ini sudah tidak tersedia untuk pengajuan baru.");
      return;
    }
    if (selected && portions > selected.portions) {
      setMessage(`Jumlah maksimal yang tersedia adalah ${selected.portions} porsi.`);
      return;
    }
    setLoading(true);
    try {
      const note = `[${kind === "organization" ? "Organisasi/Komunitas" : "Perorangan"}] ${String(form.get("note") || "")}`.trim();
      await createRequest({ donation_id: selected?.id, donor_id: selected?.donor_id, food_name, portions, pickup_method: "pickup", note });
      setMessage("Pengajuan berhasil dibuat. Status awal: menunggu persetujuan admin. Setelah disetujui, status berubah menjadi belum diambil sampai admin menandai sudah diambil.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Pengajuan gagal dibuat.");
    } finally {
      setLoading(false);
    }
  }

  function changePortions(next: number) {
    const maximum = selected?.portions || 999;
    setPortions(Math.max(1, Math.min(maximum, next)));
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <form onSubmit={submit} className="space-y-6">
        <section className="soft-panel p-6">
          <div className="mb-5 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-brand-700 font-black text-white">1</span><h2 className="text-xl font-black text-brand-900">Makanan yang Dipilih</h2></div>
          {selected ? (
            <div className="overflow-hidden rounded-3xl border border-stone-200">
              <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
                <div className="grid h-28 w-full place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-50 to-amber-50 text-4xl md:w-40">{selected.image_url ? <img src={selected.image_url} alt={selected.food_name} className="h-full w-full object-cover" /> : "🍱"}</div>
                <div className="flex-1"><h3 className="text-xl font-black text-ink">{selected.food_name}</h3><p className="text-stone-500">{selected.location}</p><p className="mt-2 text-sm font-bold text-brand-700">{selected.portions} porsi tersedia</p><p className="mt-2 text-xs font-bold text-blue-700"><FiZap className="mr-1 inline" /> {selected.expiry?.risk_level || selected.expiry_risk || "Analisis AI belum tersedia"}</p><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><span className="rounded-xl bg-blue-50 p-2 text-blue-900"><b>Kalori/porsi</b><br />{String(selected.nutrition?.calories_estimate ?? selected.nutrition?.calories ?? "-")}</span><span className="rounded-xl bg-blue-50 p-2 text-blue-900"><b>Protein</b><br />{String(selected.nutrition?.protein ?? "-")}</span><span className="rounded-xl bg-blue-50 p-2 text-blue-900"><b>Karbohidrat</b><br />{String(selected.nutrition?.carbohydrate ?? selected.nutrition?.carbs ?? "-")}</span><span className="rounded-xl bg-blue-50 p-2 text-blue-900"><b>Lemak</b><br />{String(selected.nutrition?.fat ?? "-")}</span></div><div className="mt-3 rounded-2xl bg-orange-50 p-3 text-xs leading-5 text-orange-900"><b>Aman dikonsumsi:</b> {selected.expiry?.safe_hours !== undefined ? `${selected.expiry.safe_hours} jam` : "-"}<br /><b>Penyimpanan:</b> {selected.expiry?.storage_recommendation || selected.nutrition?.recommendation || "-"}</div></div>
                <div className="text-sm text-stone-500"><b className="block text-ink">Ambil sebelum</b>{new Date(selected.pickup_deadline).toLocaleString("id-ID")}</div>
              </div>
              <div className="m-4 mt-0 flex flex-wrap gap-3"><Button type="button" variant="secondary" onClick={() => window.open(buildMapsDirectionsUrl(user?.address, selected.location), "_blank", "noopener,noreferrer")}><FiMap /> Lihat Rute dari Alamat Saya</Button><Button asChild variant="secondary"><Link href={`/recipient/food/${selected.id}`}>Buka Detail Lengkap</Link></Button></div>
            </div>
          ) : (
            <div className="rounded-3xl border border-stone-200 p-4"><Field label="Nama Makanan"><Input name="food_name" placeholder="Isi manual bila belum memilih dari katalog" /></Field></div>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="soft-panel p-6">
            <div className="mb-5 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-brand-700 font-black text-white">2</span><h2 className="text-xl font-black text-brand-900">Identitas Penerima</h2></div>
            <div className="space-y-4"><Field label="Nama Lengkap"><Input value={user?.name || ""} readOnly /></Field><Field label="Nomor WhatsApp"><Input value={user?.phone || ""} readOnly /></Field><Field label="Alamat Awal Navigasi"><Input value={user?.address || ""} placeholder="Lengkapi dari profil" readOnly /></Field></div>
          </section>

          <section className="soft-panel p-6">
            <div className="mb-5 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-brand-700 font-black text-white">3</span><h2 className="text-xl font-black text-brand-900">Jenis Penerima</h2></div>
            <div className="grid gap-3">
              <button type="button" onClick={() => setKind("organization")} className={`rounded-3xl border p-4 text-left ${kind === "organization" ? "border-brand-600 bg-brand-50" : "border-stone-200"}`}><FiUsers className="mr-3 inline text-brand-700" /><b>Organisasi / Komunitas</b><p className="mt-1 text-sm text-stone-500">Mewakili lembaga, komunitas, atau kelompok.</p></button>
              <button type="button" onClick={() => setKind("personal")} className={`rounded-3xl border p-4 text-left ${kind === "personal" ? "border-brand-600 bg-brand-50" : "border-stone-200"}`}><FiUser className="mr-3 inline text-brand-700" /><b>Perorangan</b><p className="mt-1 text-sm text-stone-500">Mengajukan untuk kebutuhan pribadi.</p></button>
            </div>
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="soft-panel p-6">
            <div className="mb-5 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-brand-700 font-black text-white">4</span><h2 className="text-xl font-black text-brand-900">Jumlah Porsi</h2></div>
            <div className="flex items-center gap-3"><Button type="button" variant="secondary" onClick={() => changePortions(portions - 1)}><FiMinus /></Button><Input type="number" min={1} max={selected?.portions} value={portions} onChange={(e) => changePortions(Number(e.target.value) || 1)} className="text-center text-xl font-black" /><Button type="button" variant="secondary" onClick={() => changePortions(portions + 1)}><FiPlus /></Button></div>
            <p className="mt-3 text-center text-sm text-stone-500">Maksimal {selected?.portions || "mengikuti stok"} porsi.</p>
          </section>

          <section className="soft-panel p-6">
            <div className="mb-5 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-brand-700 font-black text-white">5</span><h2 className="text-xl font-black text-brand-900">Metode Pengambilan</h2></div>
            <div className="rounded-3xl border border-brand-600 bg-brand-50 p-5">
              <FiUser className="mb-2 text-xl text-brand-700" />
              <b className="block text-brand-900">Pengambilan mandiri</b>
              <p className="mt-1 text-sm leading-6 text-stone-600">Penerima mengambil makanan langsung di lokasi donatur. Sistem tidak menyediakan opsi pengantaran atau kurir.</p>
            </div>
          </section>
        </div>

        <section className="soft-panel p-6"><Field label="Catatan Tambahan"><Textarea name="note" maxLength={300} placeholder="Sampaikan kebutuhan Anda secara singkat." /></Field></section>
        {message && <p className={`rounded-2xl p-4 text-sm font-bold ${message.includes("berhasil") ? "bg-brand-50 text-brand-700" : "bg-red-50 text-red-700"}`}>{message}</p>}
        <Button disabled={loading || (selected ? selected.status !== "active" : false)} className="h-[52px] w-full shadow-lg shadow-brand-700/20"><FiSend /> {loading ? "Mengirim Pengajuan..." : "Ajukan Permintaan"}</Button>
      </form>

      <aside className="space-y-5">
        <div className="soft-panel p-6"><h3 className="text-xl font-black text-brand-900">Ringkasan Pengajuan</h3><div className="mt-5 space-y-3"><div className="rounded-2xl bg-brand-50 p-4"><b>Kesesuaian Porsi</b><p className="text-sm text-stone-600">Mengajukan {portions} porsi dari maksimum {selected?.portions || "stok tersedia"}.</p></div><div className="rounded-2xl bg-orange-50 p-4"><b>Alur Verifikasi</b><p className="text-sm text-stone-600">Pengajuan masuk ke admin, lalu status diperbarui di riwayat Anda.</p></div></div></div>
        <div className="rounded-[2rem] border border-brand-100 bg-brand-50 p-5"><FiCheckCircle className="text-brand-700" /><h3 className="mt-2 font-black text-brand-900">Navigasi Dinamis</h3><p className="text-sm text-brand-800">Rute menggunakan alamat profil penerima sebagai titik awal dan lokasi input donatur sebagai tujuan.</p></div>
      </aside>
    </div>
  );
}
