export type DecimalString = string;

interface Parts { coefficient: bigint; scale: number }
const DECIMAL = /^([+-]?)(\d+)(?:\.(\d+))?$/;
const pow10 = (exponent: number): bigint => 10n ** BigInt(exponent);

function normalize(parts: Parts): Parts {
  let { coefficient, scale } = parts;
  while (scale > 0 && coefficient % 10n === 0n) { coefficient /= 10n; scale -= 1; }
  return { coefficient, scale };
}

function parse(value: string): Parts {
  const match = DECIMAL.exec(value.trim());
  if (!match) throw new Error(`Invalid decimal string: ${value}`);
  const fraction = match[3] ?? "";
  return normalize({ coefficient: (match[1] === "-" ? -1n : 1n) * BigInt(`${match[2] ?? "0"}${fraction}`), scale: fraction.length });
}

function format(parts: Parts, fixedScale?: number): DecimalString {
  const targetScale = fixedScale ?? parts.scale;
  let coefficient = parts.coefficient;
  let scale = parts.scale;
  if (targetScale > scale) { coefficient *= pow10(targetScale - scale); scale = targetScale; }
  const negative = coefficient < 0n;
  const digits = (negative ? -coefficient : coefficient).toString().padStart(scale + 1, "0");
  const whole = scale === 0 ? digits : digits.slice(0, -scale);
  const fraction = scale === 0 ? "" : `.${digits.slice(-scale)}`;
  return `${negative && coefficient !== 0n ? "-" : ""}${whole}${fraction}`;
}

function align(left: Parts, right: Parts): [bigint, bigint, number] {
  const scale = Math.max(left.scale, right.scale);
  return [left.coefficient * pow10(scale - left.scale), right.coefficient * pow10(scale - right.scale), scale];
}

export const fromString = (value: string): DecimalString => format(parse(value));
export function add(left: DecimalString, right: DecimalString): DecimalString {
  const [a, b, scale] = align(parse(left), parse(right)); return format(normalize({ coefficient: a + b, scale }));
}
export function sub(left: DecimalString, right: DecimalString): DecimalString {
  const [a, b, scale] = align(parse(left), parse(right)); return format(normalize({ coefficient: a - b, scale }));
}
export function mul(left: DecimalString, right: DecimalString): DecimalString {
  const a = parse(left); const b = parse(right);
  return format(normalize({ coefficient: a.coefficient * b.coefficient, scale: a.scale + b.scale }));
}
export function div(left: DecimalString, right: DecimalString, precision = 18): DecimalString {
  const a = parse(left); const b = parse(right);
  if (b.coefficient === 0n) throw new Error("Division by zero");
  return format(normalize({ coefficient: (a.coefficient * pow10(precision + b.scale)) / (b.coefficient * pow10(a.scale)), scale: precision }));
}
export function cmp(left: DecimalString, right: DecimalString): -1 | 0 | 1 {
  const [a, b] = align(parse(left), parse(right)); return a < b ? -1 : a > b ? 1 : 0;
}
export function toFixed(value: DecimalString, places: number): DecimalString {
  if (!Number.isInteger(places) || places < 0) throw new Error("Decimal places must be a non-negative integer");
  const parts = parse(value);
  if (parts.scale <= places) return format(parts, places);
  const divisor = pow10(parts.scale - places);
  let quotient = parts.coefficient / divisor;
  const remainder = parts.coefficient % divisor;
  const magnitude = remainder < 0n ? -remainder : remainder;
  if (magnitude * 2n >= divisor) quotient += parts.coefficient < 0n ? -1n : 1n;
  return format({ coefficient: quotient, scale: places }, places);
}
