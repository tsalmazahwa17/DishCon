"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { LOCAL_DB_EVENT, LOCAL_DB_KEY, readLocalDatabase, readLocalProfiles, writeLocalDatabase } from "@/lib/local-db";
import type { Complaint, Donation, FoodRequest, Notification, Preferences, Profile, RoleScopedData, UserRole } from "@/lib/types";

const DEFAULT_PREFS: Preferences = {
  halal: true,
  vegetarian: false,
  maxDistanceKm: 5,
  preferredCategories: ["Makanan Berat", "Buah & Sayur"],
  notificationEmail: true,
  notificationPush: true
};

function emptyData(): RoleScopedData {
  return {
    profiles: [],
    donations: [],
    requests: [],
    notifications: [],
    complaints: [],
    preferences: DEFAULT_PREFS
  };
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function safeSelect<T>(query: PromiseLike<{ data: T[] | null; error: unknown }>) {
  try {
    const { data } = await query;
    return data || [];
  } catch {
    return [];
  }
}

function makeNotification(userId: string, payload: Omit<Notification, "id" | "user_id" | "is_read" | "created_at">): Notification {
  return {
    id: createId("notif"),
    user_id: userId,
    title: payload.title,
    message: payload.message,
    type: payload.type,
    link: payload.link,
    is_read: false,
    created_at: new Date().toISOString()
  };
}

export function useDishconData() {
  const { user } = useAuth();
  const [data, setData] = useState<RoleScopedData>(emptyData());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setData(emptyData());
      setLoading(false);
      return;
    }

    setLoading(true);
    if (supabase) {
      const donationQuery = user.role === "admin"
        ? supabase.from("donations").select("*").order("created_at", { ascending: false })
        : user.role === "donatur"
          ? supabase.from("donations").select("*").eq("donor_id", user.id).order("created_at", { ascending: false })
          : supabase.from("donations").select("*").order("created_at", { ascending: false });

      const requestQuery = user.role === "admin"
        ? supabase.from("food_requests").select("*").order("created_at", { ascending: false })
        : supabase.from("food_requests").select("*").eq(user.role === "donatur" ? "donor_id" : "recipient_id", user.id).order("created_at", { ascending: false });

      const profilesQuery = user.role === "admin"
        ? supabase.from("profiles").select("*").order("created_at", { ascending: false })
        : supabase.from("profiles").select("*").eq("id", user.id);

      const complaintsQuery = user.role === "admin"
        ? supabase.from("complaints").select("*").order("created_at", { ascending: false })
        : supabase.from("complaints").select("*").eq("user_id", user.id).order("created_at", { ascending: false });

      const [profiles, donations, requests, notifications, complaints, prefsRows] = await Promise.all([
        safeSelect<Profile>(profilesQuery as any),
        safeSelect<Donation>(donationQuery as any),
        safeSelect<FoodRequest>(requestQuery as any),
        safeSelect<Notification>(supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }) as any),
        safeSelect<Complaint>(complaintsQuery as any),
        safeSelect<{ settings: Preferences }>(supabase.from("user_preferences").select("settings").eq("user_id", user.id) as any)
      ]);

      setData({
        profiles,
        donations,
        requests,
        notifications,
        complaints,
        preferences: prefsRows[0]?.settings || DEFAULT_PREFS
      });
    } else {
      const db = readLocalDatabase();
      const allProfiles = readLocalProfiles();
      const donations = user.role === "admin"
        ? db.donations
        : user.role === "donatur"
          ? db.donations.filter((item) => item.donor_id === user.id)
          : db.donations.filter((item) => item.status === "active" || db.requests.some((request) => request.recipient_id === user.id && request.donation_id === item.id));
      const requests = user.role === "admin"
        ? db.requests
        : user.role === "donatur"
          ? db.requests.filter((item) => item.donor_id === user.id)
          : db.requests.filter((item) => item.recipient_id === user.id);
      const complaints = user.role === "admin"
        ? db.complaints
        : db.complaints.filter((item) => item.user_id === user.id);

      setData({
        profiles: user.role === "admin" ? allProfiles : allProfiles.filter((item) => item.id === user.id),
        donations: [...donations].sort((a, b) => b.created_at.localeCompare(a.created_at)),
        requests: [...requests].sort((a, b) => b.created_at.localeCompare(a.created_at)),
        notifications: db.notifications.filter((item) => item.user_id === user.id).sort((a, b) => b.created_at.localeCompare(a.created_at)),
        complaints: [...complaints].sort((a, b) => b.created_at.localeCompare(a.created_at)),
        preferences: db.preferences[user.id] || DEFAULT_PREFS
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (supabase || typeof window === "undefined") return;
    const onChange = () => refresh();
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === LOCAL_DB_KEY || event.key === "dishcon_local_accounts") refresh();
    };
    window.addEventListener(LOCAL_DB_EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(LOCAL_DB_EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);

  const addNotification = useCallback(async (payload: Omit<Notification, "id" | "user_id" | "is_read" | "created_at"> & { user_id?: string }) => {
    if (!user) return;
    const notification = makeNotification(payload.user_id || user.id, payload);
    if (supabase) {
      await supabase.from("notifications").insert(notification);
      await refresh();
      return notification;
    }
    const db = readLocalDatabase();
    writeLocalDatabase({ ...db, notifications: [notification, ...db.notifications] });
    return notification;
  }, [refresh, user]);

  const createDonation = useCallback(async (payload: Omit<Donation, "id" | "donor_id" | "status" | "created_at">) => {
    if (!user || user.role !== "donatur") return undefined;
    const donation: Donation = {
      ...payload,
      id: createId("don"),
      donor_id: user.id,
      status: "pending_verification",
      created_at: new Date().toISOString()
    };

    if (supabase) {
      const { data: inserted, error } = await supabase.from("donations").insert(donation).select().single();
      if (error) throw new Error(error.message);
      await addNotification({
        title: "Donasi dikirim untuk verifikasi",
        message: `${donation.food_name} sudah tercatat dan menunggu validasi admin.`,
        type: "success",
        link: "/donor/history"
      });
      await refresh();
      return (inserted || donation) as Donation;
    }

    const db = readLocalDatabase();
    const admins = readLocalProfiles().filter((profile) => profile.role === "admin");
    const ownNotification = makeNotification(user.id, {
      title: "Donasi dikirim untuk verifikasi",
      message: `${donation.food_name} sudah tercatat dan menunggu validasi admin.`,
      type: "success",
      link: "/donor/history"
    });
    const adminNotifications = admins.map((admin) => makeNotification(admin.id, {
      title: "Donasi baru perlu diverifikasi",
      message: `${user.name} mengirim ${donation.food_name} sebanyak ${donation.portions} porsi.`,
      type: "warning",
      link: "/admin/donations"
    }));
    writeLocalDatabase({
      ...db,
      donations: [donation, ...db.donations],
      notifications: [ownNotification, ...adminNotifications, ...db.notifications]
    });
    return donation;
  }, [addNotification, refresh, user]);

  const createRequest = useCallback(async (payload: Omit<FoodRequest, "id" | "recipient_id" | "status" | "created_at">) => {
    if (!user || user.role !== "penerima") return undefined;
    const selectedDonation = data.donations.find((item) => item.id === payload.donation_id);
    if (selectedDonation && selectedDonation.status !== "active") throw new Error("Donasi sudah tidak tersedia.");
    if (selectedDonation && payload.portions > selectedDonation.portions) throw new Error(`Jumlah maksimal ${selectedDonation.portions} porsi.`);

    const request: FoodRequest = {
      ...payload,
      id: `REQ-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      recipient_id: user.id,
      status: "pending",
      created_at: new Date().toISOString()
    };

    if (supabase) {
      const { data: inserted, error } = await supabase.from("food_requests").insert(request).select().single();
      if (error) throw new Error(error.message);
      await addNotification({
        title: "Pengajuan berhasil dibuat",
        message: `${request.food_name} menunggu persetujuan admin.`,
        type: "success",
        link: "/recipient/history"
      });
      await refresh();
      return (inserted || request) as FoodRequest;
    }

    const db = readLocalDatabase();
    const recipientsOwn = makeNotification(user.id, {
      title: "Pengajuan berhasil dibuat",
      message: `${request.food_name} menunggu persetujuan admin.`,
      type: "success",
      link: "/recipient/history"
    });
    const targetIds = new Set<string>();
    readLocalProfiles().filter((profile) => profile.role === "admin").forEach((profile) => targetIds.add(profile.id));
    if (request.donor_id) targetIds.add(request.donor_id);
    const targetNotifications = [...targetIds].map((targetId) => makeNotification(targetId, {
      title: "Pengajuan makanan baru",
      message: `${user.name} mengajukan ${request.portions} porsi ${request.food_name}.`,
      type: "warning",
      link: targetId === request.donor_id ? "/donor/dashboard" : "/admin/requests"
    }));
    writeLocalDatabase({
      ...db,
      requests: [request, ...db.requests],
      notifications: [recipientsOwn, ...targetNotifications, ...db.notifications]
    });
    return request;
  }, [addNotification, data.donations, refresh, user]);

  const createComplaint = useCallback(async (subject: string, message: string) => {
    if (!user) return undefined;
    const currentUser = user;
    const complaint: Complaint = {
      id: createId("cmp"),
      user_id: currentUser.id,
      role: currentUser.role,
      subject,
      message,
      status: "open",
      created_at: new Date().toISOString()
    };

    async function sendComplaintEmail() {
      try {
        await fetch("/api/complaints/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject, message, role: currentUser.role, userName: currentUser.name, userEmail: currentUser.email })
        });
      } catch {
        // Email pengaduan bersifat tambahan. Data utama tetap tersimpan di database.
      }
    }

    if (supabase) {
      const { error } = await supabase.from("complaints").insert(complaint);
      if (error) throw new Error(error.message);
      await sendComplaintEmail();
      await addNotification({
        title: "Pengaduan diterima",
        message: "Tim DishCon akan meninjau laporan Anda.",
        type: "info",
        link: `/${currentUser.role === "admin" ? "admin/complaints" : currentUser.role === "donatur" ? "donor/complaint" : "recipient/complaint"}?complaint=${complaint.id}`
      });
      await refresh();
      return complaint;
    }

    const db = readLocalDatabase();
    const admins = readLocalProfiles().filter((profile) => profile.role === "admin");
    const notifications = [
      makeNotification(currentUser.id, {
        title: "Pengaduan diterima",
        message: "Tim DishCon akan meninjau laporan Anda.",
        type: "info",
        link: `/${currentUser.role === "admin" ? "admin/complaints" : currentUser.role === "donatur" ? "donor/complaint" : "recipient/complaint"}?complaint=${complaint.id}`
      }),
      ...admins.filter((admin) => admin.id !== currentUser.id).map((admin) => makeNotification(admin.id, {
        title: "Pengaduan baru",
        message: `${currentUser.name}: ${subject}`,
        type: "warning",
        link: `/admin/complaints?complaint=${complaint.id}`
      }))
    ];
    writeLocalDatabase({ ...db, complaints: [complaint, ...db.complaints], notifications: [...notifications, ...db.notifications] });
    await sendComplaintEmail();
    return complaint;
  }, [addNotification, refresh, user]);

  const updateComplaintStatus = useCallback(async (id: string, status: Complaint["status"]) => {
    if (!user || user.role !== "admin") return;
    const complaint = data.complaints.find((item) => item.id === id);
    if (!complaint) return;

    if (supabase) {
      const { error } = await supabase.from("complaints").update({ status }).eq("id", id);
      if (error) throw new Error(error.message);
      await addNotification({
        user_id: complaint.user_id,
        title: "Status pengaduan diperbarui",
        message: `${complaint.subject} kini berstatus ${status}.`,
        type: status === "resolved" ? "success" : "info",
        link: `${complaint.role === "donatur" ? "/donor/complaint" : complaint.role === "penerima" ? "/recipient/complaint" : "/admin/complaints"}?complaint=${complaint.id}`
      });
      await refresh();
      return;
    }

    const db = readLocalDatabase();
    const notification = makeNotification(complaint.user_id, {
      title: "Status pengaduan diperbarui",
      message: `${complaint.subject} kini berstatus ${status}.`,
      type: status === "resolved" ? "success" : "info",
      link: complaint.role === "donatur" ? "/donor/complaint" : complaint.role === "penerima" ? "/recipient/complaint" : "/admin/complaints"
    });
    writeLocalDatabase({
      ...db,
      complaints: db.complaints.map((item) => item.id === id ? { ...item, status } : item),
      notifications: [notification, ...db.notifications]
    });
  }, [addNotification, data.complaints, refresh, user]);

  const markNotificationRead = useCallback(async (id: string) => {
    if (!user) return;
    if (supabase) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", id).eq("user_id", user.id);
      await refresh();
      return;
    }
    const db = readLocalDatabase();
    writeLocalDatabase({ ...db, notifications: db.notifications.map((item) => item.id === id && item.user_id === user.id ? { ...item, is_read: true } : item) });
  }, [refresh, user]);

  const updatePreferences = useCallback(async (preferences: Preferences) => {
    if (!user) return;
    if (supabase) {
      await supabase.from("user_preferences").upsert({ user_id: user.id, settings: preferences, updated_at: new Date().toISOString() });
      await refresh();
      return;
    }
    const db = readLocalDatabase();
    writeLocalDatabase({ ...db, preferences: { ...db.preferences, [user.id]: preferences } });
  }, [refresh, user]);

  const updateRequestStatus = useCallback(async (id: string, status: FoodRequest["status"]) => {
    if (!user || user.role !== "admin") return;
    const request = data.requests.find((item) => item.id === id);
    if (!request) return;
    const donation = data.donations.find((item) => item.id === request.donation_id);

    if (supabase) {
      const { error: rpcError } = await supabase.rpc("set_food_request_status", { p_request_id: id, p_status: status });
      if (rpcError) {
        if (status === "approved" && donation && request.status !== "approved") {
          if (donation.status !== "active") throw new Error("Donasi sudah tidak tersedia untuk disetujui.");
          if (donation.portions < request.portions) throw new Error(`Stok tersisa hanya ${donation.portions} porsi.`);
          const remaining = Math.max(0, donation.portions - request.portions);
          await supabase.from("donations").update({ portions: remaining, status: remaining > 0 ? "active" : "reserved" }).eq("id", request.donation_id);
        }
        if ((status === "rejected" || status === "cancelled") && donation && request.status === "approved") {
          const restored = donation.portions + request.portions;
          await supabase.from("donations").update({ portions: restored, status: "active" }).eq("id", request.donation_id);
        }
        if (status === "completed" && donation && donation.portions <= 0) {
          await supabase.from("donations").update({ status: "completed" }).eq("id", request.donation_id);
        }
        await supabase.from("food_requests").update({ status }).eq("id", id);
      }
      await addNotification({
        user_id: request.recipient_id,
        title: `Pengajuan ${status === "approved" ? "disetujui" : status === "rejected" ? "ditolak" : "diperbarui"}`,
        message: status === "approved"
          ? `${request.food_name} disetujui. Stok makanan sudah dikurangi ${request.portions} porsi.`
          : `Status ${request.food_name} kini ${status}.`,
        type: status === "approved" ? "success" : status === "rejected" ? "warning" : "info",
        link: "/recipient/history"
      });
      await refresh();
      return;
    }

    const db = readLocalDatabase();
    const nextDonations = db.donations.map((item) => {
      if (item.id !== request.donation_id) return item;
      if (status === "approved" && request.status !== "approved") {
        if (item.status !== "active") return item;
        const remaining = Math.max(0, item.portions - request.portions);
        return { ...item, portions: remaining, status: remaining > 0 ? "active" as const : "reserved" as const };
      }
      if ((status === "rejected" || status === "cancelled") && request.status === "approved") {
        return { ...item, portions: item.portions + request.portions, status: "active" as const };
      }
      if (status === "completed" && item.portions <= 0) {
        return { ...item, status: "completed" as const };
      }
      return item;
    });
    const notifications = [
      makeNotification(request.recipient_id, {
        title: `Pengajuan ${status === "approved" ? "disetujui" : status === "rejected" ? "ditolak" : "diperbarui"}`,
        message: status === "approved"
          ? `${request.food_name} disetujui. Stok makanan sudah dikurangi ${request.portions} porsi.`
          : `Status ${request.food_name} kini ${status}.`,
        type: status === "approved" ? "success" : status === "rejected" ? "warning" : "info",
        link: "/recipient/history"
      }),
      ...(request.donor_id ? [makeNotification(request.donor_id, {
        title: "Status penyaluran diperbarui",
        message: `${request.food_name}: ${status}.`,
        type: "info",
        link: "/donor/dashboard"
      })] : [])
    ];
    writeLocalDatabase({
      ...db,
      donations: nextDonations,
      requests: db.requests.map((item) => item.id === id ? { ...item, status } : item),
      notifications: [...notifications, ...db.notifications]
    });
  }, [addNotification, data.donations, data.requests, refresh, user]);

  const updateDonationStatus = useCallback(async (id: string, status: Donation["status"]) => {
    if (!user || user.role !== "admin") return;
    const donation = data.donations.find((item) => item.id === id);
    if (!donation) return;

    if (supabase) {
      await supabase.from("donations").update({ status }).eq("id", id);
      await addNotification({
        user_id: donation.donor_id,
        title: status === "active" ? "Donasi berhasil diverifikasi" : status === "rejected" ? "Donasi ditolak" : "Status donasi diperbarui",
        message: `${donation.food_name} kini berstatus ${status}.`,
        type: status === "active" ? "success" : status === "rejected" ? "warning" : "info",
        link: "/donor/history"
      });
      await refresh();
      return;
    }

    const db = readLocalDatabase();
    const notification = makeNotification(donation.donor_id, {
      title: status === "active" ? "Donasi berhasil diverifikasi" : status === "rejected" ? "Donasi ditolak" : "Status donasi diperbarui",
      message: `${donation.food_name} kini berstatus ${status}.`,
      type: status === "active" ? "success" : status === "rejected" ? "warning" : "info",
      link: "/donor/history"
    });
    writeLocalDatabase({
      ...db,
      donations: db.donations.map((item) => item.id === id ? { ...item, status } : item),
      notifications: [notification, ...db.notifications]
    });
  }, [addNotification, data.donations, refresh, user]);

  return useMemo(() => ({
    ...data,
    loading,
    refresh,
    createDonation,
    createRequest,
    createComplaint,
    updateComplaintStatus,
    markNotificationRead,
    updatePreferences,
    updateRequestStatus,
    updateDonationStatus
  }), [createComplaint, createDonation, createRequest, data, loading, markNotificationRead, refresh, updateComplaintStatus, updateDonationStatus, updatePreferences, updateRequestStatus]);
}

export function readableRole(role: UserRole) {
  if (role === "donatur") return "Donatur";
  if (role === "penerima") return "Penerima";
  return "Admin";
}
