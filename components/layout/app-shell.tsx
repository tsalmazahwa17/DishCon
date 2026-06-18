"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { IconType } from "react-icons";
import {
  FiBell, FiChevronDown, FiClock, FiDatabase, FiGift, FiGrid, FiHeart, FiHome,
  FiLogOut, FiMapPin, FiMenu, FiMessageCircle, FiSearch, FiSettings, FiShield,
  FiUser, FiUsers, FiX, FiZap
} from "react-icons/fi";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { useAuth, roleHome } from "@/lib/auth-context";
import { useDishconData } from "@/lib/dishcon-store";
import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: IconType; badge?: number; highlight?: boolean };
type NavSection = { label: string; items: NavItem[] };

function roleBase(role: UserRole) {
  if (role === "admin") return "/admin";
  if (role === "donatur") return "/donor";
  return "/recipient";
}

function getNav(role: UserRole, unread: number, pending: number): NavSection[] {
  if (role === "admin") {
    return [
      { label: "DASHBOARD", items: [
        { href: "/admin/dashboard", label: "Overview", icon: FiGrid },
        { href: "/admin/donations", label: "Donasi", icon: FiGift },
        { href: "/admin/requests", label: "Pengajuan", icon: FiDatabase, badge: pending }
      ] },
      { label: "MANAJEMEN", items: [
        { href: "/admin/users", label: "Pengguna", icon: FiUsers },
        { href: "/admin/zones", label: "Zona Distribusi", icon: FiMapPin }
      ] },
      { label: "SISTEM", items: [
        { href: "/admin/ai-settings", label: "Pengaturan AI", icon: FiZap },
        { href: "/admin/complaints", label: "Pusat Pengaduan", icon: FiMessageCircle },
        { href: "/admin/notifications", label: "Notifikasi", icon: FiBell, badge: unread },
        { href: "/admin/settings", label: "Konfigurasi", icon: FiSettings }
      ] }
    ];
  }

  if (role === "donatur") {
    return [{ label: "MENU DONATUR", items: [
      { href: "/donor/dashboard", label: "Dashboard", icon: FiHome },
      { href: "/donor/donate", label: "Buat Donasi", icon: FiHeart, highlight: true },
      { href: "/donor/history", label: "Riwayat Donasi", icon: FiClock },
      { href: "/donor/profile", label: "Profil", icon: FiUser },
      { href: "/donor/notifications", label: "Notifikasi", icon: FiBell, badge: unread },
      { href: "/donor/complaint", label: "Pusat Pengaduan", icon: FiMessageCircle },
      { href: "/donor/settings", label: "Settings", icon: FiSettings }
    ] }];
  }

  return [{ label: "MENU PENERIMA", items: [
    { href: "/recipient/dashboard", label: "Dashboard", icon: FiHome },
    { href: "/recipient/catalog", label: "Cari Makanan", icon: FiSearch },
    { href: "/recipient/history", label: "Pengajuan Saya", icon: FiClock },
    { href: "/recipient/profile", label: "Profil", icon: FiUser },
    { href: "/recipient/notifications", label: "Notifikasi", icon: FiBell, badge: unread },
    { href: "/recipient/complaint", label: "Pusat Pengaduan", icon: FiMessageCircle },
    { href: "/recipient/settings", label: "Settings", icon: FiSettings }
  ] }];
}

