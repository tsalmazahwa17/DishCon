import { ProtectedPage } from "@/components/layout/app-shell";
import { AdminSettingsPage } from "@/components/pages/admin-pages";
export default function Page() { return <ProtectedPage role="admin" title="Konfigurasi" subtitle="Pengaturan akun dan sistem admin."><AdminSettingsPage /></ProtectedPage>; }
