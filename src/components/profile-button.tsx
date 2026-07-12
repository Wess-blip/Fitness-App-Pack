"use client";

import Link from "next/link";
import { LogIn, UserCircle } from "lucide-react";
import { useAppData } from "./app-data-provider";

export function ProfileButton() {
  const { user, authReady } = useAppData();
  if (!authReady) return <span className="profile-chip">...</span>;
  if (!user) return <Link className="profile-chip" href="/login"><LogIn size={17} /> Sign in</Link>;
  const name = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Profile";
  return (
    <Link className="profile-chip" href="/setup" title="Open profile and setup">
      <UserCircle size={18} /><span>{String(name).split(" ")[0]}</span>
    </Link>
  );
}
