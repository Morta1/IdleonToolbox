// While parseData runs, the names of sections that threw, so a page can say its data failed to read
// instead of rendering the fallback as if the save were empty.
let failedSections: Set<string> | null = null;

export const trackSectionFailures = (into: Set<string> | null) => {
  failedSections = into;
};

// Tests and the kit only (parse option failSections): these sections throw for real, so what reads them downstream shows too.
let forced: Set<string> | null = null;

export const forceSectionFailures = (names?: string[]) => {
  forced = names?.length ? new Set(names) : null;
};

export const safeSection = <T>(name: string, fallback: T, fn: () => T): T => {
  try {
    if (forced?.has(name)) throw new Error(`forced: ${name}`);
    const result = fn();
    return result === undefined || result === null ? fallback : result;
  } catch (err) {
    console.error(`[parsers] section "${name}" failed, using fallback:`, err);
    failedSections?.add(name);
    return fallback;
  }
};
