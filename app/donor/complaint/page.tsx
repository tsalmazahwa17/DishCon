import { ProtectedPage } from "@/components/layout/app-shell";
import { ComplaintPage } from "@/components/pages/account-pages";
export default function Page() { return <ProtectedPage role="donatur" title="Pusat Pengaduan Donatur" subtitle="Laporkan kendala sebagai donatur."><ComplaintPage role="donatur" /></ProtectedPage>; }
