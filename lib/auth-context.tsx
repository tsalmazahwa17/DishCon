"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { hasSupabaseEnv, supabase } from "@/lib/supabase";
import { LOCAL_ACCOUNTS_KEY } from "@/lib/local-db";
import type { Profile, PublicUserRole, UserRole } from "@/lib/types";

type AuthResult = { ok: true; redirectTo: string } | { ok: false; error: string };
type OAuthResult = { ok: true } | { ok: false; error: string };
type SecurityResult = { ok: true; message?: string } | { ok: false; error: string };

type LoginPayload = { email: string; password: string; role?: PublicUserRole };
type RegisterPayload = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: PublicUserRole;
  address?: string;
  organization?: string;
  beneficiaries?: number;
};

type AuthContextValue = {
  user: Profile | null;
  loading: boolean;
  isSupabaseConnected: boolean;
  login: (payload: LoginPayload) => Promise<AuthResult>;
  loginAdmin: (payload: LoginPayload) => Promise<AuthResult>;
  signInWithGoogle: (role?: PublicUserRole) => Promise<OAuthResult>;
  register: (payload: RegisterPayload) => Promise<AuthResult>;
  requestPasswordReset: (email: string) => Promise<SecurityResult>;
  updatePassword: (password: string) => Promise<SecurityResult>;
  resendVerificationEmail: (emailOverride?: string) => Promise<SecurityResult>;
  logout: () => Promise<void>;
  updateProfile: (profile: Partial<Profile>) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_KEY = "dishcon_session";
const PHONE_REGEX = /^[0-9+\-\s()]+$/;

function isValidPhone(value?: string) {
  const clean = (value || "").trim();
  return Boolean(clean) && PHONE_REGEX.test(clean);
}
const DEMO_ADMIN: Profile & { password: string } = {
  id: "dishcon-demo-admin",
  email: "admin@dishcon.id",
  name: "Administrator DishCon",
  phone: "081234567890",
  role: "admin",
  address: "Jakarta Selatan",
  organization: "DishCon Operations",
  password: "Admin123!",
  created_at: "2026-01-01T00:00:00.000Z"
};

export function roleHome(role: UserRole) {
  if (role === "admin") return "/admin/dashboard";
  if (role === "donatur") return "/donor/dashboard";
  return "/recipient/dashboard";
}

function setAuthCookie(profile: Profile | null) {
  if (typeof document === "undefined") return;
  if (!profile) {
    document.cookie = "dishcon_session=; Max-Age=0; path=/";
    document.cookie = "dishcon_role=; Max-Age=0; path=/";
    return;
  }
  const maxAge = 60 * 60 * 24 * 7;
  document.cookie = `dishcon_session=${encodeURIComponent(profile.id)}; Max-Age=${maxAge}; path=/; SameSite=Lax`;
  document.cookie = `dishcon_role=${profile.role}; Max-Age=${maxAge}; path=/; SameSite=Lax`;
}

function readLocalAccounts(): Array<Profile & { password: string }> {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LOCAL_ACCOUNTS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLocalAccounts(accounts: Array<Profile & { password: string }>) {
  localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
}

function ensureDemoAdmin() {
  const accounts = readLocalAccounts();
  if (!accounts.some((account) => account.role === "admin")) {
    saveLocalAccounts([...accounts, DEMO_ADMIN]);
  }
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error || !data) return null;
  return data as Profile;
}

function isEmailVerified(authUser: { email_confirmed_at?: string | null }) {
  return Boolean(authUser.email_confirmed_at);
}

function normalizeRoles(profile: Profile): UserRole[] {
  const rawRoles = Array.isArray(profile.roles) ? profile.roles : [];
  const roles = rawRoles.filter((role): role is UserRole => ["donatur", "penerima", "admin"].includes(String(role)));
  if (profile.role === "admin") return ["admin"];
  const publicRoles = [...new Set([profile.role, ...roles].filter((role): role is PublicUserRole => role === "donatur" || role === "penerima"))];
  return publicRoles.length ? publicRoles : ["penerima"];
}

function withActiveRole(profile: Profile, role?: UserRole): Profile {
  const roles = normalizeRoles(profile);
  const requested = role && roles.includes(role) ? role : profile.role;
  const activeRole = roles.includes(requested) ? requested : roles[0];
  return { ...profile, role: activeRole, active_role: activeRole, roles };
}

function googleProfileName(authUser: { email?: string | null; user_metadata?: Record<string, unknown> }) {
  const metadata = authUser.user_metadata || {};
  return String(metadata.full_name || metadata.name || metadata.display_name || authUser.email?.split("@")[0] || "Pengguna DishCon");
}

async function setPublicActiveRole(userId: string, role: PublicUserRole) {
  if (!supabase) return null;
  const { error: rpcError } = await supabase.rpc("set_public_active_role", { p_role: role });
  if (!rpcError) return await fetchProfile(userId);

  // Fallback untuk project yang belum menjalankan schema terbaru.
  const profile = await fetchProfile(userId);
  if (!profile || profile.role === "admin") return profile;
  const roles = [...new Set([...normalizeRoles(profile).filter((item): item is PublicUserRole => item === "donatur" || item === "penerima"), role])];
  const safePhone = profile.phone && PHONE_REGEX.test(String(profile.phone).trim()) ? profile.phone : null;
  const { data } = await supabase
    .from("profiles")
    .update({ role, roles, phone: safePhone, oauth_role_set_at: profile.oauth_role_set_at || new Date().toISOString() })
    .eq("id", userId)
    .select("*")
    .single();
  return (data as Profile) || profile;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function init() {
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        const authUser = data.session?.user;
        if (authUser) {
          if (!isEmailVerified(authUser)) {
            await supabase.auth.signOut();
            setAuthCookie(null);
          } else {
            const profile = await fetchProfile(authUser.id);
            if (active && profile) {
              const activeProfile = withActiveRole(profile);
              setUser(activeProfile);
              setAuthCookie(activeProfile);
            }
          }
        }
      } else {
        ensureDemoAdmin();
        const savedId = localStorage.getItem(SESSION_KEY);
        if (savedId) {
          const account = readLocalAccounts().find((item) => item.id === savedId);
          if (account) {
            const { password: _password, ...profile } = account;
            const activeProfile = withActiveRole(profile);
            if (active) {
              setUser(activeProfile);
              setAuthCookie(activeProfile);
            }
          }
        }
      }
      if (active) setLoading(false);
    }

    init();
    return () => { active = false; };
  }, []);

  const login = useCallback(async ({ email, password, role = "penerima" }: LoginPayload): Promise<AuthResult> => {
    if (!email.trim() || !password) return { ok: false, error: "Email dan kata sandi wajib diisi." };
    if (role !== "donatur" && role !== "penerima") return { ok: false, error: "Pilih login sebagai donatur atau penerima." };

    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error || !data.user) return { ok: false, error: error?.message || "Login gagal. Periksa email dan kata sandi." };
      if (!isEmailVerified(data.user)) {
        await supabase.auth.signOut();
        return { ok: false, error: "Email belum diverifikasi. Buka email konfirmasi dari DishCon terlebih dahulu sebelum login." };
      }
      let profile = await fetchProfile(data.user.id);
      if (!profile) {
        await supabase.auth.signOut();
        return { ok: false, error: "Profil akun belum tersedia. Hubungi administrator." };
      }
      if (profile.role === "admin") {
        await supabase.auth.signOut();
        return { ok: false, error: "Akun admin harus masuk melalui halaman Login Admin." };
      }
      profile = await setPublicActiveRole(data.user.id, role) || profile;
      const activeProfile = withActiveRole(profile, role);
      setUser(activeProfile);
      setAuthCookie(activeProfile);
      return { ok: true, redirectTo: roleHome(activeProfile.role) };
    }

    ensureDemoAdmin();
    const accounts = readLocalAccounts();
    const account = accounts.find((item) => item.email.toLowerCase() === email.trim().toLowerCase());
    if (!account || account.password !== password) return { ok: false, error: "Akun belum ditemukan atau kata sandi salah." };
    if (account.role === "admin") return { ok: false, error: "Akun admin harus masuk melalui halaman Login Admin." };
    const roles = [...new Set([...normalizeRoles(account).filter((item): item is PublicUserRole => item === "donatur" || item === "penerima"), role])];
    const updatedAccount = { ...account, role, roles };
    saveLocalAccounts(accounts.map((item) => item.id === account.id ? updatedAccount : item));
    const { password: _password, ...profile } = updatedAccount;
    localStorage.setItem(SESSION_KEY, profile.id);
    const activeProfile = withActiveRole(profile, role);
    setUser(activeProfile);
    setAuthCookie(activeProfile);
    return { ok: true, redirectTo: roleHome(activeProfile.role) };
  }, []);

  const loginAdmin = useCallback(async ({ email, password }: LoginPayload): Promise<AuthResult> => {
    if (!email.trim() || !password) return { ok: false, error: "Email dan kata sandi admin wajib diisi." };

    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error || !data.user) return { ok: false, error: error?.message || "Login admin gagal." };
      if (!isEmailVerified(data.user)) {
        await supabase.auth.signOut();
        return { ok: false, error: "Email admin belum diverifikasi melalui Supabase Auth." };
      }
      const profile = await fetchProfile(data.user.id);
      if (!profile || profile.role !== "admin") {
        await supabase.auth.signOut();
        return { ok: false, error: "Email ini tidak memiliki role admin di Supabase." };
      }
      const activeProfile = withActiveRole(profile, "admin");
      setUser(activeProfile);
      setAuthCookie(activeProfile);
      return { ok: true, redirectTo: roleHome(activeProfile.role) };
    }

    ensureDemoAdmin();
    const account = readLocalAccounts().find((item) => item.email.toLowerCase() === email.trim().toLowerCase());
    if (!account || account.password !== password || account.role !== "admin") {
      return { ok: false, error: "Akun admin tidak ditemukan atau kata sandi salah." };
    }
    const { password: _password, ...profile } = account;
    localStorage.setItem(SESSION_KEY, profile.id);
    const activeProfile = withActiveRole(profile, "admin");
    setUser(activeProfile);
    setAuthCookie(activeProfile);
    return { ok: true, redirectTo: roleHome(activeProfile.role) };
  }, []);

  const signInWithGoogle = useCallback(async (role?: PublicUserRole): Promise<OAuthResult> => {
    if (!supabase) return { ok: false, error: "Hubungkan project ke Supabase terlebih dahulu untuk mengaktifkan Google OAuth." };
    if (typeof window === "undefined") return { ok: false, error: "Google OAuth hanya dapat dijalankan dari browser." };
    if (role) localStorage.setItem("dishcon_oauth_role", role);
    else localStorage.removeItem("dishcon_oauth_role");
    const redirectTo = role ? `${window.location.origin}/auth/callback?role=${role}` : `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }, []);

  const register = useCallback(async (payload: RegisterPayload): Promise<AuthResult> => {
    const { name, email, phone, password, role, address, organization, beneficiaries } = payload;
    if (!name.trim() || !email.trim() || !phone.trim() || !password || !role) return { ok: false, error: "Semua data utama wajib diisi." };
    if (!isValidPhone(phone)) return { ok: false, error: "Nomor telepon hanya boleh berisi angka, spasi, tanda +, tanda -, atau tanda kurung." };
    if (password.length < 8) return { ok: false, error: "Kata sandi minimal 8 karakter." };

    if (supabase) {
      const emailRedirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo,
          data: { name: name.trim(), phone: phone.trim(), role, roles: [role], address: address || "", organization: organization || "", beneficiaries: beneficiaries || 0 }
        }
      });
      if (error || !data.user) return { ok: false, error: error?.message || "Registrasi gagal." };

      const profile: Profile = {
        id: data.user.id,
        email: email.trim(),
        name: name.trim(),
        phone: phone.trim(),
        role,
        roles: [role],
        address,
        organization,
        beneficiaries,
        created_at: new Date().toISOString()
      };
      await supabase.from("profiles").upsert(profile);

      if (!isEmailVerified(data.user)) {
        await supabase.auth.signOut();
        setAuthCookie(null);
        return { ok: true, redirectTo: `/login?registered=1&email=${encodeURIComponent(email.trim())}` };
      }
      const activeProfile = withActiveRole(profile, role);
      setUser(activeProfile);
      setAuthCookie(activeProfile);
      return { ok: true, redirectTo: roleHome(activeProfile.role) };
    }

    ensureDemoAdmin();
    const accounts = readLocalAccounts();
    const existing = accounts.find((item) => item.email.toLowerCase() === email.trim().toLowerCase());
    if (existing) {
      const roles = [...new Set([...normalizeRoles(existing).filter((item): item is PublicUserRole => item === "donatur" || item === "penerima"), role])];
      saveLocalAccounts(accounts.map((item) => item.id === existing.id ? { ...existing, role, roles } : item));
      return { ok: false, error: "Email sudah terdaftar. Role baru sudah ditautkan. Silakan login dan pilih role yang ingin digunakan." };
    }
    const profile: Profile & { password: string } = {
      id: createId(),
      email: email.trim(),
      name: name.trim(),
      phone: phone.trim(),
      role,
      roles: [role],
      address,
      organization,
      beneficiaries,
      password,
      created_at: new Date().toISOString()
    };
    saveLocalAccounts([...accounts, profile]);
    localStorage.setItem(SESSION_KEY, profile.id);
    const { password: _password, ...safeProfile } = profile;
    const activeProfile = withActiveRole(safeProfile, role);
    setUser(activeProfile);
    setAuthCookie(activeProfile);
    return { ok: true, redirectTo: roleHome(activeProfile.role) };
  }, []);


  const requestPasswordReset = useCallback(async (email: string): Promise<SecurityResult> => {
    const cleanEmail = email.trim();
    if (!cleanEmail) return { ok: false, error: "Email wajib diisi." };
    if (!supabase) return { ok: false, error: "Reset kata sandi lewat email membutuhkan koneksi Supabase." };
    if (typeof window === "undefined") return { ok: false, error: "Reset kata sandi hanya dapat dijalankan dari browser." };

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, message: "Link reset kata sandi sudah dikirim. Periksa inbox atau spam email Anda." };
  }, []);

  const updatePassword = useCallback(async (password: string): Promise<SecurityResult> => {
    if (!password || password.length < 8) return { ok: false, error: "Kata sandi baru minimal 8 karakter." };

    if (supabase) {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return { ok: false, error: error.message };
      return { ok: true, message: "Kata sandi berhasil diperbarui." };
    }

    if (!user) return { ok: false, error: "Sesi pengguna tidak ditemukan." };
    const accounts = readLocalAccounts().map((account) => account.id === user.id ? { ...account, password } : account);
    saveLocalAccounts(accounts);
    return { ok: true, message: "Kata sandi demo lokal berhasil diperbarui." };
  }, [user]);

  const resendVerificationEmail = useCallback(async (emailOverride?: string): Promise<SecurityResult> => {
    const targetEmail = (emailOverride || user?.email || "").trim();
    if (!targetEmail) return { ok: false, error: "Email akun tidak ditemukan." };
    if (!supabase) return { ok: false, error: "Verifikasi email membutuhkan koneksi Supabase." };
    const emailRedirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: targetEmail,
      options: { emailRedirectTo }
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, message: "Email verifikasi sudah dikirim ulang. Periksa inbox atau spam email Anda." };
  }, [user?.email]);

  const logout = useCallback(async () => {
    const wasAdmin = user?.role === "admin";
    if (supabase) await supabase.auth.signOut();
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    setAuthCookie(null);
    router.push(wasAdmin ? "/admin/login" : "/login");
  }, [router, user?.role]);

  const updateProfile = useCallback(async (patch: Partial<Profile>) => {
    if (!user) return;
    const { role: _ignoredRole, id: _ignoredId, ...safePatch } = patch;
    if (safePatch.phone !== undefined && safePatch.phone.trim() && !isValidPhone(safePatch.phone)) {
      throw new Error("Nomor telepon hanya boleh berisi angka, spasi, tanda +, tanda -, atau tanda kurung.");
    }
    const updated = { ...user, ...safePatch };
    if (supabase) {
      await supabase.from("profiles").update(safePatch).eq("id", user.id);
    } else {
      const accounts = readLocalAccounts().map((item) => item.id === user.id ? { ...item, ...safePatch } : item);
      saveLocalAccounts(accounts);
      window.dispatchEvent(new CustomEvent("dishcon-data-changed"));
    }
    setUser(updated);
    setAuthCookie(updated);
  }, [user]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    isSupabaseConnected: hasSupabaseEnv,
    login,
    loginAdmin,
    signInWithGoogle,
    register,
    requestPasswordReset,
    updatePassword,
    resendVerificationEmail,
    logout,
    updateProfile
  }), [loading, login, loginAdmin, logout, register, requestPasswordReset, resendVerificationEmail, signInWithGoogle, updatePassword, updateProfile, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
