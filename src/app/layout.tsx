import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Feria Effix 2026 — Panel interno",
  description:
    "Panel operativo interno del equipo organizador de Feria Effix 2026.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
