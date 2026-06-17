import { Suspense } from "react";
import { ProtectedPage } from "@/components/layout/app-shell";
import { RequestFormPage } from "@/components/pages/request-form";

export default function Page() {
  return <ProtectedPage role="penerima" title="Form Pengajuan Menerima Makan" subtitle="Ajukan makanan dari donatur dengan data yang terverifikasi."><Suspense><RequestFormPage /></Suspense></ProtectedPage>;
}
