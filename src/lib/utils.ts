import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Placeholder for a figure the platform has not measured.
 *
 * Several backend fields are deliberately nullable: a contract that has judged nothing has no pass
 * rate, and a version nobody has run the suite against has no scorecard. Rendering those as 0 would
 * read as a measurement, which is the opposite of what they mean.
 */
export const NOT_MEASURED = '—';

type Maybe = number | null | undefined;

export function formatLatency(ms: Maybe): string {
  if (ms == null) return NOT_MEASURED;
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }
  return `${ms}ms`;
}

export function formatCost(usd: Maybe): string {
  return usd == null ? NOT_MEASURED : `$${usd.toFixed(4)}`;
}

export function formatPercent(val: Maybe): string {
  return val == null ? NOT_MEASURED : `${val.toFixed(1)}%`;
}

/** A count that is absent rather than zero — no baseline to compare against, for instance. */
export function formatCount(value: Maybe): string {
  return value == null ? NOT_MEASURED : `${value}`;
}

/**
 * Turns an enum constant into something a person reads.
 *
 * The backend's vocabulary is SCREAMING_SNAKE because that is what an enum is, and the API returns
 * it verbatim. Rendering it verbatim is a different decision: `INDEPENDENT_CORROBORATION` on a card
 * reads as a variable name that leaked, not as a thing the product knows about.
 *
 * Acronyms the platform actually uses stay uppercase — "SSO", "API", "p95" are not improved by
 * being title-cased.
 */
const KEEP_UPPERCASE = new Set(['API', 'RAG', 'SSO', 'SQL', 'CEL', 'DAG', 'ID', 'URL']);

export function humanize(token: string | null | undefined): string {
  if (!token) return '';
  return token
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word, index) => {
      const upper = word.toUpperCase();
      if (KEEP_UPPERCASE.has(upper)) return upper;
      const lower = word.toLowerCase();
      return index === 0 ? lower.charAt(0).toUpperCase() + lower.slice(1) : lower;
    })
    .join(' ');
}

/** A list of enum constants as prose: "source grounding, structured records and policy constraints". */
export function humanizeList(tokens: readonly string[] | null | undefined): string {
  const parts = (tokens ?? []).map((t) => humanize(t).toLowerCase()).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

/**
 * Shortens an opaque identifier for display.
 *
 * A full trace id is sixteen hex characters, which is the right length for a key and the wrong
 * length for a label — it dominates any row it sits in and carries no meaning to a reader. The
 * prefix is enough to tell two traces apart on screen; the full value stays available in a title
 * attribute for anyone who needs to copy it.
 */
export function shortId(id: string | null | undefined, keep = 4): string {
  if (!id) return '';
  const [prefix, ...rest] = id.split('_');
  const body = rest.join('_');
  if (!body) return id.length > keep + 4 ? `${id.slice(0, keep + 4)}…` : id;
  return `${prefix}_${body.slice(0, keep)}`;
}
