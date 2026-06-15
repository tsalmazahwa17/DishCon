import { ProtectedPage } from "@/components/layout/app-shell";
import { AdminDonationsPage } from "@/components/pages/admin-pages";
export default function Page() { return <ProtectedPage role="admin" title="Manajemen Donasi" subtitle="Kelola data donasi makanan."><AdminDonationsPage /></ProtectedPage>; }
