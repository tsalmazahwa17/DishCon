import { ProtectedPage } from "@/components/layout/app-shell";
import { ProfilePage } from "@/components/pages/account-pages";
export default function Page() { return <ProtectedPage role="donatur" title="Profil Donatur" subtitle="Kelola identitas dan kontak donatur."><ProfilePage role="donatur" /></ProtectedPage>; }
