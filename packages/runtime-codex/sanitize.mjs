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
  void value;
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
  return value && typeof value === "object" && !Array.isArray(value) && ("type" in value || "properties" in value || "items" in value || "$ref" in value);
}

function sanitize(value, key, inheritedSensitive) {
  const sensitive = inheritedSensitive || SENSITIVE_KEYS.test(key);
  if (typeof value === "string") return sanitizeString(value, key, inheritedSensitive);
  if (value === null || typeof value !== "object") return sensitive ? redactedScalar(value) : value;
  const redactChildren = sensitive && !looksLikeSchema(value);
  if (Array.isArray(value)) return value.map((item) => sanitize(item, key, redactChildren));
  return Object.fromEntries(Object.entries(value).flatMap(([childKey, child]) => OMIT_KEYS.test(childKey) ? [] : [[childKey, sanitize(child, childKey, redactChildren)]]));
}

export function sanitizeObservation(value, key = "") {
  return sanitize(value, key, false);
}
