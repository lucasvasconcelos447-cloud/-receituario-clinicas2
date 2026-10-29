export const dynamic = "force-dynamic";
import type { Metadata, Viewport } from "next";
import { APP } from "@/lib/config";
import { PwaProvider } from "@/components/pwa";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: APP.name, template: `%s · ${APP.name}` },
  description: APP.description,
  appleWebApp: { capable: true, title: APP.name, statusBarStyle: "default" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
};
export const viewport: Viewport = {
  themeColor: "#145c56",
  width: "device-width",
  initialScale: 1,
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <PwaProvider>{children}</PwaProvider>
      </body>
    </html>
  );
}
