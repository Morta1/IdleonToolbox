import websiteData from '@website-data';

/**
 * The game ships unused slots inside its data arrays — `Some_Prayer_Name0` with maxLevel 999,
 * `FILLERZZZ_ACH`, `Filler_bc_I_messed_up`. They are not content and must never render.
 *
 * Anchored at the start deliberately: `petGenes` contains a real entry called `Refiller`, which a
 * trailing `filler$` pattern would wrongly discard.
 */
const PLACEHOLDER = /^(filler|some[_ ])/i;

const nameOf = (entry: any): string | undefined => {
  if (typeof entry === 'string') return entry;
  if (!entry || typeof entry !== 'object') return undefined;
  // `starName` covers the starSigns catalog, whose entries have no name/displayName/rawName field
  // of their own (e.g. website-data.json's "Fillerz48"/"Fillerz59" placeholder star signs).
  return entry.name ?? entry.displayName ?? entry.rawName ?? entry.starName;
};

export const isPlaceholder = (entry: any): boolean => {
  const name = nameOf(entry);
  return typeof name === 'string' && PLACEHOLDER.test(name);
};

export interface CatalogEntry<T> {
  entry: T;
  index: number;
}

/**
 * Live catalog entries paired with their ORIGINAL index.
 *
 * The index matters: saves address these arrays positionally, so filtering before mapping would
 * shift every entry after a placeholder hole and silently mis-assign user data. Placeholders are
 * interspersed, not just trailing — `achievements` has 152 of them with only 35 at the tail.
 */
export const liveEntries = <T>(catalog: T[] | undefined | null): CatalogEntry<T>[] =>
  (catalog ?? [])
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => !isPlaceholder(entry));

export const liveCount = (catalog: unknown[] | undefined | null): number =>
  liveEntries(catalog as any[]).length;

/** Convenience for parsers that only need the catalog by its website-data key. */
export const liveCatalog = <T = any>(key: keyof typeof websiteData): CatalogEntry<T>[] =>
  liveEntries((websiteData as any)[key]);
