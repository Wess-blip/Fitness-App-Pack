import { MODEL_CONFIG } from "@/config/model-config";

export default function ModelSettingsPage() {
  return (
    <>
      <header className="page-header"><div><div className="eyebrow">Admin</div><h1>Model settings</h1><p style={{ margin: 0 }}>Safe edit points are centralized and versioned.</p></div><span className="pill">v{MODEL_CONFIG.engineVersion}</span></header>
      <section className="card"><h2>Current configuration</h2><pre className="code">{JSON.stringify(MODEL_CONFIG, null, 2)}</pre></section>
      <section className="section notice">Edit <strong>src/config/model-config.ts</strong>, increment the engine version, run the full test suite, and record the change in the model changelog. Database-backed overrides are included in the Supabase schema for production.</section>
    </>
  );
}
