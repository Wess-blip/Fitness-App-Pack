import type { ReactNode } from "react";
import Link from "next/link";
import { ProfileButton } from "./profile-button";
import { BottomNav } from "./bottom-nav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <div className="top-bar"><Link href="/" className="brand"><span className="brand-dot">F</span><strong>FormLab</strong></Link><ProfileButton /></div>
      <main className="page-wrap">{children}</main>
      <BottomNav />
    </div>
  );
}
