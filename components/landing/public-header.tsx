"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { navLinks } from "@/lib/data";
import { cn } from "@/lib/utils";

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-cream/90 backdrop-blur-xl">
      <div className="container-page flex h-20 items-center justify-between">
        <BrandLogo />
        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((item) => (
            <Link key={item.label} href={item.href} className={cn("text-sm font-semibold text-stone-600 hover:text-brand-700", pathname === item.href && "text-brand-700")}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <Button asChild variant="ghost" size="sm"><Link href="/login">Masuk</Link></Button>
          <Button asChild size="sm"><Link href="/register">Daftar</Link></Button>
        </div>
        <button onClick={() => setOpen(true)} className="grid h-11 w-11 place-items-center rounded-2xl border border-stone-200 bg-white lg:hidden" aria-label="Buka menu">
          <FiMenu className="h-5 w-5" />
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)}>
          <div className="ml-auto flex h-full w-[82%] max-w-sm flex-col gap-8 bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <BrandLogo />
              <button onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-stone-100" aria-label="Tutup menu"><FiX /></button>
            </div>
            <nav className="flex flex-col gap-2">
              {navLinks.map((item) => (
                <Link onClick={() => setOpen(false)} key={item.label} href={item.href} className="rounded-2xl px-4 py-3 font-bold text-stone-700 hover:bg-brand-50 hover:text-brand-700">
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto grid gap-3">
              <Button asChild variant="secondary"><Link href="/login">Masuk</Link></Button>
              <Button asChild><Link href="/register">Daftar</Link></Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
