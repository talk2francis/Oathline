import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export type Classification = "READ" | "WRITE" | "UNKNOWN";
type JsonObject = Record<string, unknown>;

interface CatalogTool {
  name: string;
  description?: string;
  inputSchema?: unknown;
}
interface SurfaceTool {
  name: string;
  classification: Classification;
  reasoning: string;
  observedInputShape: unknown;
  observedResponseShape: unknown;
  observedAt: string;
  clientVersion: string;
  method: "observed" | "observed-manually";
}

const CLIENT = "Codex CLI";
const CLIENT_VERSION = "0.153.3";
const ENDPOINT = "https://agent.binance.com/mcp/agentic";

// Surface classification only, following P1's narrow definition. This is not
// policy enforcement: no operation in this set was called during observation.
const WRITE_TOOLS = new Set([
  "convert.acceptQuote", "convert.cancelLimitOrder", "convert.placeLimitOrder",
  "futures_coin.autoCancelAllOpenOrders", "futures_coin.cancelAllOpenOrders",
  "futures_coin.cancelMultipleOrders", "futures_coin.cancelOrder",
  "futures_coin.modifyIsolatedPositionMargin", "futures_coin.modifyMultipleOrders",
  "futures_coin.modifyOrder", "futures_coin.newOrder", "futures_coin.placeMultipleOrders",
  "futures_usds.acceptTheOfferedQuote", "futures_usds.autoCancelAllOpenOrders",
  "futures_usds.cancelAlgoOrder", "futures_usds.cancelAllAlgoOpenOrders",
  "futures_usds.cancelAllOpenOrders", "futures_usds.cancelMultipleOrders",
  "futures_usds.cancelOrder", "futures_usds.modifyIsolatedPositionMargin",
  "futures_usds.modifyMultipleOrders", "futures_usds.modifyOrder",
  "futures_usds.newAlgoOrder", "futures_usds.newOrder", "futures_usds.placeMultipleOrders",
  "margin.liquidationLoanRepay", "margin.marginAccountBorrowRepay",
  "margin.marginAccountCancelAllOpenOrdersOnASymbol", "margin.marginAccountCancelOco",
  "margin.marginAccountCancelOrder", "margin.marginAccountNewOco",
  "margin.marginAccountNewOrder", "margin.marginAccountNewOto",
  "margin.marginAccountNewOtoco", "margin.marginManualLiquidation",
  "margin.smallLiabilityExchange", "spot.deleteOpenOrders", "spot.deleteOrder",
  "spot.deleteOrderList", "spot.newOrder", "spot.orderAmendKeepPriority",
  "spot.orderCancelReplace", "spot.orderListOco", "spot.orderListOpo",
  "spot.orderListOpoco", "spot.orderListOto", "spot.orderListOtoco",
  "spot.orderOco", "spot.sorOrder", "wallet.userUniversalTransfer",
]);

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function shapeOf(value: unknown): unknown {
  if (value === null) return { type: "null" };
  if (Array.isArray(value)) {
    return { type: "array", items: value.length === 0 ? { type: "unknown (empty observation)" } : shapeOf(value[0]) };
  }
  if (isObject(value)) {
    return {
      type: "object",
      properties: Object.fromEntries(Object.entries(value).map(([key, child]) => [key, shapeOf(child)])),
    };
  }
  return { type: typeof value };
}

function decodedToolResponse(response: JsonObject): unknown {
  if (response.structuredContent !== null && response.structuredContent !== undefined) {
    return response.structuredContent;
  }
  if (!Array.isArray(response.content)) return response;
  const textPart = response.content.find(
    (part): part is JsonObject => isObject(part) && part.type === "text" && typeof part.text === "string",
  );
  if (typeof textPart?.text !== "string") return response;
  try {
    return JSON.parse(textPart.text) as unknown;
  } catch {
    return textPart.text;
  }
}

function classification(name: string): Classification {
  return WRITE_TOOLS.has(name) ? "WRITE" : "READ";
}

function firstLine(value: string | undefined): string {
  return value?.split("\n", 1)[0]?.trim() || "Observed in the Binance MCP catalog.";
}

