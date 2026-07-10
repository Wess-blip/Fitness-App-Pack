"use client";

import Link from "next/link";
import { LogIn, LogOut, UserCircle } from "lucide-react";
import { useAppData } from "./app-data-provider";

export function ProfileButton() {
  const { user, authReady, signOut } = useAppData();
  if (!authReady) return <span className="profile-chip">...</span>;
  if (!user) return <Link className="profile-chip" href="/login"><LogIn size={17} /> Sign in</Link>;
  const name = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Profile";
  return (
    <button className="profile-chip" onClick={() => void signOut()} title="Sign out">
      <UserCircle size={18} /><span>{String(name).split(" ")[0]}</span><LogOut size={14} />
    </button>
  );
}
