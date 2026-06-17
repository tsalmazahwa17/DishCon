import { ProtectedPage } from "@/components/layout/app-shell";
import { DonorDashboardPage } from "@/components/pages/donor-dashboard";

export default function Page() {
  return <ProtectedPage role="donatur" title="Dashboard Donatur" subtitle="Pantau aktivitas berbagi makanan dari akun donatur Anda."><DonorDashboardPage /></ProtectedPage>;
}
