import { IconType } from "react-icons";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({ icon: Icon, label, value, hint, tone = "green" }: { icon: IconType; label: string; value: string; hint?: string; tone?: "green" | "yellow" | "blue" | "red" | "dark" }) {
  const tones = {
    green: "bg-brand-50 text-brand-700",
    yellow: "bg-yellow-100 text-yellow-700",
    blue: "bg-blue-50 text-blue-700",
    red: "bg-red-50 text-red-700",
    dark: "bg-brand-700 text-white"
  };
  return (
    <Card className="p-6">
      <div className="flex items-center gap-5">
        <span className={cn("grid h-16 w-16 shrink-0 place-items-center rounded-full text-2xl", tones[tone])}><Icon /></span>
        <div>
          <p className="text-sm font-bold text-stone-700">{label}</p>
          <p className="mt-1 text-3xl font-black text-ink">{value}</p>
          {hint && <p className="mt-1 text-sm text-stone-500">{hint}</p>}
        </div>
      </div>
    </Card>
  );
}

export function MiniBars({ data = [76,132,104,160,122,66,52], labels = ["Sen","Sel","Rab","Kam","Jum","Sab","Min"] }: { data?: number[]; labels?: string[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex h-32 items-end gap-4">
      {data.map((value, index) => (
        <div key={labels[index]} className="flex flex-1 flex-col items-center gap-2">
          <div style={{ height: `${Math.max(22, (value / max) * 100)}%` }} className={`w-full rounded-t-lg ${index === 1 ? "bg-brand-700" : "bg-brand-100"}`} />
          <p className="text-xs text-stone-500">{labels[index]}</p>
          <p className="-mt-2 text-xs font-semibold text-stone-500">{value}</p>
        </div>
      ))}
    </div>
  );
}

export function ProgressLine({ label, value, tone = "green" }: { label: string; value: number; tone?: "green" | "blue" | "yellow" | "purple" }) {
  const colors = { green: "bg-brand-700", blue: "bg-blue-600", yellow: "bg-yellow-600", purple: "bg-violet-600" };
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm"><span className="text-stone-500">{label}</span><b>{value}{typeof value === "number" && value <= 100 ? "%" : ""}</b></div>
      <div className="h-2 rounded-full bg-stone-100"><div className={cn("h-2 rounded-full", colors[tone])} style={{ width: `${Math.min(value, 100)}%` }} /></div>
    </div>
  );
}
