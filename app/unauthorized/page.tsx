import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function Page() { return <main className="grid min-h-screen place-items-center bg-cream p-6 text-center"><div className="max-w-md rounded-[2rem] border border-stone-200 bg-white p-8 shadow-card"><h1 className="text-3xl font-black text-brand-900">Akses Ditolak</h1><p className="mt-3 text-stone-500">Halaman ini hanya bisa dibuka oleh role yang sesuai.</p><Button asChild className="mt-6"><Link href="/login">Kembali Login</Link></Button></div></main>; }
