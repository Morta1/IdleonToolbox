import '../../polyfills';
import 'core-js/modules/web.structured-clone';
import { parseData } from '@parsers/index';
import raw from '../../data/raw.json';

// A character sitting at the cap only shows up as exactly at it because the game clamps
// (Spelunk[3][s] = StaminaMax) on the tick it overshoots. The game caches its own bonus tables and
// keeps clamping to a stale max after an overstim stack or artifact tier goes up, so the save can
// record a cap 1-2 under ours forever - which zeroed the Full Stamina alert and the "at max" count
// for whole accounts. Full now means within one minute of regen.
const STAMINA_INDEX = 3;

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

describe('spelunking full stamina', () => {
  it('counts characters the save clamped to a max a couple of stamina below ours', () => {
    const before = parse();
    const atMax = before.spelunking.charactersAtMaxStamina;
    expect(atMax).toBeGreaterThan(0);

    const after = parse(withStamina((stamina) => stamina - 2));
    expect(after.spelunking.charactersAtMaxStamina).toBe(atMax);
    expect(after.spelunking.charactersStamina.filter(({ isFull }) => isFull).length).toBe(atMax);
  });

  it('still leaves out a character that is actually draining', () => {
    const account = parse(withStamina(() => 0));
    expect(account.spelunking.charactersAtMaxStamina).toBe(0);
    expect(account.spelunking.charactersStamina.every(({ isFull }) => !isFull)).toBe(true);
  });

  it('keeps the window to a minute of regen or a few stamina, whichever is bigger', () => {
    const { staminaRegenRate, charactersStamina } = parse().spelunking;
    const tolerance = Math.max(staminaRegenRate.value / 60, 3);
    expect(tolerance).toBeGreaterThan(0);

    const short = (amount) => parse(withStamina((_, index) => charactersStamina[index]
      ? charactersStamina[index].characterStamina - amount
      : 0));

    expect(short(tolerance / 2).spelunking.charactersAtMaxStamina).toBe(charactersStamina.length);
    expect(short(tolerance * 2).spelunking.charactersAtMaxStamina).toBe(0);
  });
});
