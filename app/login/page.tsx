import { Suspense } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { LoginCard } from "@/components/auth/auth-card";
import { FoodSharingIllustration } from "@/components/landing/food-sharing-illustration";
import { featureCards } from "@/lib/data";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto grid min-h-screen w-full max-w-[1440px] gap-10 px-5 py-8 lg:grid-cols-[1.1fr_.9fr] lg:px-12">
        <section className="flex flex-col">
          <BrandLogo />
          <div className="mt-14 max-w-2xl">
            <span className="inline-flex rounded-full bg-brand-50 px-5 py-3 text-sm font-extrabold text-brand-700">🌱 AI untuk Kebaikan</span>
            <h1 className="mt-8 text-5xl font-black leading-tight text-brand-900 md:text-7xl">Selamat Datang Kembali</h1>
            <p className="mt-5 max-w-xl text-xl leading-8 text-stone-500">Lanjutkan perjalanan kebaikanmu bersama DishCon untuk mengurangi food waste dan membantu sesama.</p>
          </div>
          <div className="mt-12 hidden lg:block"><FoodSharingIllustration /></div>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {featureCards.slice(1,4).map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="rounded-3xl border border-stone-200 bg-white p-6 shadow-card">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600"><Icon /></span>
                  <h3 className="mt-5 text-lg font-extrabold text-brand-900">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-stone-500">{feature.desc.split(".")[0]}.</p>
                </div>
              );
            })}
          </div>
        </section>
        <section className="flex items-center justify-center"><Suspense><LoginCard /></Suspense></section>
      </div>
    </main>
  );
}
