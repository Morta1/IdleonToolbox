import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { getForge } from '@parsers/world-1/forge';
import { items } from '@website-data';

// Read from the running game on 2026-10-11 through the debug server, logged in as IAmTheHunterrr.
// latest.json is that account's save (OptionsListAccount[340] matches). Forge speed level 90, Godshard card
// level 5, all 16 slots brimstone.
const GAME = {
  // ForgeSpeeed(slot) for slots 0..15, all empty, so no barrel
  slotSpeeds: Array(16).fill(2.625),
  // ForgeStats(2) and GetBribeBonus("9") (Fossil Fuel Legislation)
  forgeSpeedStat: 700,
  oilBribe: 0.2
};

const { account } = parseFixture(latest);

describe('forge verified against the live game', () => {
  it('slot speeds', () => {
    expect(account.forge.list.map(({ speed }) => speed)).toEqual(GAME.slotSpeeds);
  });
});

// Oracle for AFKcode("Forge"): a cycle takes ForgeInterval / (4 * ForgeSpeeed) seconds and eats a whole
// Amount of ore; a SpeedForge barrel adds Amount% speed and lasts quantity / (Cooldown * (1 - bribe / 100) / 100)
// cycles.
const BRIMSTONE = 1.5;
const slotSpeed = (barrel) => 0.25 * GAME.forgeSpeedStat / 100 * (1 + (barrel?.Amount ?? 0) / 100) * BRIMSTONE;
const gameTimeTillEmpty = (ore, oreQuantity, barrel, barrelQuantity) => {
  const cycles = Math.floor(oreQuantity / items[ore].Amount);
  const cycleTime = (speed) => items[ore].Cooldown / (4 * speed);
  const barrelCycles = barrel
    ? Math.min(cycles, barrelQuantity / (items[barrel].Cooldown * (1 - GAME.oilBribe / 100) / 100))
    : 0;
  return 1000 * (barrelCycles * cycleTime(slotSpeed(items[barrel])) + (cycles - barrelCycles) * cycleTime(slotSpeed()));
};

describe('forge slot with ore and barrel', () => {
  it.each([
    ['no barrel, leftover ore below one Amount never smelts', 'Gold', 705, 'Blank', 0],
    ['speed barrel outlasts the ore', 'Gold', 700, 'OilBarrel3', 50],
    ['speed barrel runs out part way', 'Gold', 700, 'OilBarrel3', 10],
    ['double bars barrel leaves the speed alone', 'Plat', 1600, 'OilBarrel2', 100]
  ])('%s', (_name, ore, oreQuantity, barrel, barrelQuantity) => {
    const idleonData = {
      ForgeItemOrder: [ore, barrel, 'Blank'],
      ForgeItemQty: [oreQuantity, barrelQuantity, 0],
      ForgeLV: latest.data.ForgeLV
    };
    const [slot] = getForge(idleonData, account).list;
    const speedBarrel = items[barrel]?.Effect === 'SpeedForge' ? barrel : null;
    expect(slot.speed).toBeCloseTo(slotSpeed(items[speedBarrel]), 12);
    expect(slot.ore.timeTillEmpty).toBeCloseTo(gameTimeTillEmpty(ore, oreQuantity, speedBarrel, barrelQuantity), 6);
  });
});
