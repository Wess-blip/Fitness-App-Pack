"use client";

import { AlertTriangle, Cloud, CloudOff, LoaderCircle } from "lucide-react";
import { useAppData } from "./app-data-provider";

export function SyncStatusBadge({ compact = false }: { compact?: boolean }) {
  const { authReady, user, syncStatus } = useAppData();

  if (!authReady) {
    return <span className="save-chip loading"><LoaderCircle className="spin" size={15} />{compact ? "Checking" : "Checking account"}</span>;
  }
  if (!user) {
    return <span className="save-chip local"><CloudOff size={15} />{compact ? "Device only" : "Saved on this device"}</span>;
  }
  if (syncStatus === "loading") {
    return <span className="save-chip loading"><LoaderCircle className="spin" size={15} />{compact ? "Loading" : "Loading cloud data"}</span>;
  }
  if (syncStatus === "local") {
    return <span className="save-chip loading"><LoaderCircle className="spin" size={15} />{compact ? "Connecting" : "Connecting to cloud"}</span>;
  }
  if (syncStatus === "saving") {
    return <span className="save-chip saving"><LoaderCircle className="spin" size={15} />{compact ? "Saving" : "Saving to cloud"}</span>;
  }
  if (syncStatus === "error") {
    return <span className="save-chip error"><AlertTriangle size={15} />{compact ? "Sync issue" : "Cloud sync issue"}</span>;
  }
  return <span className="save-chip saved"><Cloud size={15} />Cloud saved</span>;
}
