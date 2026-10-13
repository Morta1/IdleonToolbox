import path from 'path';
import { describe, expect, it } from 'vitest';
import { loadWebsiteData } from '../../scripts/entity-graph/registry/data.mjs';
import { registryEdges, registryNodes } from '../../scripts/entity-graph/registry/build.mjs';
import world1 from '../../scripts/entity-graph/registry/world-1/index.mjs';
import { costAt, levelledText } from '../../utility/wiki/effects.mjs';

const data = loadWebsiteData(path.join(process.cwd(), 'data', 'website-data'));
const nodes = registryNodes(data, world1);
const edges = registryEdges(data, world1);
const ofKind = (kind) => Object.values(nodes).filter((node) => node.kind === kind);

describe('statues', () => {
  it('build one page per statue in the game table', () => {
    expect(ofKind('statue')).toHaveLength(data.statues.filter((statue) => statue?.name).length);
  });

  // The page is named after the statue item a player levels it with, so the two always agree.
  it('take their name from the statue item they are levelled with', () => {
    const bad = ofKind('statue').filter((node) => {
      const edge = edges.find((e) => e.from === `statue:${node.rawName}`);
      return !edge || data.items[edge.to.replace('item:', '')]?.displayName !== node.name;
    }).map((node) => node.rawName);
    expect(bad).toEqual([]);
  });

  // Oracle: statues.ts, level times the base bonus, before save-dependent multipliers.
  it('read their bonus at a level', () => {
    const power = nodes['statue:Statue1'];
    expect(levelledText(power, 10)).toBe(`+${10 * data.statues[0].bonus} Base Damage`);
  });

  it('print a percentage statue with its percent sign', () => {
    const speed = nodes['statue:Statue2'];
    expect(levelledText(speed, 10)).toBe(`+${Math.round(10 * data.statues[1].bonus * 100) / 100}% Move Speed`);
  });
});

describe('bribes', () => {
  it('build one page per named bribe', () => {
    expect(ofKind('bribe').length).toBe(data.bribes.filter((bribe) => bribe?.name && !/filler/i.test(bribe.name)).length);
  });

  it('show their price in coins', () => {
    const first = nodes['bribe:Bribe0'];
    expect(first.fields).toEqual([{ label: 'Price', value: data.bribes[0].price, format: 'coins' }]);
    expect(first.description).toBe(data.bribes[0].desc.replace('5%', `${data.bribes[0].value}%`));
  });

  // The BribeO<set> sheets are blank envelope frames, so every bribe uses the Bribes page icon.
  it('use the Bribes page icon with no fallbacks', () => {
    expect(ofKind('bribe').map(({ icon, iconFallbacks }) => ({ icon, iconFallbacks })).filter(
      (art) => art.icon !== '/data/BribeW.png' || art.iconFallbacks !== undefined
    )).toEqual([]);
  });

  // The game prices a set gate that unlocks elsewhere at one fixed sentinel, which is not a cost.
  const sentinelKeys = Object.values(nodes).filter((node) => node.kind === 'bribe'
    && data.bribes[node.order].price === 99999999).map((node) => node.rawName);

  it('has sentinel-priced bribes to check', () => {
    expect(sentinelKeys.length).toBeGreaterThan(0);
  });

  it.each(sentinelKeys)('hide the price of %s, which cannot be bought', (key) => {
    expect(nodes[`bribe:${key}`].fields).toBeUndefined();
  });
});

describe('owl upgrades', () => {
  const byName = (name) => ofKind('owl').find((node) => node.name === name);

  it('build one page per upgrade', () => {
    expect(ofKind('owl')).toHaveLength(data.owlData.length);
  });

  // Oracle: owl.ts, the per-feather table times the upgrade's level.
  it('read a per-level bonus from the game table', () => {
    const index = data.owlData.findIndex((upgrade) => upgrade.name === 'Super_Feather_Cheapener');
    const perLevel = data.gameTables.owlBonusPerFeather[index];
    expect(levelledText(byName('Super_Feather_Cheapener'), 3)).toBe(`All feather upgrades are ${3 * perLevel}% cheaper`);
  });

  // Oracle: owl.ts bonus3, floor(1e4 * (1 - 1 / (1 + 10 * 1 / 100))) / 100 at level 1. Its `@`
  // token must survive tidy(), which reads `@` as a line break.
  it('read Feather Cheapener discount at a level', () => {
    expect(levelledText(byName('Feather_Cheapener'), 1)).toBe('All feather upgrades are 9.09% cheaper');
  });

  it('wear the owl shop art for their table position', () => {
    const wrong = ofKind('owl').filter((node) => node.icon !== `/etc/Owl_${node.order}.png`
      || node.iconFallbacks?.join() !== '/etc/Owl.png').map((node) => node.rawName);
    expect(wrong).toEqual([]);
  });

  // Oracle: owl.ts bonus1 with no mega feathers, 3 ^ (restarts + 1).
  it('read Feather Restart as a power of three', () => {
    expect(levelledText(byName('Feather_Restart'), 2)).toBe('Reset almost all Upgrades and Feathers. Generate 27x Feathers');
  });

  // Oracle: owl.ts cost, upgrade 0 scales with its own level, so its first level is free.
  it('price Feather Generation from its own level', () => {
    const generation = data.owlData[0];
    const node = byName('Feather_Generation');
    expect(costAt(node, 1)).toBe(0);
    expect(costAt(node, 2)).toBe(generation.x1 * 1 * Math.pow(Math.max(1.05, generation.x2), 1));
  });
});
