import { ProtectedPage } from "@/components/layout/app-shell";
import { AdminUsersPage } from "@/components/pages/admin-pages";
export default function Page() { return <ProtectedPage role="admin" title="Manajemen Pengguna" subtitle="Pantau profil donatur, penerima, dan admin."><AdminUsersPage /></ProtectedPage>; }
