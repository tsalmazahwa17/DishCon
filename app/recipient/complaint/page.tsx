import { ProtectedPage } from "@/components/layout/app-shell";
import { ComplaintPage } from "@/components/pages/account-pages";
export default function Page() { return <ProtectedPage role="penerima" title="Pusat Pengaduan Penerima" subtitle="Laporkan kendala sebagai penerima."><ComplaintPage role="penerima" /></ProtectedPage>; }
