"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, LineChart, NotebookPen, TrendingUp } from "lucide-react";

const items = [
  { href: "/", label: "Today", Icon: Home },
  { href: "/projection", label: "Projection", Icon: LineChart },
  { href: "/log", label: "Log", Icon: NotebookPen },
  { href: "/plan", label: "Plan", Icon: CalendarDays },
  { href: "/progress", label: "Progress", Icon: TrendingUp },
];
export function BottomNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/login")) return null;
  return <nav className="bottom-nav" aria-label="Primary navigation">{items.map(({ href, label, Icon }) => {
    const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
    return <Link key={href} href={href} className={active ? "nav-item active" : "nav-item"}><Icon size={20} strokeWidth={2.2} /><span>{label}</span></Link>;
  })}</nav>;
}
