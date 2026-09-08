export type Cue = {start: number; end: number; text: string};

export const cues: Cue[] = [
  {start: 0, end: 5, text: 'An agent can hold permission to trade. That does not mean every trade should pass.'},
  {start: 5, end: 13, text: 'Binance Agent OS keeps authentication in its official OAuth connection. Oathline adds a separate, expiring boundary on how that authority may be used.'},
  {start: 13, end: 22, text: 'This signed mandate permits BNBUSDT Spot, with fifteen dollars per order, forty dollars per day, and state no older than thirty seconds.'},
  {start: 22, end: 31, text: 'Now untrusted context pushes the agent toward an eighty-three-dollar market order. Oathline does not guess why the reasoning failed. It evaluates the action.'},
  {start: 31, end: 42, text: 'Eighty-three forty exceeds fifteen per order—and eighty-three forty exceeds the entire daily limit. Outside mandate. Binance submission: not called.'},
  {start: 42, end: 50, text: 'In this observed Codex 0.153.3 run, the host honored that denial before spot dot new order was submitted.'},
  {start: 50, end: 64, text: 'A valid seven-dollar order takes the other path—but only with current evidence. Oathline first withholds it on stale state. A fresh Binance read arrives. The same action now passes, and Binance fills it.'},
  {start: 64, end: 73, text: 'Order 12534006821: real BNBUSDT, matched back to the authorization that preceded it.'},
  {start: 73, end: 83, text: 'The full chain verifies locally: thirty-six entries, zero broken links. Reconciliation reports one matched execution, zero orphans, zero divergences.'},
  {start: 83, end: 90, text: 'Policy before execution. Evidence after. Oathline gives software a boundary.'},
];

export const scene = {
  identity: [0, 5], boundary: [5, 13], mandate: [13, 22], context: [22, 31],
  denial: [31, 42], terminal: [42, 50], state: [50, 64], execution: [64, 73],
  proof: [73, 83], outro: [83, 90],
} as const;
