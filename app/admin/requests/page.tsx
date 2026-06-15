import { ProtectedPage } from "@/components/layout/app-shell";
import { AdminRequestsPage } from "@/components/pages/admin-pages";
export default function Page() { return <ProtectedPage role="admin" title="Manajemen Pengajuan" subtitle="Setujui atau tolak permintaan penerima."><AdminRequestsPage /></ProtectedPage>; }
