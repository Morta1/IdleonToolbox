import '../../polyfills';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { loadWebsiteData } from '../../scripts/entity-graph/registry/data.mjs';
import { enrichWorld6 } from '../../scripts/entity-graph/enrich-world-6.mjs';
import { jadeNodes } from '../../scripts/entity-graph/nodes/catalogs-b.mjs';
import { monsterNodes } from '../../scripts/entity-graph/nodes/monsters.mjs';

const data = loadWebsiteData(path.join(process.cwd(), 'data', 'website-data'));

// The before/after snapshots name exactly which nodes the enrichment touched.
const blank = () => ({
  ...jadeNodes(data.jadeUpgrades),
  ...monsterNodes(data.monsters, data.mapNames)
});
const before = blank();
const snapshot = Object.fromEntries(Object.entries(before).map(([id, node]) => [id, JSON.stringify(node)]));
const nodes = blank();
enrichWorld6(nodes, data);
const changed = (prefix) => Object.keys(nodes).filter((id) => id.startsWith(prefix) && JSON.stringify(nodes[id]) !== snapshot[id]).sort();
const jadeNamed = (name) => Object.values(nodes).find((node) => node.kind === 'jade' && node.name === name);

describe('jade emporium', () => {
  it('enrich every upgrade that has a page', () => {
    const expected = data.jadeUpgrades
      .filter((upgrade) => upgrade?.name && upgrade.name !== 'UNDER_CONSTRUCTION')
      .map((upgrade) => `jade:NjJupg${upgrade.x3}`);
    expect(changed('jade:')).toEqual(expected.sort());
  });

  // Oracle: Ninja.js:24-35 EmporiumCost / EmporiumOptions with N.js:108998 and N.js:110097
  // (sneaking.ts:208-209 prices inline, so the values are pinned).
  it('price the first rows of the shop', () => {
    expect(jadeNamed('Quick_Ref_Access').fields).toEqual([
      { label: 'Cost', value: '300 Jade Coins' },
      { label: 'Shop row', value: 1 }
    ]);
    expect(jadeNamed('Gold_Food_Beanstalk').fields).toEqual([
      { label: 'Cost', value: '2,673,737 Jade Coins' },
      { label: 'Shop row', value: 8 },
      { label: 'Offered after', value: '5 purchases' }
    ]);
  });

  it('price the rows that grow past the quadratic steps', () => {
    const priced = ['MSA_Expander_I', 'Level_Exemption', 'Emperor_Season_Pass', 'Optimal_Optometry']
      .map((name) => [name, jadeNamed(name).fields.find((field) => field.label === 'Shop row').value, jadeNamed(name).fields.find((field) => field.label === 'Cost').value]);
    expect(priced).toEqual([
      ['MSA_Expander_I', 2, '2,019 Jade Coins'],
      ['Level_Exemption', 3, '8,306 Jade Coins'],
      ['Emperor_Season_Pass', 40, '1.30e28 Jade Coins'],
      ['Optimal_Optometry', 47, '8.86e49 Jade Coins']
    ]);
  });

  it('say "1 purchase" for the first locked row, and nothing for the first three', () => {
    const order = data.ninjaExtraInfo[24].map(Number);
    const at = (row) => nodes[`jade:NjJupg${order[row]}`];
    const offered = (row) => at(row)?.fields.find((field) => field.label === 'Offered after')?.value;
    expect([0, 1, 2, 3, 4].map((row) => (at(row) ? offered(row) : 'skipped'))).toEqual([undefined, undefined, undefined, '1 purchase', '2 purchases']);
  });
});

describe('Emperor showdown rewards', () => {
  it('enrich only the Emperor', () => {
    expect(changed('monster:')).toEqual(['monster:Boss6A']);
  });

  // Oracle: N.js:106713-106717 and N.js:118257 (EmperorBon walk and the `{` `}` `$` display).
  it('list each bonus as a per-win step with the wins it lands on', () => {
    expect(nodes['monster:Boss6A'].fields).toEqual([
      {
        label: 'Showdown rewards (the cycle repeats every 48 wins)',
        value: [
          '+0.3x Ninja Stealth per win, at wins 1, 3, 7, 12, 16, 20, 26, 33, 45',
          '+0.05x Deathbringer Extra Bones per win, at wins 2, 5, 11, 17, 27, 38, 48',
          '20% cheaper Farming Upgrades after one win (the price itself drops 16.7%), at wins 4, 8, 13, 18, 24, 37, 46',
          '+0.05x Windwalker Extra Dust per win, at wins 6, 9, 14, 19, 23, 30, 41',
          '+1 Opals per win, at wins 10, 28',
          '+15% Equinox Bar Fill Rate per win, at wins 15, 22, 29, 42',
          '+0.05x Arcane Cultist Extra Tachyons per win, at wins 21, 35, 44',
          '+0.5x Gaming Bit gain per win, at wins 25, 34, 39, 43',
          '+10% Drop Rate per win, at wins 31, 47',
          '+0.01x Summoning Winner Bonuses per win, at win 32',
          'Wins 36, 40: a bonus not released yet'
        ]
      },
      { label: 'Showdown HP', value: '1.35e14, x1.52 per showdown won' }
    ]);
  });
});
