"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { DEFAULT_APP_STATE } from "@/data/default-app-state";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import type { AppState } from "@/types/app-state";

const LOCAL_KEY = "formlab-app-state-v1.2";

type SyncStatus = "loading" | "local" | "saving" | "saved" | "error";
type AppDataContextValue = {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  patch: <K extends keyof AppState>(section: K, value: Partial<AppState[K]>) => void;
  reset: () => void;
  user: User | null;
  authReady: boolean;
  syncStatus: SyncStatus;
  signOut: () => Promise<void>;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

function mergeState(input: Partial<AppState> | null | undefined): AppState {
  if (!input) return DEFAULT_APP_STATE;
  return {
    ...DEFAULT_APP_STATE,
    ...input,
    schemaVersion: 2,
    profile: { ...DEFAULT_APP_STATE.profile, ...input.profile },
    baseline: { ...DEFAULT_APP_STATE.baseline, ...input.baseline },
    goals: { ...DEFAULT_APP_STATE.goals, ...input.goals },
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
  const loadedCloudFor = useRef<string | null>(null);

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
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!ready || !user || !supabase || loadedCloudFor.current === user.id) return;
    loadedCloudFor.current = user.id;
    void supabase.from("user_app_state").select("state").eq("user_id", user.id).maybeSingle().then(({ data, error }) => {
      if (!error && data?.state) {
        setState(mergeState(data.state as Partial<AppState>));
        setSyncStatus("saved");
      }
    });
  }, [ready, user, supabase]);

  useEffect(() => {
    if (!ready) return;
    const next = { ...state, updatedAt: new Date().toISOString() };
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
    if (!user || !supabase) { queueMicrotask(() => setSyncStatus("local")); return; }
    queueMicrotask(() => setSyncStatus("saving"));
    const timer = window.setTimeout(() => {
      void supabase.from("user_app_state").upsert({ user_id: user.id, state: next, updated_at: new Date().toISOString() }, { onConflict: "user_id" })
        .then(({ error }) => setSyncStatus(error ? "error" : "saved"));
    }, 700);
    return () => window.clearTimeout(timer);
  }, [state, ready, user, supabase]);

  const patch = useCallback(<K extends keyof AppState>(section: K, value: Partial<AppState[K]>) => {
    setState((current) => ({ ...current, [section]: { ...(current[section] as object), ...value }, updatedAt: new Date().toISOString() }));
  }, []);
  const reset = useCallback(() => setState({ ...DEFAULT_APP_STATE, updatedAt: new Date().toISOString() }), []);
  const signOut = useCallback(async () => { if (supabase) await supabase.auth.signOut(); setUser(null); }, [supabase]);

  return <AppDataContext.Provider value={{ state, setState, patch, reset, user, authReady, syncStatus, signOut }}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const value = useContext(AppDataContext);
  if (!value) throw new Error("useAppData must be used inside AppDataProvider");
  return value;
}
