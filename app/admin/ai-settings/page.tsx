import { ProtectedPage } from "@/components/layout/app-shell";
import { AdminAiPage } from "@/components/pages/admin-pages";
export default function Page() { return <ProtectedPage role="admin" title="Pengaturan AI" subtitle="Kelola konfigurasi assessment makanan."><AdminAiPage /></ProtectedPage>; }
