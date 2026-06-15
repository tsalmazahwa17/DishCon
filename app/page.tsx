import Link from "next/link";
import { FiMail, FiMapPin, FiPhone } from "react-icons/fi";
import { BrandLogo } from "@/components/brand-logo";
import { HeroIllustration } from "@/components/landing/hero-illustration";
import { ImpactPosterVisual, SafetyPosterVisual } from "@/components/landing/campaign-poster-visuals";
import { PublicHeader } from "@/components/landing/public-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { featureCards, howItWorks, stats } from "@/lib/data";

export default function LandingPage() {
  const contactEmailLabel = process.env.NEXT_PUBLIC_CONTACT_EMAIL_LABEL || "Email DishCon";
  const contactEmailHref = process.env.NEXT_PUBLIC_CONTACT_EMAIL_HREF || "mailto:email@dishcon.id";
  const contactPhoneLabel = process.env.NEXT_PUBLIC_CONTACT_PHONE_LABEL || "Telepon DishCon";
  const contactPhoneHref = process.env.NEXT_PUBLIC_CONTACT_PHONE_HREF || "tel:+620000000000";

  return (
    <main className="min-h-screen bg-cream text-ink">
      <PublicHeader />
      <section id="beranda" className="container-page grid min-h-[640px] items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <span className="inline-flex rounded-full bg-brand-100 px-4 py-2 text-sm font-extrabold text-brand-700">#ZeroHunger</span>
          <h1 className="mt-8 max-w-2xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
            Bagikan Makanan Berlebih, <span className="block text-brand-600">Bantu yang Membutuhkan</span>
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-stone-600">DishCon menghubungkan donatur makanan dengan penerima melalui teknologi AI agar makanan tersalurkan lebih cepat, aman, dan tepat sasaran.</p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Button asChild size="lg"><Link href="/login">Mulai Donasi</Link></Button>
            <Button asChild variant="secondary" size="lg"><Link href="/login">Cari Makanan</Link></Button>
          </div>
        </div>
        <HeroIllustration />
      </section>

      <section className="container-page pb-16">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="overflow-hidden rounded-[2rem] border border-brand-100 bg-white shadow-card">
            <SafetyPosterVisual />
            <div className="p-6"><h3 className="font-black text-brand-900">Visual Kampanye Keamanan Pangan</h3><p className="mt-2 text-sm leading-7 text-stone-600">Poster pertama menegaskan proses unggah foto, AI assessment, dan verifikasi admin.</p></div>
          </div>
          <div className="overflow-hidden rounded-[2rem] border border-brand-100 bg-white shadow-card">
            <ImpactPosterVisual />
            <div className="p-6"><h3 className="font-black text-brand-900">Visual Kampanye Dampak</h3><p className="mt-2 text-sm leading-7 text-stone-600">Poster kedua sudah dilengkapi visual formal untuk presentasi pengurangan food waste.</p></div>
          </div>
          <div className="overflow-hidden rounded-[2rem] border border-brand-100 bg-white shadow-card">
            <div className="relative h-56 bg-gradient-to-br from-blue-500 to-brand-700 p-6 text-white">
              <FiMapPin className="text-4xl" />
              <h3 className="mt-5 text-2xl font-black">Smart Distribution</h3>
              <p className="mt-2 max-w-xs text-sm text-white/85">Peta dan rekomendasi lokasi membantu makanan sampai lebih cepat ke penerima.</p>
              <div className="absolute bottom-8 right-8 h-16 w-28 rounded-full bg-white/20" />
            </div>
            <div className="p-6 text-sm leading-7 text-stone-600">Visual formal untuk menjelaskan proses distribusi dan tracking donasi.</div>
          </div>
        </div>
      </section>

      <section className="container-page -mt-2 grid gap-6 pb-16 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="p-8 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-500"><Icon /></span>
              <p className="mt-5 text-3xl font-black">{item.number}</p>
              <p className="mt-1 text-sm text-stone-500">{item.label}</p>
            </Card>
          );
        })}
      </section>

      <section id="fitur" className="border-y border-stone-200 bg-white py-20">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black md:text-4xl">Fitur Unggulan DishCon with AI</h2>
            <p className="mt-4 text-stone-500">Teknologi cerdas kami memastikan setiap makanan yang disalurkan aman, bernutrisi, dan tepat waktu.</p>
          </div>
          <div className="mt-14 grid gap-7 md:grid-cols-2 xl:grid-cols-4">
            {featureCards.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="p-8 transition hover:-translate-y-1 hover:shadow-soft">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-500"><Icon className="h-6 w-6" /></span>
                  <h3 className="mt-7 text-xl font-extrabold">{item.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-stone-500">{item.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section id="cara-kerja" className="container-page py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-black md:text-4xl">Cara Kerja</h2>
          <p className="mt-4 text-stone-500">Proses donasi yang transparan, mudah, dan didukung kecerdasan buatan.</p>
        </div>
        <div className="relative mt-16 grid gap-8 lg:grid-cols-4">
          <div className="absolute left-[8%] right-[8%] top-8 hidden h-1 bg-brand-100 lg:block" />
          {howItWorks.map((item, index) => (
            <div key={item.title} className="relative text-center">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-600 text-2xl font-black text-white shadow-lg shadow-brand-600/25">{index + 1}</span>
              <h3 className="mt-6 font-extrabold">{item.title}</h3>
              <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-stone-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer id="tentang" className="bg-[#07101f] text-white">
        <div className="container-page py-12 text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm font-bold text-white/90">
            <a href={contactEmailHref} className="inline-flex items-center gap-2 transition hover:text-brand-300"><FiMail className="text-lg" /> {contactEmailLabel}</a>
            <a href={contactPhoneHref} className="inline-flex items-center gap-2 transition hover:text-brand-300"><FiPhone className="text-lg" /> {contactPhoneLabel}</a>
          </div>
          <nav className="mt-8 flex flex-wrap items-center justify-center gap-x-9 gap-y-3 text-sm font-semibold text-white/85">
            <Link href="/#beranda" className="transition hover:text-brand-300">Home</Link>
            <Link href="/#tentang" className="transition hover:text-brand-300">Tentang Kami</Link>
            <Link href="/#fitur" className="transition hover:text-brand-300">Fitur</Link>
            <Link href="/#cara-kerja" className="transition hover:text-brand-300">Alur</Link>
            <a href={contactEmailHref} className="transition hover:text-brand-300">Kontak</a>
          </nav>
          <div className="mx-auto mt-9 h-px max-w-3xl bg-white/10" />
          <p className="mt-6 text-xs text-white/50">Created by Kelompok 13 | DishCon © 2026</p>
        </div>
      </footer>
    </main>
  );
}
