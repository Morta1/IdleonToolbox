/**
 * Per-section error boundary.
 *
 * `parseData` used to wrap all three serialization passes in one try/catch, so a single throwing
 * parser returned `undefined` for the entire account and blanked every page. One bad section should
 * cost one page, not the site.
 *
 * `undefined`/`null` are treated as failures too: a section that returns nothing is exactly the
 * shape that crashes a page component downstream.
 */
export const safeSection = <T>(name: string, fallback: T, fn: () => T): T => {
  try {
    const result = fn();
    return result === undefined || result === null ? fallback : result;
  } catch (err) {
    console.error(`[parsers] section "${name}" failed, using fallback:`, err);
    return fallback;
  }
};
