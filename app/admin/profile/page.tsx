import { ProtectedPage } from "@/components/layout/app-shell";
import { AdminProfilePage } from "@/components/pages/admin-pages";
export default function Page() { return <ProtectedPage role="admin" title="Profil Admin" subtitle="Kelola identitas akun admin."><AdminProfilePage /></ProtectedPage>; }
