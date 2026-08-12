const PLACEHOLDER = /^(filler|some[_ ])/i;

const nameOf = (entry: any): string | undefined => {
  if (typeof entry === 'string') return entry;
  if (!entry || typeof entry !== 'object') return undefined;
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

export const liveEntries = <T>(catalog: T[] | undefined | null): CatalogEntry<T>[] =>
  (catalog ?? [])
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => !isPlaceholder(entry));

export const liveCount = (catalog: unknown[] | undefined | null): number =>
  liveEntries(catalog as any[]).length;
