import '../../polyfills';
import 'core-js/modules/web.structured-clone';
import { parseData } from '@parsers/index';
import raw from '../../data/raw.json';

// The game clamps a full character to exactly StaminaMax (Spelunk[3][s] = StaminaMax), so full is
// an exact comparison against our max. A max even a few stamina above the game's zeroes the Full
// Stamina alert for the whole account.
const STAMINA_INDEX = 3;
const W7_MERITS = 6;
const MAX_STAMINA_MERIT = 2;

const parse = (mutate) => {
  const clone = structuredClone(raw);
  mutate?.(clone.data);
  return parseData(clone.data, clone.charNames, clone.companion, clone.guildData, clone.serverVars).account;
};

const withStamina = (map) => (data) => {
  const spelunk = JSON.parse(data.Spelunk);
  spelunk[STAMINA_INDEX] = spelunk[STAMINA_INDEX].map(map);
  data.Spelunk = JSON.stringify(spelunk);
};

const withMaxStaminaMerit = (level) => (data) => {
  const tasks = JSON.parse(data.TaskZZ2);
  tasks[W7_MERITS][MAX_STAMINA_MERIT] = level;
  data.TaskZZ2 = JSON.stringify(tasks);
};

describe('spelunking full stamina', () => {
  const { charactersStamina } = parse().spelunking;
  const atMax = (offset) => parse(withStamina((_, index) => charactersStamina[index]
    ? charactersStamina[index].characterStamina + offset
    : 0)).spelunking;

  it('counts a character exactly at max as full and one stamina under as not', () => {
    expect(charactersStamina.length).toBeGreaterThan(0);
    expect(atMax(0).charactersAtMaxStamina).toBe(charactersStamina.length);
    expect(atMax(-1).charactersAtMaxStamina).toBe(0);
  });

  // game "StaminaMax": floor(ShopUpg61 + (20*merit + 10*Glowfish) + (14 + LV + ...) * BigFish * Glowfish).
  // The multipliers bind only to the last group, so the merit lands unmultiplied. The demo account
  // has a BigFish bonus, so multiplying it would add more than 20 per level.
  it('adds the max stamina merit after the BigFish multiplier', () => {
    const before = parse(withMaxStaminaMerit(0)).spelunking;
    expect(before.charactersStamina[0].characterStamina).toBeGreaterThan(0);
    const after = parse(withMaxStaminaMerit(5)).spelunking;
    expect(after.charactersStamina.map(({ characterStamina }) => characterStamina))
      .toEqual(before.charactersStamina.map(({ characterStamina }) => characterStamina + 100));
  });
});