export async function generateSurface(repoRoot: string): Promise<string> {
  const rawDir = path.join(repoRoot, "observations", "codex", "raw");
  const outputPath = path.join(repoRoot, "observations", "codex", "surface.json");
  const files = (await readdir(rawDir)).filter((name) => name.endsWith("-post-tool-use.json")).sort();
  const catalog = new Map<string, SurfaceTool>();
  const executions = new Map<string, SurfaceTool>();
  let newestObservation = "";

  for (const file of files) {
    const filePath = path.join(rawDir, file);
    const observedAt = (await stat(filePath)).mtime.toISOString();
    if (observedAt > newestObservation) newestObservation = observedAt;
    let payload: unknown;
    try {
      payload = JSON.parse(await readFile(filePath, "utf8")) as unknown;
    } catch {
      continue;
    }
    if (!isObject(payload) || !isObject(payload.tool_input) || !isObject(payload.tool_response)) continue;
    const canonicalName = typeof payload.tool_name === "string" ? payload.tool_name : "";

    if (canonicalName.endsWith("__tool_search")) {
      const structured = payload.tool_response.structuredContent;
      if (!isObject(structured) || !Array.isArray(structured.tools)) continue;
      for (const candidate of structured.tools) {
        if (!isObject(candidate) || typeof candidate.name !== "string") continue;
        const tool = candidate as unknown as CatalogTool;
        const kind = classification(tool.name);
        catalog.set(tool.name, {
          name: tool.name,
          classification: kind,
          reasoning: kind === "WRITE"
            ? `${firstLine(tool.description)} Catalog-only observation; the operation was not invoked.`
            : `${firstLine(tool.description)} It does not place/cancel an order or move funds.`,
          observedInputShape: tool.inputSchema ?? null,
          observedResponseShape: null,
          observedAt,
          clientVersion: CLIENT_VERSION,
          method: "observed-manually",
        });
      }
    }

    if (canonicalName.endsWith("__tool_execute")) {
      const operation = payload.tool_input.toolName;
      if (typeof operation !== "string") continue;
      executions.set(operation, {
        name: operation,
        classification: classification(operation),
        reasoning: "Called through the Binance MCP dispatcher on the read-only P1 exercise path.",
        observedInputShape: shapeOf(payload.tool_input.arguments),
        observedResponseShape: shapeOf(decodedToolResponse(payload.tool_response)),
        observedAt,
        clientVersion: CLIENT_VERSION,
        method: "observed",
      });
    }
  }

  for (const [name, tool] of executions) catalog.set(name, tool);
  const metaTools: SurfaceTool[] = [
    {
      name: "mcp__binance_agentic__tool_search",
      classification: "READ",
      reasoning: "Observed catalog dispatcher; it returns schemas and does not execute an operation.",
      observedInputShape: { type: "object", properties: { query: { type: "string" }, category: { type: "string" }, limit: { type: "number" }, cursor: { type: "string" } } },
      observedResponseShape: { type: "object", properties: { tools: { type: "array" }, nextCursor: {}, nextStep: {} } },
      observedAt: newestObservation,
      clientVersion: CLIENT_VERSION,
      method: "observed",
    },
    {
      name: "mcp__binance_agentic__tool_execute",
      classification: "UNKNOWN",
      reasoning: "Observed dynamic dispatcher. Classification depends on the inner tool_input.toolName operation.",
      observedInputShape: { type: "object", properties: { toolName: { type: "string" }, arguments: { type: "object" } } },
      observedResponseShape: { type: "object", properties: { content: { type: "array" }, isError: { type: "boolean" }, structuredContent: {} } },
      observedAt: newestObservation,
      clientVersion: CLIENT_VERSION,
      method: "observed",
    },
  ];
  const tools = [...metaTools, ...catalog.values()].sort((a, b) => a.name.localeCompare(b.name));
  await writeFile(outputPath, `${JSON.stringify({
    client: CLIENT,
    clientVersion: CLIENT_VERSION,
    endpoint: ENDPOINT,
    observedAt: newestObservation,
    toolCount: tools.length,
    tools,
  }, null, 2)}\n`, "utf8");
  return outputPath;
}
