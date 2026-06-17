import { ProtectedPage } from "@/components/layout/app-shell";
import { SettingsPage } from "@/components/pages/account-pages";
export default function Page() { return <ProtectedPage role="penerima" title="Settings Penerima" subtitle="Pengaturan akun khusus penerima."><SettingsPage role="penerima" /></ProtectedPage>; }
