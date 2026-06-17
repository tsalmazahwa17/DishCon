import { ProtectedPage } from "@/components/layout/app-shell";
import { NotificationsPage } from "@/components/pages/account-pages";
export default function Page() { return <ProtectedPage role="donatur" title="Notifikasi Donatur" subtitle="Semua notifikasi aktivitas donatur."><NotificationsPage role="donatur" /></ProtectedPage>; }
