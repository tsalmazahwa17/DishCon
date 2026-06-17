import { ProtectedPage } from "@/components/layout/app-shell";
import { FoodDetailPage } from "@/components/pages/food-detail";

export default function Page() {
  return <ProtectedPage role="penerima" title="Detail Makanan" subtitle="Baca detail makanan, nutrisi AI, dan lokasi sebelum mengajukan pengambilan."><FoodDetailPage /></ProtectedPage>;
}
