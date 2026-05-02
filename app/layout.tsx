import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Huevos Juancho",
  description: "Registro de pedidos de Huevos Juancho",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Juancho",
  },
  icons: {
    apple: "/icons/logo-don-luis.png",
    icon: "/icons/logo-don-luis.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#4a2c0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icons/logo-don-luis.png" />
        <link rel="icon" href="/icons/logo-don-luis.png" type="image/png" />
      </head>
      <body className="min-h-screen bg-brand-50">
        {children}
      </body>
    </html>
  );
}
