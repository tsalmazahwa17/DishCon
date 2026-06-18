"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { roleHome } from "@/lib/auth-context";
import type { Profile, PublicUserRole } from "@/lib/types";

function saveRoleCookies(profile: Profile) {
  const maxAge = 60 * 60 * 24 * 7;
  document.cookie = `dishcon_session=${encodeURIComponent(profile.id)}; Max-Age=${maxAge}; path=/; SameSite=Lax`;
  document.cookie = `dishcon_role=${profile.role}; Max-Age=${maxAge}; path=/; SameSite=Lax`;
}

function clearRoleCookies() {
  document.cookie = "dishcon_session=; Max-Age=0; path=/";
  document.cookie = "dishcon_role=; Max-Age=0; path=/";
}

function asPublicRole(value: string | null): PublicUserRole | null {
  return value === "donatur" || value === "penerima" ? value : null;
}

function googleName(authUser: { email?: string | null; user_metadata?: Record<string, unknown> }) {
  const metadata = authUser.user_metadata || {};
  return String(metadata.full_name || metadata.name || metadata.display_name || authUser.email?.split("@")[0] || "Pengguna DishCon");
}

function googleAvatar(authUser: { user_metadata?: Record<string, unknown> }) {
  const metadata = authUser.user_metadata || {};
  return typeof metadata.avatar_url === "string" ? metadata.avatar_url : typeof metadata.picture === "string" ? metadata.picture : undefined;
}

const PHONE_REGEX = /^[0-9+\-\s()]+$/;
function cleanOAuthPhone(value: unknown) {
  const phone = typeof value === "string" ? value.trim() : "";
  return phone && PHONE_REGEX.test(phone) ? phone : null;
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Menyelesaikan autentikasi akun...");

  useEffect(() => {
    let active = true;

    async function finish() {
      if (!supabase) {
        setMessage("Konfigurasi Supabase belum tersedia.");
        return;
      }

      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get("code");
      const desiredRole = asPublicRole(searchParams.get("role")) || asPublicRole(localStorage.getItem("dishcon_oauth_role"));

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          if (active) setMessage(`Autentikasi gagal: ${error.message}`);
          return;
        }
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const authUser = sessionData.session?.user;
      if (!authUser) {
        if (active) setMessage("Sesi autentikasi tidak ditemukan. Silakan ulangi proses login atau pendaftaran.");
        return;
      }

      if (!authUser.email_confirmed_at) {
        await supabase.auth.signOut();
        clearRoleCookies();
        if (active) setMessage("Email belum terverifikasi. Buka link konfirmasi dari inbox email Anda terlebih dahulu.");
        return;
      }

      const provider = String(authUser.app_metadata?.provider || "email");
      const isEmailVerification = provider === "email" && !desiredRole;
      if (isEmailVerification) {
        await supabase.auth.signOut();
        clearRoleCookies();
        router.replace("/login?verified=1");
        return;
      }

      const name = googleName(authUser);
      const avatarUrl = googleAvatar(authUser);
      const defaultRole = desiredRole || "penerima";

      let { data: profile } = await supabase.from("profiles").select("*").eq("id", authUser.id).single();

      if (!profile) {
        const { data: inserted, error: insertError } = await supabase.from("profiles").insert({
          id: authUser.id,
          email: authUser.email || "",
          name,
          phone: cleanOAuthPhone(authUser.user_metadata?.phone),
          role: defaultRole,
          roles: [defaultRole],
          avatar_url: avatarUrl || null,
          created_at: new Date().toISOString()
        }).select("*").single();
        if (insertError || !inserted) {
          if (active) setMessage("Profil belum berhasil dibuat. Jalankan schema Supabase terbaru lalu coba lagi.");
          return;
        }
        profile = inserted;
      } else {
        const shouldUpdateName = !profile.name || profile.name === profile.email?.split("@")[0];
        const patch: Partial<Profile> = {};
        if (shouldUpdateName) patch.name = name;
        if (avatarUrl && !profile.avatar_url) patch.avatar_url = avatarUrl;
        // Google OAuth biasanya tidak membawa nomor telepon. Jika row lama berisi string invalid,
        // role switch bisa gagal karena constraint phone. Bersihkan dulu sebelum set role.
        if (profile.phone && !PHONE_REGEX.test(String(profile.phone).trim())) patch.phone = null as any;
        if (Object.keys(patch).length > 0) {
          await supabase.from("profiles").update(patch).eq("id", authUser.id);
          profile = { ...profile, ...patch };
        }
      }

      if (profile.role === "admin") {
        localStorage.removeItem("dishcon_oauth_role");
        const activeProfile = { ...(profile as Profile), role: "admin" as const, roles: ["admin" as const], active_role: "admin" as const };
        saveRoleCookies(activeProfile);
        router.replace(roleHome("admin"));
        router.refresh();
        return;
      }

      if (!desiredRole) {
        if (active) setMessage("Pilih role Donatur atau Penerima dari halaman login sebelum melanjutkan dengan Google.");
        await supabase.auth.signOut();
        clearRoleCookies();
        return;
      }

      const { error: roleError } = await supabase.rpc("set_public_active_role", { p_role: desiredRole });
      if (roleError) {
        if (active) {
          setMessage(`Role Google belum bisa ditetapkan. Jalankan file SUPABASE_AUTH_STATUS_PATCH.sql di Supabase. Detail: ${roleError.message}`);
        }
        return;
      }

      const { data: freshProfile, error: profileError } = await supabase.from("profiles").select("*").eq("id", authUser.id).single();
      if (profileError || !freshProfile) {
        if (active) setMessage("Profil belum berhasil dimuat setelah login Google.");
        return;
      }

      localStorage.removeItem("dishcon_oauth_role");
      const activeProfile = { ...(freshProfile as Profile), role: desiredRole, active_role: desiredRole };
      saveRoleCookies(activeProfile);
      router.replace(roleHome(desiredRole));
      router.refresh();
    }

    finish();
    return () => { active = false; };
  }, [router]);

  return (
    <main className="grid min-h-screen place-items-center bg-cream px-5 text-center">
      <div className="soft-panel max-w-lg p-8">
        <div className="mx-auto h-14 w-14 animate-pulse rounded-full bg-brand-100" />
        <h1 className="mt-5 text-2xl font-black text-brand-900">Autentikasi DishCon</h1>
        <p className="mt-3 leading-7 text-stone-500">{message}</p>
      </div>
    </main>
  );
}
