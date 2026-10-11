import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { calcAnvilExp, getAnvilFutureProduction, getPlayerAnvil } from '@parsers/world-1/anvil';
import { getActiveBubbleBonus } from '@parsers/world-2/alchemy';
import { getSpeedBonusFromAgility } from '@parsers/misc';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr (Wind Walker).
// latest.json is that account's save (OptionsListAccount[340] matches). The save's PVStatList lags the live
// stats, so the live TotalStats("AGI") replaces it.
const LIVE_AGILITY = 2133846;
// AnvilProduceStats("ProductionSpeed") and AlchBubbles.AnvilACTIVE (Hammer Hammer). The bubble level kept
// rising after the export (save 1759944, live 1762086), so the speed is compared without it first.
const GAME_SPEED = 4140373896.0497675;
const GAME_HAMMER_BUBBLE = 3524195;
const GAME = {
  // 100 * (AnvilProduceStats("ProdExpBonus") - 1)
  exp: 100 * (66.81945784040975 - 1),
  // AnvilProduceStats("Cap"), "Costs1", "Costs2", RunCodeOfType("Costs2TypeAnvilPA")
  capacity: 2e9,
  nextCoinUpgrade: 151200035,
  nextMatUpgrade: 1926,
  matItem: 'GalaxyC4'
};
const HAMMER_BUBBLE_LEVEL_DRIFT = 2e-3;

const { account, characters } = parseFixture(latest);
const saved = characters.find(({ name }) => name === 'IAmTheHunterrr');
const hunter = { ...saved, stats: { ...saved.stats, agility: LIVE_AGILITY } };
const { stats } = getPlayerAnvil(hunter, characters, account);

describe('anvil verified against the live game', () => {
  it('production speed apart from the Hammer Hammer bubble', () => {
    const hammerBubble = getActiveBubbleBonus(hunter?.equippedBubbles, 'HAMMER_HAMMER', account);
    const speed = stats.anvilSpeed / 3600 / (1 + hammerBubble / 100);
    expect(speed / (GAME_SPEED / (1 + GAME_HAMMER_BUBBLE / 100))).toBeCloseTo(1, 12);
  });

  it('production speed with the save-side bubble level', () => {
    const ratio = stats.anvilSpeed / 3600 / GAME_SPEED;
    expect(Math.abs(ratio - 1)).toBeLessThan(HAMMER_BUBBLE_LEVEL_DRIFT);
  });

  it('EXP, capacity and point costs', () => {
    expect({
      exp: calcAnvilExp(hunter, characters, account, stats.baseAnvilExp, stats.xpPoints),
      capacity: stats.anvilCapacity,
      nextCoinUpgrade: stats.anvilCost.nextCoinUpgrade,
      nextMatUpgrade: stats.anvilCost.nextMatUpgrade,
      matItem: stats.anvilCost.rawName
    }).toEqual({ ...GAME, exp: expect.closeTo(GAME.exp, 9) });
  });
});

// game: AFKcode("AnvilPA") adds ProductionSpeed * t to the shared progress once per hammer, then floors
// progress / requiredAmount into items, capped at the anvil capacity
describe('anvil production over time', () => {
  const now = Date.now();
  const anvilStats = { anvilSpeed: 3600, anvilCapacity: 1000 };
  it.each([
    // 2 hammers, 10 s at 1/s each: progress 50 + 20 = 70 -> 3 items, the leftover 10 stays as progress
    ['partial progress is floored', { hammers: 2, currentAmount: 5, currentProgress: 50, requiredAmount: 20, seconds: 10 }, 8],
    ['the shared progress is not multiplied by the hammers', { hammers: 3, currentAmount: 0, currentProgress: 19, requiredAmount: 20, seconds: 0 }, 0],
    ['capacity caps the output', { hammers: 1, currentAmount: 990, currentProgress: 0, requiredAmount: 1, seconds: 100 }, 1000]
  ])('%s', (_name, { seconds, ...slot }, expected) => {
    expect(getAnvilFutureProduction({ ...slot, stats: anvilStats, afkTime: now - seconds * 1000 })).toBe(expected);
  });
});

// game: AnvilProduceStats("ProdSpdBonusFromAGI"), 1e3 > AGI picks the small curve, so 1000 AGI is on the big one
const gameAgilitySpeed = (agi) => 1 + 2 * (1e3 > agi
  ? (Math.pow(agi + 1, 0.37) - 1) / 40
  : ((agi - 1e3) / (agi + 2500)) * 0.5 + 0.297);

describe('anvil agility speed curve', () => {
  it.each([999, 1000, 1001, LIVE_AGILITY])('%s AGI', (agility) => {
    expect(getSpeedBonusFromAgility(agility)).toBe(gameAgilitySpeed(agility));
  });
});
