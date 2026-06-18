import { ProtectedPage } from "@/components/layout/app-shell";
import { SettingsPage } from "@/components/pages/account-pages";
export default function Page() { return <ProtectedPage role="donatur" title="Settings Donatur" subtitle="Pengaturan akun khusus donatur."><SettingsPage role="donatur" /></ProtectedPage>; }
