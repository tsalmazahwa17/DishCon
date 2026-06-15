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

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Menyelesaikan autentikasi Google...");

  useEffect(() => {
    let active = true;

    async function finish() {
      if (!supabase) {
        setMessage("Konfigurasi Supabase belum tersedia.");
        return;
      }

      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get("code");
      const queryRole = searchParams.get("role");
      const storedRole = localStorage.getItem("dishcon_oauth_role");
      const desiredRole = (queryRole === "donatur" || queryRole === "penerima" ? queryRole : storedRole) as PublicUserRole | null;

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
        if (active) setMessage("Sesi Google tidak ditemukan. Silakan ulangi proses pendaftaran.");
        return;
      }

      if (desiredRole) {
        await supabase.rpc("set_google_public_role", { p_role: desiredRole });
      }

      const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", authUser.id).single();
      if (profileError || !profile) {
        if (active) setMessage("Profil belum berhasil dibuat. Jalankan schema Supabase terbaru lalu coba lagi.");
        return;
      }

      localStorage.removeItem("dishcon_oauth_role");
      saveRoleCookies(profile as Profile);
      router.replace(roleHome((profile as Profile).role));
      router.refresh();
    }

    finish();
    return () => { active = false; };
  }, [router]);

  return (
    <main className="grid min-h-screen place-items-center bg-cream px-5 text-center">
      <div className="soft-panel max-w-lg p-8">
        <div className="mx-auto h-14 w-14 animate-pulse rounded-full bg-brand-100" />
        <h1 className="mt-5 text-2xl font-black text-brand-900">Google OAuth</h1>
        <p className="mt-3 leading-7 text-stone-500">{message}</p>
      </div>
    </main>
  );
}
