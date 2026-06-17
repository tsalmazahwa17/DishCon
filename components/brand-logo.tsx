import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandLogo({ className, compact = false, dark = false }: { className?: string; compact?: boolean; dark?: boolean }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-3", className)}>
      <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-brand-100 bg-white shadow-md">
        <Image src="/logo-dishcon.jpeg" alt="DishCon logo" width={40} height={40} className="h-full w-full object-cover" priority />
      </span>
      {!compact && <span className={cn("text-2xl font-extrabold tracking-tight", dark ? "text-white" : "text-ink")}>DishConnect</span>}
    </Link>
  );
}
