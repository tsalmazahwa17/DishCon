import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "DishCon — Food Sharing Platform",
  description: "Platform donasi makanan berbasis AI untuk mengurangi food waste dan membantu sesama.",
  icons: {
    icon: "/logo-dishcon.jpeg"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
