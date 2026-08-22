import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { getShinyChance, getShinyChanceInfo } from '@parsers/world-3/traps';

// FUR_REFRESHER / ORANGE_MALT are plain "add" vials, so level * x1 is the percent they give.
const vial = (stat, level, x1) => ({ stat, level, x1, x2: 0, func: 'add' });

const buildAccount = ({ shiny1 = 0, shiny2 = 0, taskLevel = 0 } = {}) => ({
  alchemy: { vials: [vial('Shiny1', shiny1, 1), vial('Shiny2', shiny2, 1)], bubblesFlat: [] },
  stamps: {},
  cards: {},
  tasks: [[], [[], [], [0, 0, 0, 0, 0, taskLevel]]],
  arcade: { shop: [] },
  accountOptions: {}
});

describe('getShinyChance', () => {
  it('falls back to the raw per-critter chances with no account', () => {
    const { multiplier, bundleSize, critters } = getShinyChanceInfo(undefined, undefined);

    expect(multiplier).toBe(1);
    expect(bundleSize).toBe(1);
    expect(critters).toHaveLength(11);
    expect(critters[0]).toMatchObject({ rawName: 'Critter1', baseChance: 5, chance: 5 });
    expect(critters.at(-1)).toMatchObject({ rawName: 'Critter11', baseChance: 0.001, chance: 0.001 });
  });

  it('multiplies the vial and task bonuses into the per-critter chance', () => {
    const account = buildAccount({ shiny1: 60, shiny2: 40, taskLevel: 10 });
    const { multiplier, critters } = getShinyChance({}, account);

    // (1 + 2 * 10 / 100) task * (1 + (60 + 40) / 100) vials
    expect(multiplier).toBeCloseTo(1.2 * 2, 10);
    expect(critters[0].chance).toBeCloseTo(5 * 1.2 * 2, 10);
  });

  it('never floors a chance below the game minimum of 0.001', () => {
    const { critters } = getShinyChance({}, buildAccount());
    expect(Math.min(...critters.map(({ chance }) => chance))).toBeGreaterThanOrEqual(0.001);
  });
});
