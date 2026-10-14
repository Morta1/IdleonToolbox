import path from 'path';
import { describe, expect, it } from 'vitest';
import { loadWebsiteData } from '../../scripts/entity-graph/registry/data.mjs';
import { registryNodes } from '../../scripts/entity-graph/registry/build.mjs';
import world2 from '../../scripts/entity-graph/registry/world-2/index.mjs';
import { termsFor } from '../../scripts/entity-graph/registry/world-2/poppy-text.mjs';
import { costAt, levelledText } from '../../utility/wiki/effects.mjs';

const data = loadWebsiteData(path.join(process.cwd(), 'data', 'website-data'));
const nodes = registryNodes(data, world2);
const ofKind = (kind) => Object.values(nodes).filter((node) => node.kind === kind);

describe('weekly bosses', () => {
  it('build one page per boss', () => {
    expect(ofKind('weeklyboss').map((node) => node.rawName).sort())
      .toEqual(data.weeklyBosses.map((boss) => boss.bossName).sort());
  });

  // Oracle: weeklyBosses.ts / N.js BossHPmax = x4 * x5^bars, five bars.
  it('list the five health bars', () => {
    const boss = data.weeklyBosses[0];
    const bars = [0, 1, 2, 3, 4].map((n) => (boss.x4 * Math.pow(boss.x5, n)).toLocaleString('en-US', { maximumFractionDigits: 2 }));
    expect(nodes[`weeklyboss:${boss.bossName}`].fields[0]).toEqual({ label: 'Health bars', value: bars.join(' / ') });
  });

  it('name the three tasks a turn can draw', () => {
    const boss = data.weeklyBosses[0];
    const node = nodes[`weeklyboss:${boss.bossName}`];
    expect(node.fields.slice(1).map((field) => field.label)).toEqual(['Task 1', 'Task 2', 'Task 3']);
    expect(node.fields.slice(1).every((field) => !/[{}_]/.test(field.value))).toBe(true);
  });
});

describe('poppy upgrades', () => {
  const byName = (name) => ofKind('poppy').find((node) => node.name === name);

  it('build one page per upgrade', () => {
    expect(ofKind('poppy')).toHaveLength(data.poppyBonuses.length);
  });

  // Oracles: kangaroo.ts formatDescription with no account.
  it.each([
    ['Quick_Reeling', 10, 'Bluefin fishing speed is 1.5x Faster'],
    ['Fishy_discount', 10, 'All fish upgrades are 50% cheaper'],
    ['Tasty_Fishbait', 10, 'Catch 100 Fish every 30 seconds']
  ])('%s at level %s reads %s', (name, level, expected) => {
    expect(levelledText(byName(name), level)).toBe(expected);
  });

  // Oracle: kangaroo.ts RooCost row 0 scales with (1 + level); level 1 is not free.
  it('price Tasty Fishbait from its own level', () => {
    const { x1, x2 } = data.poppyBonuses[0];
    expect(costAt(byName('Tasty_Fishbait'), 1)).toBe(x1);
    expect(costAt(byName('Tasty_Fishbait'), 10)).toBe(x1 * 10 * Math.pow(x2, 9));
  });

  // Oracle: kangaroo.ts RooBonus, level 10: bonus k is granted on levels k + 1, k + 8, ... so the
  // counts are 2, 2, 2, 1, 1, 1, 1 over the bases 3, 3, 5, 2, 2, 0.5, 3.
  it('read the seven real-game bonuses of Bonuses from Poppy in turn', () => {
    expect(levelledText(byName('Bonuses_from_Poppy'), 10)).toBe(
      'Gain a permanent bonus in the real game! +6% Fish Efficiency, +6 Defence, +10% Fishing XP, +2% Accuracy, +2% Total DMG, +0.5% AFK Gains, +3% Cash'
    );
  });

  it('leave a literal question mark alone', () => {
    expect(termsFor({ desc: 'Why_not?', x6: 5 })).toEqual([]);
  });

  // Overflowing pow curves must hide the cost (null), never show NaN.
  it('price every upgrade at a huge level as null or a finite number', () => {
    const bad = ofKind('poppy').filter((node) => {
      const cost = costAt(node, 10000);
      return cost !== null && !Number.isFinite(cost);
    }).map((node) => node.rawName);
    expect(bad).toEqual([]);
  });
});

describe('tar pit upgrades', () => {
  const byName = (name) => ofKind('tarpit').find((node) => node.name === name);

  it('build one page per upgrade', () => {
    expect(ofKind('tarpit')).toHaveLength(data.poppyTarBonuses.length);
  });

  // Oracles: kangaroo.ts with no account.
  it('read Bonus Catching at level 10', () => {
    expect(levelledText(byName('Bonus_Catching'), 10)).toBe('+140% chance for extra shiny catches');
  });

  it('price from the level plus the exponential', () => {
    const { x1, x2 } = data.poppyTarBonuses[0];
    expect(costAt(byName('Super_Yummy_bait'), 1)).toBe(x1);
    expect(costAt(byName('Super_Yummy_bait'), 10)).toBe(9 + x1 * Math.pow(x2, 9));
  });

  // kangaroo.ts tarFishUnlocked: the 1st, 5th and 8th Megafish open 3, 3 and 2 slots.
  it('need 1, 5 or 8 Megafish by slot', () => {
    expect(ofKind('tarpit').map((node) => node.fields[0].value)).toEqual([1, 1, 1, 5, 5, 5, 8, 8]);
  });
});
