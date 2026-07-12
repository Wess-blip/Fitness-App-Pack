import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppDataProvider } from "@/components/app-data-provider";
import { AppShell } from "@/components/app-shell";
import { PwaRegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  title: "FormLab Fitness",
  description: "Modular fitness planning, projections, logging and rolling TDEE calibration.",
  applicationName: "FormLab Fitness",
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = { themeColor: "#0d5c63", width: "device-width", initialScale: 1, viewportFit: "cover" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><PwaRegister /><AppDataProvider><AppShell>{children}</AppShell></AppDataProvider></body></html>;
}
