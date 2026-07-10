import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { PwaRegister } from "@/components/pwa-register";


export const metadata: Metadata = {
  title: "FormLab Fitness",
  description: "Simple training, nutrition and progress planning powered by a transparent calculation engine.",
  applicationName: "FormLab Fitness",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0b1f3a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><PwaRegister /><AppShell>{children}</AppShell></body>
    </html>
  );
}
