import '../../polyfills';
import { describe, expect, it } from 'vitest';
import latest from '../fixtures/latest.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import { getMaxDamage } from '@parsers/damage';
import { getSkillEfficiency } from '@parsers/efficiency';

// SkillStats("<Skill>Efficiency") read from the running game on 10 Oct 2026 for IAmTheHunterrr, the active
// character, through the debug server; latest.json is the same account's save from that day. The save's stat
// snapshot (PVStatList) lags the live stats, so the live TotalStats values replace it here.
const LIVE_STATS = { strength: 1711268, agility: 2133782, wisdom: 1700458 };
const GAME_EFFICIENCY = {
  mining: 531918577786381140000,
  chopping: 39298913174601570,
  fishing: 43949671493862410,
  catching: 1122694480846211600,
  trapping: 37335636674433180,
  worship: 2255542297.186722,
  cooking: 998978550.5150876,
  laboratory: 89249986.01090683,
  // Spelunk("SpelunkingEfficiency", 0, 0)
  spelunking: 17069788.070241455
};
// The rest match up to the All Efficiencies tome drift (~1e-4). Mining and choppin are ~0.2% high: the game
// builds Hearty Diggy and Hocus Choppus from log(max HP / MP) before the bubbles raise them.
const TOLERANCE = { mining: 3e-3, chopping: 3e-3 };
const DEFAULT_TOLERANCE = 2e-4;

describe('skill efficiency verified against the live game', () => {
  const { account, characters } = parseFixture(latest);
  const saved = characters.find(({ name }) => name === 'IAmTheHunterrr');
  const hunter = { ...saved, stats: { ...saved.stats, ...LIVE_STATS } };
  const playerInfo = getMaxDamage(hunter, characters, account);

  it.each(Object.entries(GAME_EFFICIENCY))('%s', (skill, value) => {
    const ratio = getSkillEfficiency(skill, hunter, characters, account, playerInfo).value / value;
    expect(Math.abs(ratio - 1)).toBeLessThan(TOLERANCE[skill] ?? DEFAULT_TOLERANCE);
  });
});
