"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, NotebookPen, CalendarDays, ChartNoAxesCombined, MoreHorizontal } from "lucide-react";

const items = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/log", label: "Log", Icon: NotebookPen },
  { href: "/plan", label: "Plan", Icon: CalendarDays },
  { href: "/progress", label: "Progress", Icon: ChartNoAxesCombined },
  { href: "/more", label: "More", Icon: MoreHorizontal },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {items.map(({ href, label, Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={active ? "nav-item active" : "nav-item"}>
            <Icon size={20} strokeWidth={2.2} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
