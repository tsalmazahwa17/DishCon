import { ProtectedPage } from "@/components/layout/app-shell";
import { DonorHistoryPage } from "@/components/pages/history-pages";
export default function Page() { return <ProtectedPage role="donatur" title="Riwayat Donasi" subtitle="Data donasi khusus akun donatur Anda."><DonorHistoryPage /></ProtectedPage>; }
