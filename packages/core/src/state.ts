import { sha256 } from "./canonical.js";
import type { LedgerState, Snapshot } from "./types.js";
export const snapshotHash = (snapshot: Omit<Snapshot, "hash">): string => sha256(snapshot);
export function emptyLedger(evaluatedAt: string, client = "Codex"): LedgerState {
  return { ordersToday: 0, grossToday: "0", lastOrderAt: null, sessionOpenEquityUsdt: null, evaluatedAt, mode: "ADVISORY", client };
}
