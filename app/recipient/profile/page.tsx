import { ProtectedPage } from "@/components/layout/app-shell";
import { ProfilePage } from "@/components/pages/account-pages";
export default function Page() { return <ProtectedPage role="penerima" title="Profil Penerima" subtitle="Kelola identitas dan kontak penerima."><ProfilePage role="penerima" /></ProtectedPage>; }
