/**
 * Lightweight typo-tolerant search scoring — no dependencies, runs instantly on
 * every keystroke for a few hundred items. Used by the Home search box to rank
 * exercises / circuits / video clips and to power "Did you mean…" suggestions.
 *
 * Scoring bands (higher = better; 0 = no match):
 *   ~100         exact (whole string equals the query)
 *   ~60–80       query appears as a substring (word-boundary hits rank higher)
 *   ~18–40       fuzzy: every query word matches some target word, typos allowed
 *   0            below threshold / a query word matched nothing
 */

/** Lowercase, strip accents, collapse whitespace. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Damerau-Levenshtein (optimal string alignment) edit distance. Like classic
 * Levenshtein but counts a swap of two adjacent characters ("sqaut"↔"squat") as
 * a single edit — by far the most common real-world typo. Words are short, so
 * the full O(m·n) matrix is fine.
 */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const d: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1); // adjacent transposition
      }
    }
  }
  return d[m][n];
}

/** How many typos to forgive in a word of the given length. */
function tolerance(len: number): number {
  if (len <= 3) return 0; // short words: exact-ish only (avoid false hits)
  if (len <= 5) return 1;
  if (len <= 8) return 2;
  return 3;
}

/** Score a single query token against a single target word → 0..1. */
function wordScore(q: string, w: string): number {
  if (q === w) return 1;
  if (w.startsWith(q)) return 0.92; // "squ" → "squat"
  if (w.includes(q)) return 0.8;
  // whole-word typo (e.g. "squt" ↔ "squat")
  const d = levenshtein(q, w);
  const t = tolerance(Math.max(q.length, w.length));
  if (d <= t) return Math.max(0.55, 0.75 - d * 0.1);
  // typo in a prefix (e.g. "lungs" ↔ "lunges" while still typing)
  if (w.length > q.length) {
    const dp = levenshtein(q, w.slice(0, q.length));
    if (dp <= tolerance(q.length)) return Math.max(0.5, 0.65 - dp * 0.1);
  }
  return 0;
}

/**
 * Overall relevance of `text` for `query`. Every word in the query must find a
 * home in the text (AND semantics) or the score is 0.
 */
export function fuzzyScore(query: string, text: string): number {
  const q = normalize(query);
  const t = normalize(text);
  if (!q || !t) return 0;
  if (t === q) return 100;

  if (t.includes(q)) {
    const idx = t.indexOf(q);
    const atBoundary = idx === 0 || t[idx - 1] === " ";
    return 60 + (atBoundary ? 12 : 0) - Math.min(idx, 20) * 0.2 + q.length * 0.1;
  }

  const qWords = q.split(" ").filter(Boolean);
  const tWords = t.split(" ").filter(Boolean);
  if (qWords.length === 0 || tWords.length === 0) return 0;

  let sum = 0;
  for (const qw of qWords) {
    let best = 0;
    for (const tw of tWords) {
      const s = wordScore(qw, tw);
      if (s > best) best = s;
      if (best === 1) break;
    }
    if (best === 0) return 0; // an unmatched query word disqualifies the item
    sum += best;
  }
  return (sum / qWords.length) * 40; // fuzzy band tops out just under substrings
}

/** Minimum score to show an item as a real result (keeps confident typo hits). */
export const FUZZY_MIN = 18;
/** Lower floor used only for "Did you mean…" fallback suggestions. */
export const SUGGEST_MIN = 9;
