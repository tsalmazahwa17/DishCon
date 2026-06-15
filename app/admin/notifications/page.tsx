import { ProtectedPage } from "@/components/layout/app-shell";
import { AdminNotificationsPage } from "@/components/pages/admin-pages";
export default function Page() { return <ProtectedPage role="admin" title="Notifikasi Admin" subtitle="Semua notifikasi sistem admin."><AdminNotificationsPage /></ProtectedPage>; }
