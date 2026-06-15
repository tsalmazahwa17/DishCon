import { ProtectedPage } from "@/components/layout/app-shell";
import { AdminDashboardPage } from "@/components/pages/admin-pages";
export default function Page() { return <ProtectedPage role="admin" title="Admin Panel" subtitle="Pusat kontrol operasional DishCon."><AdminDashboardPage /></ProtectedPage>; }
