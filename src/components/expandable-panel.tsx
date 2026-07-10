"use client";

import { useEffect, useState } from "react";
import { Maximize2, X } from "lucide-react";

export function ExpandablePanel({ title, subtitle, children, className = "" }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);
  const content = (
    <section className={`card expandable-panel ${className}`}>
      <div className="row panel-heading">
        <div><h2>{title}</h2>{subtitle && <div className="small muted">{subtitle}</div>}</div>
        <button className="icon-button" onClick={() => setOpen(!open)} aria-label={open ? "Close expanded view" : "Expand view"}>{open ? <X size={19} /> : <Maximize2 size={18} />}</button>
      </div>
      <div className={open ? "expanded-content" : ""}>{children}</div>
    </section>
  );
  return <>{content}{open && <div className="modal-backdrop" onMouseDown={() => setOpen(false)}><div className="modal-sheet" onMouseDown={(e) => e.stopPropagation()}>{content}</div></div>}</>;
}
