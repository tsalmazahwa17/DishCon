"use client";

import { useRef, useState } from "react";
import { FiCamera, FiCheckCircle, FiClock, FiImage, FiLoader, FiMapPin, FiSend, FiUploadCloud, FiZap } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useDishconData } from "@/lib/dishcon-store";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import type { AiAssessment } from "@/lib/types";
import { Field } from "@/components/pages/shared";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function safeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/-+/g, "-");
}

async function compressImageToDataUrl(file: File): Promise<string> {
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Foto gagal dibaca."));
    reader.readAsDataURL(file);
  });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("Format gambar tidak dapat diproses."));
    element.src = source;
  });
  const maxSide = 1280;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Browser tidak mendukung pemrosesan gambar.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.78);
}

export function DonateFormPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { createDonation } = useDishconData();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [halal, setHalal] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<AiAssessment | null>(null);
  const [assessing, setAssessing] = useState(false);
  const [activeInsight, setActiveInsight] = useState<"nutrition" | "expiry" | null>(null);

  function chooseFile(nextFile?: File) {
    if (!nextFile) return;
    if (!nextFile.type.startsWith("image/")) {
      setMessage("File harus berupa gambar PNG, JPG, atau WEBP.");
      return;
    }
    if (nextFile.size > MAX_FILE_SIZE) {
      setMessage("Ukuran foto maksimal 10MB.");
      return;
    }
    setFile(nextFile);
    setPreview(URL.createObjectURL(nextFile));
    setMessage("");
  }

  function assessmentPayload() {
    if (!formRef.current) return null;
    const form = new FormData(formRef.current);
    const food_name = String(form.get("food_name") || "").trim();
    const description = String(form.get("description") || "").trim();
    const production_time = String(form.get("production_time") || "");
    const pickup_deadline = String(form.get("pickup_deadline") || "");
    const storage = String(form.get("storage_method") || "");
    const portions = Number(form.get("portions") || 0);
    if (!food_name) return null;
    return { food_name, description, production_time, pickup_deadline, storage, portions, halal };
  }

  async function runAssessment(focus: "nutrition" | "expiry") {
    setActiveInsight(focus);
    const payload = assessmentPayload();
    if (!payload) {
      setMessage("Isi nama makanan terlebih dahulu agar AI dapat menganalisis.");
      return null;
    }
    setMessage("");
    setAssessing(true);
    try {
      const response = await fetch("/api/ai-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || "Analisis AI gagal.");
      setAssessment(result as AiAssessment);
      return result as AiAssessment;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Analisis AI gagal.");
      return null;
    } finally {
      setAssessing(false);
    }
  }

  async function uploadImage() {
    if (!file || !user) return null;
    if (supabase) {
      const path = `${user.id}/${Date.now()}-${safeFileName(file.name)}`;
      const { error } = await supabase.storage.from("donation-images").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type
      });
      if (error) throw new Error(`Upload foto gagal: ${error.message}`);
      const { data } = supabase.storage.from("donation-images").getPublicUrl(path);
      return data.publicUrl;
    }
    return compressImageToDataUrl(file);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formElement = e.currentTarget;
    setMessage("");
    const form = new FormData(formElement);
    const food_name = String(form.get("food_name") || "").trim();
    const category = String(form.get("category") || "Makanan Berat");
    const portions = Number(form.get("portions") || 0);
    const location = String(form.get("location") || "").trim();
    const pickup_deadline = String(form.get("pickup_deadline") || "");
    const production_time = String(form.get("production_time") || "");
    const storage_method = String(form.get("storage_method") || "");
    const description = String(form.get("description") || "").trim();
    if (!food_name || !category || !portions || !location || !pickup_deadline || !production_time || !storage_method) {
      setMessage("Lengkapi nama makanan, kategori, porsi, lokasi, waktu produksi, penyimpanan, dan batas ambil.");
      return;
    }
    if (!file) {
      setMessage("Unggah foto makanan untuk proses verifikasi.");
      return;
    }

    setLoading(true);
    try {
      const finalAssessment = assessment || await runAssessment("nutrition");
      if (!finalAssessment) throw new Error("Analisis AI belum berhasil. Silakan coba kembali.");
      const image_url = await uploadImage();
      await createDonation({
        food_name,
        category,
        portions,
        location,
        pickup_deadline,
        production_time,
        storage_method,
        description,
        halal,
        nutrition: {
          ...finalAssessment.nutrition,
          allergens: finalAssessment.allergens,
          recommendation: finalAssessment.recommendation,
          provider: finalAssessment.provider,
          confidence: finalAssessment.confidence,
          assessed_at: finalAssessment.assessed_at
        },
        expiry_risk: finalAssessment.expiry_risk,
        expiry: finalAssessment.expiry || null,
        image_url
      });
      setMessage("Donasi berhasil dibuat, dianalisis AI, dan dikirim ke admin untuk verifikasi.");
      formElement.reset();
      setHalal(true);
      setFile(null);
      setPreview(null);
      setAssessment(null);
      setActiveInsight(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Donasi gagal disimpan.");
    } finally {
      setLoading(false);
    }
  }

  const nutrition = assessment?.nutrition || {};
  const expiry = assessment?.expiry || {};

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <form ref={formRef} onSubmit={submit} className="space-y-6">
        <section className="soft-panel p-6">
          <div className="mb-6 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-brand-700 font-black text-white">1</span><h2 className="text-xl font-black text-brand-900">Informasi Makanan</h2></div>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Nama Makanan"><Input name="food_name" required placeholder="Contoh: Nasi Box Ayam Bakar" /></Field>
            <Field label="Kategori"><select name="category" className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 font-semibold outline-none focus:ring-2 focus:ring-brand-500"><option>Makanan Berat</option><option>Snack/Kue</option><option>Buah & Sayur</option><option>Minuman</option></select></Field>
            <Field label="Jumlah Porsi"><Input name="portions" type="number" min="1" required placeholder="20" /></Field>
            <Field label="Lokasi Pengambilan"><Input name="location" required placeholder="Masukkan alamat lengkap atau nama tempat" /></Field>
            <Field label="Waktu Produksi"><Input name="production_time" type="datetime-local" required /></Field>
            <Field label="Batas Ambil"><Input name="pickup_deadline" type="datetime-local" required /></Field>
            <div className="md:col-span-2"><Field label="Cara Penyimpanan"><select name="storage_method" required className="h-12 w-full rounded-2xl border border-stone-200 bg-white px-4 font-semibold outline-none focus:ring-2 focus:ring-brand-500"><option value="">Pilih cara penyimpanan</option><option value="suhu ruang tertutup">Suhu ruang tertutup</option><option value="lemari pendingin 2-5°C">Lemari pendingin 2-5°C</option><option value="freezer">Freezer</option><option value="penghangat makanan">Penghangat makanan</option></select></Field></div>
          </div>
          <div className="mt-5"><Field label="Deskripsi"><Textarea name="description" required placeholder="Jelaskan bahan utama, kondisi makanan, dan catatan keamanan pangan." /></Field></div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={() => setHalal(!halal)} aria-pressed={halal} className={`rounded-full border px-4 py-2 text-sm font-black transition ${halal ? "border-brand-600 bg-brand-50 text-brand-700" : "border-stone-200 text-stone-500"}`}>Halal: {halal ? "Ya" : "Tidak"}</button>
            <button type="button" onClick={() => runAssessment("nutrition")} disabled={assessing} aria-pressed={activeInsight === "nutrition"} className={`rounded-full border px-4 py-2 text-sm font-black transition ${activeInsight === "nutrition" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-stone-200 text-stone-500 hover:border-blue-400"}`}>{assessing ? <FiLoader className="mr-2 inline animate-spin" /> : <FiZap className="mr-2 inline" />} AI Nutrition</button>
            <button type="button" onClick={() => runAssessment("expiry")} disabled={assessing} aria-pressed={activeInsight === "expiry"} className={`rounded-full border px-4 py-2 text-sm font-black transition ${activeInsight === "expiry" ? "border-orange-600 bg-orange-50 text-orange-700" : "border-stone-200 text-stone-500 hover:border-orange-400"}`}>{assessing ? <FiLoader className="mr-2 inline animate-spin" /> : <FiClock className="mr-2 inline" />} Expiry Risk</button>
          </div>

          {assessment && (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className={`rounded-3xl border p-5 ${activeInsight === "nutrition" ? "border-blue-200 bg-blue-50" : "border-stone-200 bg-white"}`}>
                <div className="flex items-center justify-between"><h3 className="font-black text-ink">Hasil AI Nutrition</h3><span className="text-xs font-bold text-blue-700">{assessment.provider}</span></div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-stone-500">Kalori</span><b className="block">{String(nutrition?.calories_estimate ?? nutrition?.calories ?? "-")}</b></div>
                  <div><span className="text-stone-500">Protein</span><b className="block">{String(nutrition?.protein ?? "-")}</b></div>
                  <div><span className="text-stone-500">Karbohidrat</span><b className="block">{String(nutrition?.carbohydrate ?? nutrition?.carbs ?? "-")}</b></div>
                  <div><span className="text-stone-500">Lemak</span><b className="block">{String(nutrition?.fat ?? "-")}</b></div>
                </div>
                <p className="mt-4 text-sm text-stone-600"><b>Bahan utama:</b> {Array.isArray(nutrition?.ingredients_detected) && nutrition.ingredients_detected.length ? nutrition.ingredients_detected.join(", ") : "Belum terdeteksi"}</p>
                <p className="mt-2 text-sm text-stone-600"><b>Bumbu utama:</b> {Array.isArray(nutrition?.seasonings_detected) && nutrition.seasonings_detected.length ? nutrition.seasonings_detected.join(", ") : "Belum terdeteksi"}</p>
                <p className="mt-2 text-sm text-stone-600"><b>Alergen:</b> {Array.isArray(assessment?.allergens) && assessment.allergens.length > 0 ? assessment.allergens.join(", ") : "Tidak teridentifikasi"}</p>
                <p className="mt-2 text-sm text-stone-600"><b>Catatan:</b> {String(nutrition?.nutrition_note || "-")}</p>
              </div>
              <div className={`rounded-3xl border p-5 ${activeInsight === "expiry" ? "border-orange-200 bg-orange-50" : "border-stone-200 bg-white"}`}>
                <h3 className="font-black text-ink">Hasil Expiry Risk</h3>
                <p className="mt-3 text-lg font-black text-orange-700">{String(expiry?.risk_level || assessment.expiry_risk || "-")}</p>
                <div className="mt-3 space-y-2 text-sm leading-6 text-stone-600">
                  <p><b>Aman dikonsumsi:</b> {String(expiry?.safe_hours ?? "-")} jam</p>
                  <p><b>Konsumsi sebelum:</b> {String(expiry?.recommended_consume_before || "-")}</p>
                  <p><b>Penyimpanan:</b> {String(expiry?.storage_recommendation || assessment.recommendation || "-")}</p>
                  <p><b>Alasan:</b> {String(expiry?.expiry_reason || "-")}</p>
                  <p><b>Peringatan:</b> {Array.isArray(expiry?.food_safety_warnings) && expiry.food_safety_warnings.length ? expiry.food_safety_warnings.join(", ") : "Tidak ada peringatan khusus"}</p>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="soft-panel p-6">
          <div className="mb-6 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-brand-700 font-black text-white">2</span><h2 className="text-xl font-black text-brand-900">Foto & Verifikasi</h2></div>
          <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => chooseFile(event.target.files?.[0])} />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => { event.preventDefault(); chooseFile(event.dataTransfer.files?.[0]); }}
            className="w-full overflow-hidden rounded-3xl border-2 border-dashed border-stone-300 bg-stone-50 text-center transition hover:border-brand-500 hover:bg-brand-50"
          >
            {preview ? (
              <div className="relative">
                <img src={preview} alt="Pratinjau makanan" className="h-72 w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-black/60 p-3 text-sm font-bold text-white"><FiImage className="mr-2 inline" /> Klik untuk mengganti foto</div>
              </div>
            ) : (
              <div className="p-10">
                <FiUploadCloud className="mx-auto text-5xl text-brand-700" />
                <p className="mt-3 font-black text-ink">Klik atau tarik foto makanan ke sini</p>
                <p className="mt-1 text-sm text-stone-500">PNG, JPG, atau WEBP maksimal 10MB.</p>
              </div>
            )}
          </button>
          {file && <p className="mt-3 text-sm font-bold text-brand-700"><FiCamera className="mr-2 inline" /> {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>}
        </section>

        {message && <p className={`rounded-2xl p-4 text-sm font-bold ${message.includes("berhasil") ? "bg-brand-50 text-brand-700" : "bg-red-50 text-red-700"}`}>{message}</p>}
        <Button disabled={loading || assessing} className="h-[52px] w-full shadow-lg shadow-brand-700/20"><FiSend /> {loading ? "Mengunggah dan Menyimpan..." : "Kirim Donasi untuk Verifikasi"}</Button>
      </form>

      <aside className="space-y-5">
        <div className="soft-panel p-6">
          <h3 className="text-xl font-black text-brand-900">AI Food Assessment</h3>
          <p className="mt-2 text-sm text-stone-500">Analisis dapat dijalankan sebelum donasi dikirim. Hasilnya tersimpan dan dapat diperiksa admin.</p>
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl bg-brand-50 p-4"><FiZap className="mr-2 inline text-brand-700" /><b>Nutrition & Alergen</b><p className="text-sm text-stone-600">Estimasi makronutrisi dan potensi alergen dari deskripsi makanan.</p></div>
            <div className="rounded-2xl bg-orange-50 p-4"><FiClock className="mr-2 inline text-orange-700" /><b>Expiry Risk</b><p className="text-sm text-stone-600">Menggunakan waktu produksi, batas ambil, dan cara penyimpanan.</p></div>
            <div className="rounded-2xl bg-blue-50 p-4"><FiMapPin className="mr-2 inline text-blue-700" /><b>Lokasi Aktual</b><p className="text-sm text-stone-600">Alamat yang diinput menjadi tujuan navigasi penerima dan zona admin.</p></div>
          </div>
        </div>
        <div className="rounded-[2rem] border border-brand-100 bg-brand-50 p-5"><FiCheckCircle className="text-brand-700" /><p className="mt-2 text-sm font-semibold text-brand-900">Foto, hasil AI, dan seluruh input akan muncul pada halaman verifikasi admin.</p></div>
      </aside>
    </div>
  );
}
