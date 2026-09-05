"use client";

import { useEffect, useRef, useState } from "react";
import { verifyReceiptText, type Verification } from "../lib/verify";

export function Verifier() {
  const [result, setResult] = useState<Verification | null>(null); const [name, setName] = useState<string>(""); const [busy, setBusy] = useState(false); const input = useRef<HTMLInputElement>(null);
  async function inspect(text: string, filename: string) { setBusy(true); setName(filename); setResult(await verifyReceiptText(text)); setBusy(false); }
  async function file(file: File | undefined) { if (file) await inspect(await file.text(), file.name); }
  async function example() { const response = await fetch("/data/receipts.jsonl"); await inspect(await response.text(), "Oathline demo · receipts.jsonl"); }
  useEffect(() => { if (new URLSearchParams(window.location.search).get("demo") === "1") void example(); }, []);
  return <div className="verifier stack">
    <div className="drop-zone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void file(event.dataTransfer.files[0]); }}>
      <input ref={input} hidden type="file" accept=".jsonl,.json,application/json,text/plain" onChange={(event) => void file(event.target.files?.[0])} />
      <span className="panel-label">Local file input</span><h3>Drop receipts.jsonl</h3><p>Your file stays in this browser. The chain walk and SHA-256 checks run client-side.</p>
      <div className="actions"><button className="button primary" onClick={() => input.current?.click()}>Choose receipt chain</button><button className="button" onClick={() => void example()}>Load shipped demo</button></div>
    </div>
    {busy && <div className="verify-result"><span className="status attention">VERIFYING</span></div>}
    {!busy && result && <section className={`verify-result ${result.valid ? "is-valid" : "is-broken"}`} aria-live="polite">
      <p className={`status ${result.valid ? "valid" : "broken"}`}>{result.valid ? "CHAIN VALID" : "CHAIN BROKEN"}</p>
      <h2>{result.valid ? `${result.entries} entries. Every link agrees.` : `First mismatch: sequence ${result.firstBrokenSequence}.`}</h2>
      <p className="verify-file">{name}</p>
      {result.valid ? <div className="verify-counts"><span><strong>{result.mandates}</strong> mandate</span><span><strong>{result.proposals}</strong> proposals</span><span><strong>{result.denied}</strong> withheld</span><span><strong>{result.executed}</strong> executed</span><span><strong>{result.reconciled}</strong> reconciled</span><span><strong>0</strong> broken links</span></div> : <p className="verify-error">{result.error}</p>}
      {result.head && <code className="verify-head">head {result.head}</code>}
    </section>}
  </div>;
}
