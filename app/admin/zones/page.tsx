import { ProtectedPage } from "@/components/layout/app-shell";
import { AdminZonesPage } from "@/components/pages/admin-pages";
export default function Page() { return <ProtectedPage role="admin" title="Zona Distribusi" subtitle="Pantau area distribusi makanan."><AdminZonesPage /></ProtectedPage>; }
