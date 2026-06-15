import { Suspense } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { RegisterCard } from "@/components/auth/auth-card";
import { FoodSharingIllustration } from "@/components/landing/food-sharing-illustration";

const registerBenefits = [
  ["🥗", "Deteksi Nutrisi & Alergen", "Informasi makanan lebih jelas untuk penerima."],
  ["⏳", "Prediksi Kedaluwarsa", "Bantu makanan segera disalurkan sebelum rusak."],
  ["📋", "Riwayat Pengajuan", "Semua aktivitas donasi tercatat rapi."]
];

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto grid min-h-screen w-full max-w-[1440px] gap-10 px-5 py-8 lg:grid-cols-[1.1fr_.9fr] lg:px-12">
        <section className="flex flex-col">
          <BrandLogo />
          <div className="mt-14 max-w-2xl">
            <span className="inline-flex rounded-full bg-brand-50 px-5 py-3 text-sm font-extrabold text-brand-700">🤝 Food Sharing Platform</span>
            <h1 className="mt-8 text-5xl font-black leading-tight text-brand-900 md:text-7xl">Mulai Berbagi Kebaikan</h1>
            <p className="mt-5 max-w-2xl text-xl leading-8 text-stone-500">Buat akun DishCon dan bantu makanan berlebih tersalurkan kepada orang yang membutuhkan secara cepat dan tepat.</p>
          </div>
          <div className="mt-12 hidden lg:block"><FoodSharingIllustration /></div>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {registerBenefits.map(([emoji, title, desc]) => (
              <div key={title} className="rounded-3xl border border-stone-200 bg-white p-6 shadow-card">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-xl">{emoji}</span>
                <h3 className="mt-5 text-lg font-extrabold text-brand-900">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-stone-500">{desc}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="flex items-center justify-center"><Suspense><RegisterCard /></Suspense></section>
      </div>
    </main>
  );
}
