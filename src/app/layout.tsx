import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { cinzel, cormorant, greatVibes, inter } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "BirthDiamond Studio — 3D Jewelry Configurator",
  description: "Design custom BirthDiamond rings and pendants in real-time 3D.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable} ${greatVibes.variable} ${cinzel.variable}`}>
      <body>
        {children}
        <Toaster position="top-center" richColors={false} closeButton />
      </body>
    </html>
  );
}
