import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { bundles as bundlesData } from '@website-data';
import { getBundles, isBundlePurchased } from '@parsers/misc';

describe('getBundles', () => {
  // bon_w/x/y have no GemPopupBundleMessages row, so they are absent from the catalog, but each
  // adds +1000 base carry cap in game. Ownership must come from the save, not the catalog.
  it.each(['bon_w', 'bon_x', 'bon_y'])('keeps owned %s that the catalog lacks', (name) => {
    expect(name in bundlesData).toBe(false);
    const bundles = getBundles({ BundlesReceived: JSON.stringify({ [name]: 1 }) });
    expect(isBundlePurchased(bundles, name)).toBeTruthy();
    expect(bundles.filter((b) => b.uncatalogued)).toEqual([{ name, owned: true, price: undefined, uncatalogued: true }]);
  });

  it('lists only catalog entries when nothing uncatalogued is owned', () => {
    const bundles = getBundles({ BundlesReceived: JSON.stringify({ bun_i: 1 }) });
    expect(bundles.map((b) => b.name).sort()).toEqual(Object.keys(bundlesData).sort());
  });
});
