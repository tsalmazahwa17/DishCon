import { ProtectedPage } from "@/components/layout/app-shell";
import { RecipientHistoryPage } from "@/components/pages/history-pages";
export default function Page() { return <ProtectedPage role="penerima" title="Riwayat Pengajuan" subtitle="Status permintaan makanan khusus akun penerima Anda."><RecipientHistoryPage /></ProtectedPage>; }
