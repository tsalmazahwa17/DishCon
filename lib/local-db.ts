import type { Complaint, Donation, FoodRequest, Notification, Preferences, Profile } from "@/lib/types";

export const LOCAL_DB_KEY = "dishcon_demo_database_v2";
export const LOCAL_ACCOUNTS_KEY = "dishcon_local_accounts";
export const LOCAL_DB_EVENT = "dishcon-data-changed";

export type LocalDatabase = {
  donations: Donation[];
  requests: FoodRequest[];
  notifications: Notification[];
  complaints: Complaint[];
  preferences: Record<string, Preferences>;
};

export const EMPTY_LOCAL_DB: LocalDatabase = {
  donations: [],
  requests: [],
  notifications: [],
  complaints: [],
  preferences: {}
};

export function readLocalDatabase(): LocalDatabase {
  if (typeof window === "undefined") return EMPTY_LOCAL_DB;
  try {
    const raw = localStorage.getItem(LOCAL_DB_KEY);
    if (!raw) return { ...EMPTY_LOCAL_DB, preferences: {} };
    const parsed = JSON.parse(raw) as Partial<LocalDatabase>;
    return {
      donations: parsed.donations || [],
      requests: parsed.requests || [],
      notifications: parsed.notifications || [],
      complaints: parsed.complaints || [],
      preferences: parsed.preferences || {}
    };
  } catch {
    return { ...EMPTY_LOCAL_DB, preferences: {} };
  }
}

export function writeLocalDatabase(database: LocalDatabase) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(database));
  window.dispatchEvent(new CustomEvent(LOCAL_DB_EVENT));
}

export function readLocalProfiles(): Profile[] {
  if (typeof window === "undefined") return [];
  try {
    const accounts = JSON.parse(localStorage.getItem(LOCAL_ACCOUNTS_KEY) || "[]") as Array<Profile & { password?: string }>;
    return accounts.map(({ password: _password, ...profile }) => profile);
  } catch {
    return [];
  }
}
