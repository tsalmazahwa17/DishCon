import { ProtectedPage } from "@/components/layout/app-shell";
import { ComplaintPage } from "@/components/pages/account-pages";

export default function Page() {
  return (
    <ProtectedPage role="admin" title="Pusat Pengaduan" subtitle="Buka detail laporan pengguna dan perbarui status penanganannya.">
      <ComplaintPage role="admin" />
    </ProtectedPage>
  );
}
