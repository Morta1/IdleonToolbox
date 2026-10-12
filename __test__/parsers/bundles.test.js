import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { bundles as bundlesData } from '@website-data';
import { getBundles, getOwnedBundles, isBundlePurchased } from '@parsers/misc';

describe('bundle ownership', () => {
  // Ownership comes from the save, never from the display catalog: bon_w/x/y once had no catalog
  // row, and each adds +1000 base carry capacity in game.
  it('reads a bundle the catalog lacks as purchased', () => {
    const name = 'bon_zz';
    expect(name in bundlesData).toBe(false);
    const account = { bundlesOwned: getOwnedBundles({ BundlesReceived: JSON.stringify({ [name]: 1, bun_a: 0 }) }) };
    expect([isBundlePurchased(account, name), isBundlePurchased(account, 'bun_a'), isBundlePurchased(account, 'bun_b')])
      .toEqual([true, false, false]);
  });

  it('lists exactly the catalog, whatever the save owns', () => {
    const bundles = getBundles({ BundlesReceived: JSON.stringify({ bon_zz: 1, bun_i: 1 }) });
    expect(bundles.map((b) => b.name).sort()).toEqual(Object.keys(bundlesData).sort());
  });

  it('draws the Starter Pack offer from its OffersBG cards', () => {
    const bundles = getBundles({ BundlesReceived: JSON.stringify({ bon_w: 1 }) });
    expect(bundles.filter((b) => b.starterOffer)).toEqual([
      { name: 'bon_w', owned: true, price: 6.99, image: 'OffersBG0', starterOffer: true },
      { name: 'bon_x', owned: false, price: 14.99, image: 'OffersBG1', starterOffer: true },
      { name: 'bon_y', owned: false, price: 29.99, image: 'OffersBG2', starterOffer: true }
    ]);
  });
});
