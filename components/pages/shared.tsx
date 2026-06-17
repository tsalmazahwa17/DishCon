"use client";

import { IconType } from "react-icons";
import { FiInbox } from "react-icons/fi";
import { cn } from "@/lib/utils";

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-stone-300 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-2xl text-brand-700"><FiInbox /></div>
      <h3 className="mt-4 text-xl font-black text-ink">{title}</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-stone-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function MetricCard({ icon: Icon, label, value, hint, tone = "green" }: { icon: IconType; label: string; value: string | number; hint?: string; tone?: "green" | "blue" | "orange" | "purple" }) {
  const toneClass = {
    green: "bg-brand-50 text-brand-700",
    blue: "bg-blue-50 text-blue-700",
    orange: "bg-orange-50 text-orange-700",
    purple: "bg-purple-50 text-purple-700"
  }[tone];
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-card">
      <div className={cn("grid h-12 w-12 place-items-center rounded-2xl text-xl", toneClass)}><Icon /></div>
      <p className="mt-5 text-4xl font-black tracking-tight text-ink">{value}</p>
      <p className="mt-1 font-semibold text-stone-700">{label}</p>
      {hint && <p className="mt-2 text-sm text-stone-500">{hint}</p>}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const lower = status.toLowerCase();
  const cls = lower.includes("approved") || lower.includes("disetujui") || lower.includes("active") || lower.includes("tersedia")
    ? "bg-brand-50 text-brand-700"
    : lower.includes("pending") || lower.includes("menunggu") || lower.includes("verification")
      ? "bg-orange-50 text-orange-700"
      : lower.includes("rejected") || lower.includes("ditolak")
        ? "bg-red-50 text-red-700"
        : "bg-stone-100 text-stone-600";
  return <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-black", cls)}>{status.replaceAll("_", " ")}</span>;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-black text-ink">{label}</span>{children}</label>;
}
