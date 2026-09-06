const OMIT_KEYS = /^(session_?id|turn_?id|transcript_?path|cwd|model|permission_?mode)$/i;
const SENSITIVE_KEYS = /(authorization|access.?token|refresh.?token|api.?key|client.?secret|secret|cookie|password|email|phone|user.?id|uid|account.?id|balance|equity)/i;
const INLINE_PATTERNS = [
  [/\bBearer\s+[^\s"']+/gi, "Bearer [REDACTED]"],
  [/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[REDACTED_EMAIL]"],
  [/(Authorization\s*[:=]\s*)[^\s,;"']+/gi, "$1[REDACTED]"],
  [/((?:access|refresh)[_-]?token\s*[:=]\s*)[^\s,;"']+/gi, "$1[REDACTED]"],
  [/(api[_-]?key\s*[:=]\s*)[^\s,;"']+/gi, "$1[REDACTED]"],
];

function redactedScalar(value) {
  if (value === null) return null;
  if (typeof value === "number") return 0;
  if (typeof value === "boolean") return false;
  return "[REDACTED]";
}

function sanitizeString(value, key, inheritedSensitive) {
  if (inheritedSensitive || SENSITIVE_KEYS.test(key)) return redactedScalar(value);
  const trimmed = value.trim();
  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
    try { return JSON.stringify(sanitizeObservation(JSON.parse(value))); } catch { /* retain non-JSON text after inline redaction */ }
  }
  return INLINE_PATTERNS.reduce((safe, [pattern, replacement]) => safe.replace(pattern, replacement), value);
}

function looksLikeSchema(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if ("properties" in value || "items" in value || "$ref" in value) return true;
  return typeof value.type === "string" && ["array", "boolean", "integer", "null", "number", "object", "string"].includes(value.type);
}

// A catalog schema describes private-shaped fields; it is not itself private
// account data. Preserve field names and types so sanitation cannot corrupt the
// observed contract, while omitting examples attached to sensitive-shaped fields.
function sanitizeSchema(value, sensitiveField = false) {
  if (Array.isArray(value)) return value.map((item) => sanitizeSchema(item, sensitiveField));
  if (value === null || typeof value !== "object") {
    return typeof value === "string" ? sanitizeString(value, "", false) : value;
  }
  return Object.fromEntries(Object.entries(value).flatMap(([childKey, child]) => {
    if (childKey === "properties" && child && typeof child === "object" && !Array.isArray(child)) {
      return [[childKey, Object.fromEntries(Object.entries(child).map(([propertyName, definition]) => [
        propertyName,
        sanitizeSchema(definition, SENSITIVE_KEYS.test(propertyName)),
      ]))]];
    }
    if (sensitiveField && ["example", "examples", "default", "const"].includes(childKey)) {
      return [];
    }
    return [[childKey, sanitizeSchema(child, sensitiveField)]];
  }));
}

function sanitize(value, key, inheritedSensitive) {
  const sensitive = inheritedSensitive || SENSITIVE_KEYS.test(key);
  if (typeof value === "string") return sanitizeString(value, key, inheritedSensitive);
  if (value === null || typeof value !== "object") return sensitive ? redactedScalar(value) : value;
  if (looksLikeSchema(value)) return sanitizeSchema(value, sensitive);
  const redactChildren = sensitive && !looksLikeSchema(value);
  if (Array.isArray(value)) return value.map((item) => sanitize(item, key, redactChildren));
  return Object.fromEntries(Object.entries(value).flatMap(([childKey, child]) => OMIT_KEYS.test(childKey) ? [] : [[childKey, sanitize(child, childKey, redactChildren)]]));
}

export function sanitizeObservation(value, key = "") {
  return sanitize(value, key, false);
}
