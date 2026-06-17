import { ProtectedPage } from "@/components/layout/app-shell";
import { RecipientDashboardPage } from "@/components/pages/recipient-dashboard";

export default function Page() {
  return <ProtectedPage role="penerima" title="Dashboard Penerima" subtitle="Cari makanan, ajukan permintaan, dan pantau status dari akun penerima Anda."><RecipientDashboardPage /></ProtectedPage>;
}
