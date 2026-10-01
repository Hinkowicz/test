const UNITS = { s: 1, m: 60, h: 3600, d: 86400, w: 604800 };

/** Parses "30m", "2h", "1d12h" into milliseconds. Returns null if invalid. */
export function parseDuration(input) {
  const str = String(input).trim().toLowerCase();
  if (!/^(\d+[smhdw])+$/.test(str)) return null;
  let seconds = 0;
  for (const [, n, unit] of str.matchAll(/(\d+)([smhdw])/g)) {
    seconds += Number(n) * UNITS[unit];
  }
  return seconds > 0 ? seconds * 1000 : null;
}

/** Picks up to `count` unique random entries (Fisher-Yates, does not mutate input). */
export function pickWinners(entries, count, rng = Math.random) {
  const pool = [...entries];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.max(0, count));
}

export function isHttpUrl(value) {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}
