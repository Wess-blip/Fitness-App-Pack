"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { DEFAULT_APP_STATE } from "@/data/default-app-state";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { fieldUnitsFromSystem } from "@/lib/units";
import type { AppState } from "@/types/app-state";

const LOCAL_KEY = "formlab-app-state-v1.2";

export type SyncStatus = "loading" | "local" | "saving" | "saved" | "error";
type AppDataContextValue = {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  patch: <K extends keyof AppState>(section: K, value: Partial<AppState[K]>) => void;
  reset: () => void;
  user: User | null;
  authReady: boolean;
  syncStatus: SyncStatus;
  lastCloudSyncAt: string | null;
  signOut: () => Promise<void>;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

function mergeState(input: Partial<AppState> | null | undefined): AppState {
  if (!input) return DEFAULT_APP_STATE;
  const legacyUnits = input.profile?.unitSystem ?? DEFAULT_APP_STATE.profile.unitSystem;
  return {
    ...DEFAULT_APP_STATE,
    ...input,
    schemaVersion: 4,
    profile: {
      ...DEFAULT_APP_STATE.profile,
      ...input.profile,
      fieldUnits: { ...fieldUnitsFromSystem(legacyUnits), ...input.profile?.fieldUnits },
    },
    baseline: { ...DEFAULT_APP_STATE.baseline, ...input.baseline },
    goals: {
      ...DEFAULT_APP_STATE.goals,
      ...input.goals,
      stopMode: input.goals?.stopMode ?? (input.goals?.goalDriver === "weight" ? "weight" : "body-fat"),
    },
    activity: {
      ...DEFAULT_APP_STATE.activity,
      ...input.activity,
      treadmill: { ...DEFAULT_APP_STATE.activity.treadmill, ...input.activity?.treadmill },
    },
    model: {
      ...DEFAULT_APP_STATE.model,
      ...input.model,
      bmrWeights: { ...DEFAULT_APP_STATE.model.bmrWeights, ...input.model?.bmrWeights },
    },
    plan: { ...DEFAULT_APP_STATE.plan, ...input.plan, weekdays: Array.isArray(input.plan?.weekdays) ? input.plan.weekdays : DEFAULT_APP_STATE.plan.weekdays },
    logs: Array.isArray(input.logs) ? input.logs : DEFAULT_APP_STATE.logs,
    updatedAt: input.updatedAt ?? new Date().toISOString(),
  };
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [state, setState] = useState<AppState>(DEFAULT_APP_STATE);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!supabase);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("loading");
  const [cloudLoadedFor, setCloudLoadedFor] = useState<string | null>(null);
  const [lastCloudSyncAt, setLastCloudSyncAt] = useState<string | null>(null);
  const loadingCloudFor = useRef<string | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(LOCAL_KEY);
      if (saved) queueMicrotask(() => setState(mergeState(JSON.parse(saved) as Partial<AppState>)));
    } catch {
      queueMicrotask(() => setState(DEFAULT_APP_STATE));
    } finally {
      queueMicrotask(() => { setReady(true); setSyncStatus("local"); });
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setAuthReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      if (!nextUser) {
        loadingCloudFor.current = null;
        setCloudLoadedFor(null);
        setLastCloudSyncAt(null);
        setSyncStatus("local");
      }
    });
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!ready || !user || !supabase || cloudLoadedFor === user.id || loadingCloudFor.current === user.id) return;
    loadingCloudFor.current = user.id;
    queueMicrotask(() => setSyncStatus("loading"));
    void supabase.from("user_app_state").select("state").eq("user_id", user.id).maybeSingle().then(({ data, error }) => {
      loadingCloudFor.current = null;
      if (error) {
        setSyncStatus("error");
        return;
      }
      if (!error && data?.state) {
        setState(mergeState(data.state as Partial<AppState>));
        setLastCloudSyncAt(new Date().toISOString());
      }
      setCloudLoadedFor(user.id);
      setSyncStatus(data?.state ? "saved" : "saving");
    });
  }, [ready, user, supabase, cloudLoadedFor]);

  useEffect(() => {
    if (!ready) return;
    const next = { ...state, updatedAt: new Date().toISOString() };
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
    if (!user || !supabase) { queueMicrotask(() => setSyncStatus("local")); return; }
    if (cloudLoadedFor !== user.id) {
      queueMicrotask(() => setSyncStatus(loadingCloudFor.current === user.id ? "loading" : "error"));
      return;
    }
    queueMicrotask(() => setSyncStatus("saving"));
    const timer = window.setTimeout(() => {
      void supabase.from("user_app_state").upsert({ user_id: user.id, state: next, updated_at: new Date().toISOString() }, { onConflict: "user_id" })
        .then(({ error }) => {
          setSyncStatus(error ? "error" : "saved");
          if (!error) setLastCloudSyncAt(new Date().toISOString());
        });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [state, ready, user, supabase, cloudLoadedFor]);

  const patch = useCallback(<K extends keyof AppState>(section: K, value: Partial<AppState[K]>) => {
    setState((current) => ({ ...current, [section]: { ...(current[section] as object), ...value }, updatedAt: new Date().toISOString() }));
  }, []);
  const reset = useCallback(() => setState({ ...DEFAULT_APP_STATE, updatedAt: new Date().toISOString() }), []);
  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    loadingCloudFor.current = null;
    setUser(null);
    setCloudLoadedFor(null);
    setLastCloudSyncAt(null);
    setSyncStatus("local");
  }, [supabase]);

  return <AppDataContext.Provider value={{ state, setState, patch, reset, user, authReady, syncStatus, lastCloudSyncAt, signOut }}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const value = useContext(AppDataContext);
  if (!value) throw new Error("useAppData must be used inside AppDataProvider");
  return value;
}
