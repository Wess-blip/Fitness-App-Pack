"use client";

import Link from "next/link";
import { LogIn, LogOut, UserCircle } from "lucide-react";
import { useAppData } from "./app-data-provider";
import { SyncStatusBadge } from "./sync-status-badge";

export function AccountStatusCard() {
  const { user, authReady, lastCloudSyncAt, signOut } = useAppData();
  const name = user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "Your account";

  return (
    <section className="section card account-status-card">
      <div className="row account-status-heading">
        <div className="row account-identity">
          <UserCircle size={25} />
          <div>
            <strong>{authReady ? (user ? String(name) : "Guest mode") : "Checking account"}</strong>
            <div className="small muted">{user ? "Signed in with Google" : "Sign in to sync across devices"}</div>
          </div>
        </div>
        <SyncStatusBadge compact />
      </div>
      {user ? (
        <>
          <div className="small account-email">{user.email}{lastCloudSyncAt ? ` · Last synced ${new Date(lastCloudSyncAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}</div>
          <div className="account-actions">
            <Link className="button secondary" href="/setup">Profile and setup</Link>
            <button className="button secondary" onClick={() => void signOut()}><LogOut size={17} /> Sign out</button>
          </div>
        </>
      ) : (
        <div className="account-actions">
          <Link className="button accent" href="/login"><LogIn size={17} /> Sign in with Google</Link>
        </div>
      )}
    </section>
  );
}
