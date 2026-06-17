import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "green" | "orange" | "blue" | "red" | "gray" | "yellow";
};

const tones = {
  green: "bg-brand-50 text-brand-700 border-brand-100",
  orange: "bg-orange-50 text-orange-700 border-orange-100",
  blue: "bg-blue-50 text-blue-700 border-blue-100",
  red: "bg-red-50 text-red-700 border-red-100",
  gray: "bg-stone-100 text-stone-600 border-stone-200",
  yellow: "bg-yellow-50 text-yellow-700 border-yellow-100"
};

export function Badge({ className, tone = "green", ...props }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold", tones[tone], className)} {...props} />
  );
}
