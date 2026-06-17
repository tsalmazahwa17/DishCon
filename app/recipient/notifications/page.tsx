import { ProtectedPage } from "@/components/layout/app-shell";
import { NotificationsPage } from "@/components/pages/account-pages";
export default function Page() { return <ProtectedPage role="penerima" title="Notifikasi Penerima" subtitle="Semua notifikasi aktivitas penerima."><NotificationsPage role="penerima" /></ProtectedPage>; }