function Sidebar({ role, open, onClose }: { role: UserRole; open?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { notifications, requests } = useDishconData();
  const nav = getNav(role, notifications.filter((n) => !n.is_read).length, requests.filter((r) => r.status === "pending").length);
  const admin = role === "admin";

  return (
    <aside className={cn("flex h-full flex-col border-r border-stone-200", admin ? "bg-brand-900 text-white" : "bg-white text-ink")}> 
      <div className="flex items-center justify-between p-5">
        <BrandLogo dark={admin} className={admin ? "text-white" : ""} />
        {open && <button onClick={onClose} className={cn("grid h-10 w-10 place-items-center rounded-xl", admin ? "bg-white/10" : "bg-stone-100")}><FiX /></button>}
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-4 pb-5">
        {nav.map((section) => (
          <div key={section.label}>
            <p className={cn("mb-2 px-2 text-[11px] font-black uppercase tracking-[0.18em]", admin ? "text-white/35" : "text-stone-400")}>{section.label}</p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-extrabold transition",
                      admin
                        ? active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
                        : item.highlight ? "green-gradient text-white shadow-lg shadow-brand-700/20 hover:shadow-xl"
                        : active ? "bg-brand-100 text-brand-800" : "text-stone-700 hover:bg-brand-50 hover:text-brand-700"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {!!item.badge && item.badge > 0 && <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-black text-white">{item.badge}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-5">
        <button onClick={logout} className={cn("mt-3 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-extrabold transition", admin ? "text-white/70 hover:bg-white/10 hover:text-white" : "")}>
          <FiLogOut /> Logout
        </button>
      </div>
    </aside>
  );
}

function ProfileDropdown({ role }: { role: UserRole }) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const base = roleBase(role);
  if (!user) return null;

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-3 rounded-full border border-stone-200 bg-white py-1 pl-1 pr-3 shadow-sm transition hover:shadow-md">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-700 text-sm font-black text-white">{user.name.slice(0, 2).toUpperCase()}</span>
        <span className="hidden text-left text-sm md:block"><b className="block text-ink">{user.name}</b><span className="capitalize text-stone-500">{role === "donatur" ? "Donatur" : role === "penerima" ? "Penerima" : "Admin"}</span></span>
        <FiChevronDown className="text-stone-400" />
      </button>
      {open && (
        <div className="absolute right-0 top-14 z-40 w-64 rounded-3xl border border-stone-200 bg-white p-2 shadow-2xl">
          <div className="px-4 py-3">
            <p className="font-black text-ink">{user.name}</p>
            <p className="truncate text-sm text-stone-500">{user.email}</p>
          </div>
          <Link onClick={() => setOpen(false)} href={`${base}/profile`} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold hover:bg-brand-50"><FiUser /> Profil Saya</Link>
          <Link onClick={() => setOpen(false)} href={`${base}/settings`} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold hover:bg-brand-50"><FiSettings /> Settings</Link>
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50"><FiLogOut /> Logout</button>
        </div>
      )}
    </div>
  );
}

function TopNotification({ role }: { role: UserRole }) {
  const { notifications } = useDishconData();
  const unread = notifications.filter((n) => !n.is_read).length;
  return (
    <Link href={`${roleBase(role)}/notifications`} className="relative grid h-11 w-11 place-items-center rounded-full border border-stone-200 bg-white text-stone-700 shadow-sm transition hover:bg-brand-50 hover:text-brand-700">
      <FiBell />
      {unread > 0 && <span className="absolute right-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-orange-500 px-1 text-[10px] font-black text-white">{unread}</span>}
    </Link>
  );
}

export function ProtectedPage({ role, title, subtitle, children }: { role: UserRole; title: string; subtitle?: string; children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(roleHome(role))}`);
      return;
    }
    if (user.role !== role) {
      router.replace(roleHome(user.role));
    }
  }, [loading, role, router, user]);

  if (loading || !user || user.role !== role) {
    return (
      <main className="grid min-h-screen place-items-center bg-cream px-4 text-center">
        <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-card">
          <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-brand-100" />
          <p className="mt-4 font-bold text-stone-600">Memeriksa akses akun...</p>
        </div>
      </main>
    );
  }

  const admin = role === "admin";

  return (
    <div className={cn("min-h-screen", admin ? "bg-white" : "bg-cream")}> 
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[280px] xl:block">
        <Sidebar role={role} />
      </aside>
      <main className="xl:pl-[280px]">
        <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/90 backdrop-blur-xl">
          <div className="flex min-h-[82px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button onClick={() => setMobileOpen(true)} className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-stone-200 bg-white xl:hidden" aria-label="Buka menu"><FiMenu /></button>
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-black tracking-tight text-ink md:text-4xl">{title}</h1>
                {subtitle && <p className="mt-1 line-clamp-2 text-sm text-stone-600 md:text-base">{subtitle}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TopNotification role={role} />
              <ProfileDropdown role={role} />
            </div>
          </div>
        </header>
        <div className={cn("w-full max-w-full min-w-0 px-4 py-6 sm:px-6 lg:px-8", role === "penerima" && "overflow-x-hidden")}>{children}</div>
      </main>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm xl:hidden" onClick={() => setMobileOpen(false)}>
          <div className="h-full w-[84%] max-w-[330px] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <Sidebar role={role} open onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
