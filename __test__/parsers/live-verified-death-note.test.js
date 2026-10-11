import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { getDeathNoteRank, getEclipseSkullsBonus } from '@parsers/world-3/deathNote';
import { getMultiKillPerTier } from '@parsers/damage';

// Read from the running game on 11 Oct 2026 through the debug server, logged in as IAmTheHunterrr on map 50.
// latest.json is that save, Eclipse Skulls rift bonus unlocked.
const GAME = {
  // DNSM.OKqtyZZ after WorkbenchStuff("OverkillQTY", -1): slots 0..6 = worlds, 7 = mini bosses
  overkillQty: [238, 77, 164, 182, 196, 237, 408, 9],
  // RiftStuff("eclipseSkulls") with DNSM.EclipseSk deleted first (39 skulls in worlds 1-6)
  eclipseSkulls: 195,
  // WorkbenchStuff("MultiKill_perTier") on map 50 (death note slot 1)
  multiKillPerTier: 689.4102142408987,
  // WorkbenchStuff("DeathNoteRank", kills, 0) and (kills, 7842) for mini bosses: [kills, rank, mini boss rank]
  ranks: [[0, 0, 0], [99, 0, 0], [100, 0, 1], [249, 0, 1], [250, 0, 2], [999, 0, 2], [1000, 0, 3], [4999, 0, 3],
    [5000, 0, 4], [24999, 0, 4], [25000, 1, 5], [99999, 1, 5], [100000, 2, 7], [249999, 2, 7], [250000, 3, 7],
    [499999, 3, 7], [500000, 4, 7], [999999, 4, 7], [1000000, 5, 10], [4999999, 5, 10], [5000000, 7, 10],
    [99999999, 7, 10], [100000000, 10, 10], [1000000000, 10, 10], [1000000001, 20, 10]]
};
const MULTI_KILL_NOTE_INDEX = 1;

const { account, characters } = parseFixture(latest);
const hunter = characters.find((character) => character?.name === 'IAmTheHunterrr');
const slotKeys = [...GAME.overkillQty.slice(0, -1).map((_, index) => String(index)), 'miniBosses'];

describe('death note matches the live game', () => {
  it.each(slotKeys.map((key, index) => [key, GAME.overkillQty[index]]))('slot %s rank total', (key, value) => {
    expect(account.deathNote[key].rank).toBe(value);
  });

  it.each(GAME.ranks)('%d kills rank %d, mini boss rank %d', (kills, rank, miniBossRank) => {
    expect([getDeathNoteRank(account, kills, false), getDeathNoteRank(account, kills, true)]).toEqual([rank, miniBossRank]);
  });

  it('eclipse skulls damage bonus', () => {
    expect(getEclipseSkullsBonus(account)).toBe(GAME.eclipseSkulls);
  });

  it('multikill per tier', () => {
    expect(getMultiKillPerTier(hunter, characters, account, MULTI_KILL_NOTE_INDEX)).toBeCloseTo(GAME.multiKillPerTier, 9);
  });
});
