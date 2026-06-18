import { ProtectedPage } from "@/components/layout/app-shell";
import { RecipientCatalogPage } from "@/components/pages/recipient-catalog";

export default function Page() {
  return <ProtectedPage role="penerima" title="Katalog Makanan" subtitle="Cari makanan tersedia dari donatur sesuai preferensi dan lokasi."><RecipientCatalogPage /></ProtectedPage>;
}
