import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { skullCatalog, weeklyCatalog } from '../../scripts/entity-graph/shop-catalog.mjs';
import { loadWebsiteData } from '../../scripts/entity-graph/registry/data.mjs';
import { realItem, skullRowSellsItem, weeklyRowSellsItem } from '../../scripts/entity-graph/edges/currency-shops.mjs';

const data = loadWebsiteData(path.join(process.cwd(), 'data', 'website-data'));
const skull = skullCatalog(data.killRoySkullShop, data.items, data);
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

  // The cap is base + scale of the row's Killroy bonus curve, the ceiling the decay approaches.
  // The curves never reach it on their own, so the row says "up to" rather than a current value.
  it('fills a curve row with its cap as an upper bound', () => {
    expect(skull.map(rendered).flatMap((text) => text.match(/up to \+?[\d.]+/g) || [])).toEqual([
      'up to 2', 'up to 10', 'up to 3', 'up to 2.3', 'up to 1.8', 'up to +25', 'up to 3'
    ]);
    expect(skull.filter((row) => /\(max\)|Current bonus/.test(rendered(row)))).toEqual([]);
  });

  // A placeholder row the `{` guard drops would otherwise vanish without a trace.
  it('keeps every Killroy row that is not an item', () => {
    const isRealItem = realItem(data.items);
    expect(skull).toHaveLength(data.killRoySkullShop.filter((row) => row && !skullRowSellsItem(row, isRealItem)).length);
  });

  // The deposits hand over a count the row's description leads with. "of the type shown to the left"
  // points at the game screen, so those read by name and carry the count as a quantity; the skull
  // row is a finished sentence on its own.
  it('keeps the amount of each weekly deposit', () => {
    const isRealItem = realItem(data.items);
    const rows = data.weeklyBossesShop[1].filter((row) => row && !weeklyRowSellsItem(row, isRealItem));
    const entries = weekly.slice(data.weeklyBossesShop[0].filter(Boolean).length);
    const amount = (entry) => entry.quantity ?? Number(rendered(entry).match(/^\d+/)?.[0]);
    expect(entries.map(amount)).toEqual(rows.map((row) => Number(row.description.match(/^\d+/)[0])));
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
