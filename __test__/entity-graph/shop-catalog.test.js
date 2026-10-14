import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { skullCatalog, weeklyCatalog } from '../../scripts/entity-graph/shop-catalog.mjs';
import { loadWebsiteData } from '../../scripts/entity-graph/registry/data.mjs';

const data = loadWebsiteData(path.join(process.cwd(), 'data', 'website-data'));
const skull = skullCatalog(data.killRoySkullShop, data.items);
const weekly = weeklyCatalog(data.weeklyBossesShop, data.items);
const rendered = (row) => row.text.replace(/_/g, ' ');

describe('shop catalogs', () => {
  it.each([['skull', skull], ['weekly', weekly]])('%s rows read as finished text', (name, catalog) => {
    expect(catalog.filter((row) => !rendered(row).trim() || /[{}|_]/.test(rendered(row)))).toEqual([]);
  });

  // Rows that drop an item are `sells` edges; only the random time candy has no item to point at.
  it('leaves the item rows of Killroy to the edges', () => {
    const itemTexts = data.killRoySkullShop.slice(1).filter((row) => Number(row.x2) === 1)
      .map((row) => row.description.replace(/_/g, ' '));
    expect(skull.filter((row) => itemTexts.includes(rendered(row)))).toEqual([]);
    expect(rendered(skull[0])).toBe(data.killRoySkullShop[0].description.replace(/_/g, ' '));
  });

  // Every special-handler row carries Timecandy1 as a placeholder bonusName; only the candy row is candy.
  it('draws candy art for the time candy row alone', () => {
    expect(skull.filter((row) => row.icon === '/data/Timecandy1.png').map(rendered))
      .toEqual([data.killRoySkullShop[0].description.replace(/_/g, ' ')]);
  });

  // The cap is the decayMulti ceiling in parsers/misc.ts permanentUpgradeCapMap (index 1: cap 2, mult).
  it('fills a curve row with its cap', () => {
    const artifact = data.killRoySkullShop[11].description.split('{')[0].replace(/_/g, ' ');
    expect(skull.find((row) => rendered(row).startsWith(artifact)).text.endsWith('2x (max)')).toBe(true);
  });

  it('lists every weekly UI skin by name', () => {
    const skins = data.weeklyBossesShop[0].map((row) => `${row.name.replace(/_/g, ' ')} skin`);
    expect(weekly.map(rendered).filter((text) => text.endsWith(' skin'))).toEqual(skins);
  });

  it.each([['skull', skull], ['weekly', weekly]])('%s icons exist under public/', (name, catalog) => {
    expect(catalog.filter((row) => !row.icon || !fs.existsSync(path.join(process.cwd(), 'public', row.icon))))
      .toEqual([]);
  });
});
