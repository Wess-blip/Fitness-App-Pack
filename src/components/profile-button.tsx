"use client";

import Link from "next/link";
import { useRef } from "react";
import { Cloud, CloudOff, LogIn, LogOut, UserCircle } from "lucide-react";
import { useAppData } from "./app-data-provider";
import { SyncStatusBadge } from "./sync-status-badge";

export function ProfileButton() {
  const { user, authReady, signOut } = useAppData();
  const menuRef = useRef<HTMLDetailsElement>(null);
  const closeMenu = () => menuRef.current?.removeAttribute("open");
  if (!authReady) return <span className="profile-chip">...</span>;
  const name = user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "Profile";
  return (
    <details className="account-menu" ref={menuRef}>
      <summary className="profile-chip" title="Open account and sync status">
        {user ? <UserCircle size={18} /> : <CloudOff size={17} />}
        <span>{user ? String(name).split(" ")[0] : "Guest"}</span>
        <span className={`account-dot ${user ? "online" : "local"}`} aria-hidden="true" />
      </summary>
      <div className="account-popover">
        <div className="account-popover-title">{user ? String(name) : "Guest mode"}</div>
        <div className="small muted">{user ? "Signed in with Google" : "Saved only on this device"}</div>
        {user?.email && <div className="small account-email">{user.email}</div>}
        <SyncStatusBadge />
        <div className="account-popover-actions">
          {user ? <>
            <Link href="/setup" onClick={closeMenu}><UserCircle size={16} /> Profile and setup</Link>
            <button onClick={() => { closeMenu(); void signOut(); }}><LogOut size={16} /> Sign out</button>
          </> : <Link href="/login" onClick={closeMenu}><LogIn size={16} /> Sign in to sync</Link>}
        </div>
        <div className="account-storage-note">{user ? <Cloud size={14} /> : <CloudOff size={14} />}{user ? "Your latest changes sync to your private cloud record." : "This browser keeps a local copy until you sign in."}</div>
      </div>
    </details>
  );
}
