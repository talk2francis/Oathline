"use client";

import { useEffect, useMemo, useState } from "react";

type Tool = { name: string; classification: "READ" | "WRITE" | "UNKNOWN"; reasoning: string; observedInputShape: unknown; observedResponseShape: unknown; observedAt: string; clientVersion: string; method: string };
type Surface = { client: string; clientVersion: string; endpoint: string; observedAt: string; toolCount: number; classificationPolicy?: string; tools: Tool[] };

export function SurfaceTable() {
  const [surface, setSurface] = useState<Surface | null>(null); const [query, setQuery] = useState(""); const [classification, setClassification] = useState("ALL");
  useEffect(() => { void fetch("/data/surface.json").then((response) => response.json()).then((value: Surface) => setSurface(value)); }, []);
  const rows = useMemo(() => surface?.tools.filter((tool) => (classification === "ALL" || tool.classification === classification) && tool.name.toLowerCase().includes(query.toLowerCase())) ?? [], [surface, query, classification]);
  const counts = useMemo(() => ({ READ: surface?.tools.filter((tool) => tool.classification === "READ").length ?? 0, WRITE: surface?.tools.filter((tool) => tool.classification === "WRITE").length ?? 0, UNKNOWN: surface?.tools.filter((tool) => tool.classification === "UNKNOWN").length ?? 0 }), [surface]);
  return <div className="stack">
    <div className="surface-meta"><div><span>Client</span><strong>{surface?.client ?? "Loading"}</strong></div><div><span>Version</span><strong>{surface?.clientVersion ?? "—"}</strong></div><div><span>Observed</span><strong>{surface?.observedAt.slice(0, 10) ?? "—"}</strong></div><div><span>Tools</span><strong>{surface?.toolCount ?? "—"}</strong></div></div>
    <div className="surface-classification-grid">
      <button type="button" onClick={() => setClassification("READ")}><span>READ</span><strong>{counts.READ}</strong><small>May pass the pre-hook unchanged.</small></button>
      <button type="button" onClick={() => setClassification("WRITE")}><span>WRITE</span><strong>{counts.WRITE}</strong><small>Must receive a deterministic ruling.</small></button>
      <button type="button" onClick={() => setClassification("UNKNOWN")}><span>UNKNOWN</span><strong>{counts.UNKNOWN}</strong><small>Withheld until manually classified.</small></button>
    </div>
    <div className="surface-safety-note"><span>FAIL-CLOSED SURFACE POLICY</span><p>An operation absent from the pinned observation, or mutation-shaped but not manually audited, is not promoted to READ. It is withheld and recorded as drift.</p></div>
    <div className="surface-controls"><input aria-label="Search tools" placeholder="Search observed tools" value={query} onChange={(event) => setQuery(event.target.value)} /><select aria-label="Filter classification" value={classification} onChange={(event) => setClassification(event.target.value)}><option>ALL</option><option>READ</option><option>WRITE</option><option>UNKNOWN</option></select><span>{rows.length} shown</span></div>
    <div className="surface-list">{rows.map((tool) => <details key={tool.name}><summary><code>{tool.name}</code><span className={`status ${tool.classification === "READ" ? "valid" : tool.classification === "WRITE" ? "broken" : "attention"}`}>{tool.classification}</span><span>{tool.method}</span></summary><div className="surface-detail"><p>{tool.reasoning}</p><dl><dt>Observed at</dt><dd>{tool.observedAt}</dd><dt>Client version</dt><dd>{tool.clientVersion}</dd><dt>Input shape</dt><dd><pre>{JSON.stringify(tool.observedInputShape, null, 2)}</pre></dd><dt>Response shape</dt><dd><pre>{JSON.stringify(tool.observedResponseShape, null, 2)}</pre></dd></dl></div></details>)}</div>
  </div>;
}
