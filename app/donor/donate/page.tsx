import { ProtectedPage } from "@/components/layout/app-shell";
import { DonateFormPage } from "@/components/pages/donate-form";

export default function Page() {
  return <ProtectedPage role="donatur" title="Form Donasi Makanan" subtitle="Input data makanan berlebih untuk disalurkan secara aman."><DonateFormPage /></ProtectedPage>;
}
