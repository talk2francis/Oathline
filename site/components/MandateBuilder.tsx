"use client";

import { useMemo, useState } from "react";

type Signature = { algo: "ed25519"; pubkey: string; sig: string };
type Form = { name: string; expiry: string; timezone: string; products: string[]; symbols: string; sides: string[]; orderTypes: string[]; maxOrder: string; maxDaily: string; maxOrders: string; cooldown: string; drawdown: string; spread: string; freshness: string; hardViolation: "DENY" | "ASK" };

const initial: Form = { name: "tide-bnb-evening", expiry: "", timezone: "UTC", products: ["SPOT"], symbols: "BNBUSDT", sides: ["BUY", "SELL"], orderTypes: ["MARKET", "LIMIT"], maxOrder: "15", maxDaily: "40", maxOrders: "3", cooldown: "300", drawdown: "2", spread: "20", freshness: "30", hardViolation: "DENY" };
const quote = (value: string) => JSON.stringify(value);
const list = (values: string[]) => `[${values.map(quote).join(", ")}]`;
const bytesToBase64 = (data: ArrayBuffer) => { let binary = ""; for (const byte of new Uint8Array(data)) binary += String.fromCharCode(byte); return btoa(binary); };
function canonical(value: unknown): string { if (value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number") return JSON.stringify(value); if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`; if (typeof value === "object") { const record = value as Record<string, unknown>; return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`).join(",")}}`; } throw new Error("unsupported canonical value"); }

function object(form: Form) {
  return { meta: { name: form.name, expires_at: form.expiry ? new Date(form.expiry).toISOString() : "", timezone: form.timezone }, scope: { products: form.products, symbols: form.symbols.split(",").map((value) => value.trim().toUpperCase()).filter(Boolean), sides: form.sides, order_types: form.orderTypes }, budget: { max_order_usdt: form.maxOrder, max_daily_gross_usdt: form.maxDaily, max_position_usdt: null }, rate: { max_orders_per_day: Number(form.maxOrders), cooldown_seconds: Number(form.cooldown) }, risk: { max_session_drawdown_pct: form.drawdown }, market: { max_spread_bps: form.spread }, state: { max_age_seconds: Number(form.freshness) }, escalation: { stale_state: "ASK", unknown_tool: "ASK", hard_violation: form.hardViolation } };
}

function serialize(form: Form, signature: Signature | null): string {
  const body = object(form); const lines = ["[meta]", `name = ${quote(body.meta.name)}`, `expires_at = ${quote(body.meta.expires_at)}`, `timezone = ${quote(body.meta.timezone)}`, "", "[scope]", `products = ${list(body.scope.products)}`, `symbols = ${list(body.scope.symbols)}`, `sides = ${list(body.scope.sides)}`, `order_types = ${list(body.scope.order_types)}`, "", "[budget]", `max_order_usdt = ${quote(body.budget.max_order_usdt)}`, `max_daily_gross_usdt = ${quote(body.budget.max_daily_gross_usdt)}`, "", "[rate]", `max_orders_per_day = ${body.rate.max_orders_per_day}`, `cooldown_seconds = ${body.rate.cooldown_seconds}`, "", "[risk]", `max_session_drawdown_pct = ${quote(body.risk.max_session_drawdown_pct)}`, "", "[market]", `max_spread_bps = ${quote(body.market.max_spread_bps)}`, "", "[state]", `max_age_seconds = ${body.state.max_age_seconds}`, "", "[escalation]", `stale_state = "ASK"`, `unknown_tool = "ASK"`, `hard_violation = ${quote(body.escalation.hard_violation)}`];
  if (signature) lines.push("", "[signature]", `algo = ${quote(signature.algo)}`, `pubkey = ${quote(signature.pubkey)}`, `sig = ${quote(signature.sig)}`); return `${lines.join("\n")}\n`;
}

function Toggle({ label, active, onClick, disabled = false, title }: { label: string; active: boolean; onClick: () => void; disabled?: boolean; title?: string }) { return <button type="button" className={`toggle ${active ? "active" : ""}`} onClick={onClick} disabled={disabled} title={title}>{label}</button>; }

export function MandateBuilder() {
  const [form, setFormState] = useState(initial); const [signature, setSignature] = useState<Signature | null>(null); const [privateKey, setPrivateKey] = useState<string | null>(null); const [error, setError] = useState<string | null>(null); const [signing, setSigning] = useState(false);
  const toml = useMemo(() => serialize(form, signature), [form, signature]);
  function setForm(next: Form) { setFormState(next); setSignature(null); setPrivateKey(null); setError(null); }
  function toggle(field: "products" | "sides" | "orderTypes", value: string) { const values = form[field]; setForm({ ...form, [field]: values.includes(value) ? values.filter((item) => item !== value) : [...values, value] }); }
  async function sign() {
    try {
      setSigning(true); setError(null);
      if (!form.expiry || !Number.isFinite(new Date(form.expiry).getTime())) throw new Error("Choose a valid mandate expiry.");
      if (new Date(form.expiry).getTime() <= Date.now()) throw new Error("Mandate expiry must be in the future.");
      if (form.products.length === 0 || form.sides.length === 0 || form.orderTypes.length === 0) throw new Error("Grant at least one product, side, and order type.");
      if (!form.symbols.trim()) throw new Error("Grant at least one symbol.");
      for (const value of [form.maxOrder, form.maxDaily, form.drawdown, form.spread]) if (!/^\d+(?:\.\d+)?$/.test(value)) throw new Error("Money and risk limits must be non-negative decimal strings.");
      for (const value of [form.maxOrders, form.cooldown, form.freshness]) if (!/^\d+$/.test(value)) throw new Error("Order count, cooldown, and state age must be whole numbers.");
      if (Number(form.maxOrders) < 1 || Number(form.freshness) < 1) throw new Error("Orders per day and state age must be at least 1.");
      const pair = await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]) as CryptoKeyPair;
      const payload = new TextEncoder().encode(canonical(object(form))); const signed = await crypto.subtle.sign("Ed25519", pair.privateKey, payload);
      const publicDer = bytesToBase64(await crypto.subtle.exportKey("spki", pair.publicKey)); const privateDer = bytesToBase64(await crypto.subtle.exportKey("pkcs8", pair.privateKey));
      setSignature({ algo: "ed25519", pubkey: publicDer, sig: bytesToBase64(signed) }); setPrivateKey(JSON.stringify({ publicKey: publicDer, privateKey: privateDer }));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "This browser could not generate an Ed25519 mandate."); } finally { setSigning(false); }
  }
  function download(name: string, content: string) { const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([content], { type: "text/plain" })); link.download = name; link.click(); URL.revokeObjectURL(link.href); }
  const field = (key: keyof Form) => ({ value: String(form[key]), onChange: (event: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: event.target.value }) });
  return <div className="mandate-layout">
    <form className="mandate-form" onSubmit={(event) => { event.preventDefault(); void sign(); }}>
      <div className="mandate-proof-note"><span className="live-dot" /> VERIFIED BUILD SURFACE <strong>SPOT</strong><small>Margin and Futures remain outside this builder until Oathline has first-party enforcement observations for them.</small></div>
      <fieldset><legend>Identity and expiry</legend><label>Name<input {...field("name")} /></label><label>Expiry<input type="datetime-local" {...field("expiry")} required /></label><label>Timezone<input {...field("timezone")} /></label></fieldset>
      <fieldset><legend>Scope</legend><span className="field-label">Products</span><div className="toggle-row"><Toggle label="SPOT" active={form.products.includes("SPOT")} onClick={() => toggle("products", "SPOT")} /><Toggle label="MARGIN" active={false} disabled onClick={() => undefined} title="Not first-party verified in this build" /><Toggle label="FUTURES" active={false} disabled onClick={() => undefined} title="Not first-party verified in this build" /></div><p className="verified-scope-note">The public builder intentionally exposes only the execution path proven in the shipped evidence.</p><label>Symbols, comma separated<input {...field("symbols")} /></label><span className="field-label">Sides</span><div className="toggle-row">{["BUY", "SELL"].map((value) => <Toggle key={value} label={value} active={form.sides.includes(value)} onClick={() => toggle("sides", value)} />)}</div><span className="field-label">Order types</span><div className="toggle-row">{["MARKET", "LIMIT"].map((value) => <Toggle key={value} label={value} active={form.orderTypes.includes(value)} onClick={() => toggle("orderTypes", value)} />)}</div></fieldset>
      <fieldset><legend>Continuing limits</legend><div className="form-grid"><label>Per order, USDT<input inputMode="decimal" {...field("maxOrder")} /></label><label>Daily gross, USDT<input inputMode="decimal" {...field("maxDaily")} /></label><label>Orders per day<input inputMode="numeric" {...field("maxOrders")} /></label><label>Cooldown, seconds<input inputMode="numeric" {...field("cooldown")} /></label><label>Drawdown, %<input inputMode="decimal" {...field("drawdown")} /></label><label>Spread, bps<input inputMode="decimal" {...field("spread")} /></label><label>State age, seconds<input inputMode="numeric" {...field("freshness")} /></label></div></fieldset>
      <fieldset><legend>Escalation</legend><label>Hard violation<select value={form.hardViolation} onChange={(event) => setForm({ ...form, hardViolation: event.target.value as "DENY" | "ASK" })}><option>DENY</option><option>ASK</option></select></label></fieldset>
      <button className="button primary sign-button" type="submit" disabled={signing}>{signing ? "Signing locally…" : "Sign mandate locally"}</button>{error && <p className="form-error">{error}</p>}
      {signature && privateKey && <div className="actions"><button type="button" className="button" onClick={() => download("oathline.toml", toml)}>Download oathline.toml</button><button type="button" className="button" onClick={() => download("ed25519-private.key", privateKey)}>Download local signing key</button></div>}
    </form>
    <div className="mandate-output"><span className="panel-label">Live English translation</span><div className="translation"><p>Permit <strong>{form.products.join(" and ") || "no products"}</strong> for <strong>{form.symbols || "no symbols"}</strong>, on the <strong>{form.sides.join(" / ") || "no"}</strong> side, using <strong>{form.orderTypes.join(" / ") || "no"}</strong> orders.</p><p>At most <strong>{form.maxOrder} USDT per order</strong>, <strong>{form.maxDaily} USDT daily gross</strong>, and <strong>{form.maxOrders} orders per day</strong>, with a <strong>{form.cooldown}s cooldown</strong>.</p><p>Require state no older than <strong>{form.freshness} seconds</strong>, spread within <strong>{form.spread} bps</strong>, and session drawdown within <strong>{form.drawdown}%</strong>.</p><p>Authority expires <strong>{form.expiry ? new Date(form.expiry).toISOString() : "when you choose a required expiry"}</strong>.</p></div><span className="panel-label">Live TOML · {signature ? "SIGNED" : "UNSIGNED PREVIEW"}</span><pre className="toml-output">{toml}</pre><p className="privacy-line">Nothing is sent anywhere. Signing uses this browser&apos;s Web Crypto implementation.</p></div>
  </div>;
}
