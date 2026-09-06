# Codex PostToolUse payload observations

Observed with Codex CLI 0.153.3 against `https://agent.binance.com/mcp/agentic` on 5 September 2026. No write operation was called.

## Routing shape

The MCP exposes two dispatcher tools to Codex: `mcp__binance_agentic__tool_search` and `mcp__binance_agentic__tool_execute`. The actual Binance operation is not the outer hook tool name. For an execution it is carried in `tool_input.toolName`, with its parameters in `tool_input.arguments`. Any later observer or guard must inspect that inner name.

Every observed `PostToolUse` payload included `tool_use_id`. `tool_response` was present as an object with `content` and `isError`. `structuredContent` was present for the market-data reads and absent (rather than populated) for the account/order-history reads.

## Read results

| Inner tool | `structuredContent` | `content[0].text` | Parseability |
| --- | --- | --- | --- |
| `spot.ticker24hr` | Object | JSON text duplicate | Prices and 24-hour change are decimal strings and directly parseable. |
| `spot.depth` | Object | JSON text duplicate | Bid/ask levels are arrays of decimal-string price and quantity pairs. |
| `wallet.queryUserWalletBalance` | Absent | JSON array text | Wallet names, activation flags, and balances are parseable after JSON-decoding the text. The observed account was empty. |
| `spot.allOrders` | Absent | JSON array text | Parseable; the observed response was an empty array. |
| `spot.myTrades` | Absent | JSON array text | Parseable; the observed response was an empty array. |

## P3 consequence

State observation is viable without guessing response shapes. Use a dual decoder: prefer non-null `tool_response.structuredContent`, otherwise JSON-decode the text content. Preserve the raw payload and fail closed if neither path yields the expected shape. Empty arrays prove a successful empty read, not an unavailable field.
