import { Suspense } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { LoginCard } from "@/components/auth/auth-card";
import { FoodSharingIllustration } from "@/components/landing/food-sharing-illustration";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto grid min-h-screen w-full max-w-[1440px] gap-10 px-5 py-8 lg:grid-cols-[1.05fr_.95fr] lg:px-12">
        <section className="flex flex-col">
          <BrandLogo />
          <div className="mt-12 max-w-2xl">
            <span className="inline-flex rounded-full bg-brand-50 px-5 py-3 text-sm font-extrabold text-brand-700">Food sharing berbasis lokasi dan AI</span>
            <h1 className="mt-8 text-5xl font-black leading-tight text-brand-900 md:text-7xl">Selamat Datang Kembali</h1>
            <p className="mt-5 max-w-xl text-xl leading-8 text-stone-500">Masuk untuk mengelola donasi, mencari makanan terdekat, dan melihat status pengajuan secara aman.</p>
          </div>
          <div className="mt-10 hidden lg:block"><FoodSharingIllustration /></div>
        </section>
        <section className="flex items-center justify-center"><Suspense><LoginCard /></Suspense></section>
      </div>
    </main>
  );
}
