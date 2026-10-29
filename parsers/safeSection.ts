// While parseData runs, the names of sections that threw, so a page can say its data failed to read
// instead of rendering the fallback as if the save were empty.
let failedSections: Set<string> | null = null;

export const trackSectionFailures = (into: Set<string> | null) => {
  failedSections = into;
};

export const safeSection = <T>(name: string, fallback: T, fn: () => T): T => {
  try {
    const result = fn();
    return result === undefined || result === null ? fallback : result;
  } catch (err) {
    console.error(`[parsers] section "${name}" failed, using fallback:`, err);
    failedSections?.add(name);
    return fallback;
  }
};
