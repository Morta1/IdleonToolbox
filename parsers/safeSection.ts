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

// The last pass's readers meet a section that kept failing as its catalog at zero, not {}: parseData fills this before that pass.
let catalogs: Record<string, any> | null = null;

export const setSectionCatalogs = (sections: Record<string, any> | null) => {
  catalogs = sections;
};

export const safeSection = <T>(name: string, fallback: T, fn: () => T): T => {
  try {
    if (forced?.has(name)) throw new Error(`forced: ${name}`);
    const result = fn();
    return result === undefined || result === null ? fallback : result;
  } catch (err) {
    console.error(`[parsers] section "${name}" failed, using fallback:`, err);
    failedSections?.add(name);
    return catalogs && name in catalogs ? catalogs[name] : fallback;
  }
};
