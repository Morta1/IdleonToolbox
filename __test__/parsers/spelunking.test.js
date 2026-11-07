import '../../polyfills';
import { describe, expect, it } from 'vitest';
import raw from '../../data/raw.json';
// The chapter multipliers below are differentials on the 22 Aug 2026 save (latest-2026-08.json), which reads 0 for two
// of them: their absence went unnoticed on every save captured so far.
import latest from '../fixtures/latest-2026-08.json';
import { parseFixture } from '../helpers/parsed-fixtures';
import {
  getAmberGain,
  getOptimizedSpelunkingAmberGainUpgrades,
  getOptimizedSpelunkingPowerUpgrades,
  getSpelunking,
  getStaminaRegenRate
} from '@parsers/world-7/spelunking';

const SPELUNK = JSON.parse(raw.data.Spelunk);
const { account, characters } = parseFixture(raw);

// The real parser on one changed save field, against the account the rest of the save parsed to: a full parse per case
// costs half a second and nothing else in it reads these fields.
const spelunkingWith = (mutate = () => {}, target = account) => {
  const spelunk = structuredClone(SPELUNK);
  mutate(spelunk);
  return getSpelunking({ ...raw.data, Spelunk: spelunk }, target, characters);
};

// W7 merit 2, "+{ max Stamina for all characters in Spelunking!"
const withMaxStaminaMerit = (level) => {
  const tasks = structuredClone(account.tasks);
  tasks[2][6][2] = level;
  return { ...account, tasks };
};

describe('spelunking full stamina', () => {
  // The game clamps a full character to exactly StaminaMax (Spelunk[3][s] = StaminaMax), so full is an exact comparison
  // against our max. A max even a few stamina above the game's zeroes the Full Stamina alert for the whole account.
  it('counts a character exactly at max as full and one stamina under as not', () => {
    const { charactersStamina } = account.spelunking;
    const atMax = (offset) => spelunkingWith((spelunk) => {
      spelunk[3] = spelunk[3].map((_, index) => charactersStamina[index] ? charactersStamina[index].characterStamina + offset : 0);
    });
    expect(charactersStamina.length).toBeGreaterThan(0);
    expect(atMax(0).charactersAtMaxStamina).toBe(charactersStamina.length);
    expect(atMax(-1).charactersAtMaxStamina).toBe(0);
  });

  // game "StaminaMax": floor(ShopUpg61 + (20*merit + 10*Glowfish) + (14 + LV + ...) * BigFish * Glowfish). The multipliers
  // bind only to the last group, so the merit lands unmultiplied. This save has a BigFish bonus, so multiplying it would
  // add more than 20 per level.
  it('adds the max stamina merit after the BigFish multiplier', () => {
    const stamina = (level) => spelunkingWith(undefined, withMaxStaminaMerit(level)).charactersStamina.map(({ characterStamina }) => characterStamina);
    expect(stamina(0)[0]).toBeGreaterThan(0);
    expect(stamina(5)).toEqual(stamina(0).map((value) => value + 100));
  });
});

// Overstim is paid by the game's away tick from the stamina that overflows past max, so a character sitting below max in
// the save only fills that deficit first: it still contributes.
describe('spelunking overstim rate', () => {
  it('counts every character, not just the ones at max stamina in the save', () => {
    const { overstimRate, overstimFillRate, staminaRegenRate, charactersStamina } = account.spelunking;
    expect(charactersStamina.length).toBeGreaterThan(0);
    expect(overstimRate).toBeCloseTo(charactersStamina.length * staminaRegenRate.value * (1 + overstimFillRate / 100), 6);
  });

  // The save's stamina snapshot stays clamped to the max as it was when the away-loop last ran, so raising max stamina
  // must not read as every character being short of it. Reported on an account whose 11 characters were each exactly one
  // merit's worth short of the new max.
  it('survives a max stamina increase that leaves every character below max', () => {
    const after = spelunkingWith(undefined, withMaxStaminaMerit(5));
    expect(after.charactersAtMaxStamina).toBe(0);
    expect(after.overstimRate).toBeGreaterThan(0);
    expect(after.overstimRate).toBeCloseTo(spelunkingWith().overstimRate, 6);
  });

  it('stays at 0 while the overstim meter is locked', () => {
    const lock = (spelunk) => { spelunk[5][6] = 0; };
    // The shop level is read off the previous pass, as serializeData's own second pass does
    expect(spelunkingWith(lock, { ...account, spelunking: spelunkingWith(lock) }).overstimRate).toBe(0);
  });
});

describe('spelunking power tutorial gate', () => {
  // The game returns a flat POW of 2 while OptLacc[478] (the tutorial step) is under 8: _customBlock_Spelunk("POW")
  const powerAt = (step) => getSpelunking(raw.data, { ...account, accountOptions: Object.assign([], account.accountOptions, { 478: step }) }, characters).power;

  it.each([
    [7, 'Tutorial'],
    [8, 'Learning the POW']
  ])('at tutorial step %i reads its first line as %s', (step, firstLine) => {
    const power = powerAt(step);
    expect(power.breakdown.tree[0].name).toBe(firstLine);
    if (step < 8) expect(power.value).toBe(2);
    else expect(power.value).toBeGreaterThan(2);
  });
});

// Spelunk[5] is the shop upgrade level array; -1 means still locked, which the optimizer skips on its own, and this save
// has these three locked. Spelunk[4][8] is the Overstim stack: Amber-Track's bonus is a flat multiple of it, so a stack of
// 0 makes the upgrade genuinely worth nothing.
describe('spelunking optimizer upgrade indices', () => {
  const MANIC_POW = 54;
  const AMBER_TRACK = 60;
  const AMBER_SUPPLY_SWAP = 67;

  const offered = (overstimStack) => {
    const spelunking = spelunkingWith((spelunk) => {
      [MANIC_POW, AMBER_TRACK, AMBER_SUPPLY_SWAP].forEach((index) => { spelunk[5][index] = 0; });
      spelunk[4][8] = overstimStack;
    });
    const target = { ...account, spelunking };
    const indices = (upgrades) => upgrades.map(({ index }) => index);
    return {
      power: indices(getOptimizedSpelunkingPowerUpgrades(characters[0], target, 60, { characters })),
      amber: indices(getOptimizedSpelunkingAmberGainUpgrades(characters[0], target, 60, { characters }))
    };
  };

  it('offers Manic_POW and Amber-Track once unlocked, and Amber-Track only with an Overstim stack', () => {
    const { power, amber } = offered(20);
    expect(power).toContain(MANIC_POW);
    expect(amber).toContain(AMBER_TRACK);
    expect(offered(0).amber).not.toContain(AMBER_TRACK);
  });

  // 67 multiplies amber gain by 15 but divides the drop chance by 10. The optimizer scores amber gain alone, so listing it
  // would rank a ~1.5x net upgrade as a 15x one, ahead of everything.
  it('never offers Amber Supply Swap while the metric ignores drop chance', () => {
    expect(offered(20).amber).not.toContain(AMBER_SUPPLY_SWAP);
  });
});

const clone = (o) => JSON.parse(JSON.stringify(o));

const withChapter = (target, chapterIndex, innerIndex, bonus) => {
  const chapters = clone(target.spelunking.chapters);
  chapters[chapterIndex][innerIndex] = { ...chapters[chapterIndex][innerIndex], bonus };
  return { ...target, spelunking: { ...target.spelunking, chapters } };
};

describe('spelunking: all three amber chapter multipliers', () => {
  const { account: saved } = parseFixture(latest);
  const amber = (target) => getAmberGain(target, []).value;
  const base = amber(saved);
  const identity = (chapterIndex, innerIndex) => Math.max(1, saved.spelunking.chapters[chapterIndex][innerIndex].bonus);

  it.each([
    ['Decay Surrounds (1,3)', 1, 3, 4],
    ['Sunken Plunder (4,1)', 4, 1, 3],
    ['Kelp Primeval (5,1)', 5, 1, 10]
  ])('%s multiplies amber gain by its own bonus', (_name, chapterIndex, innerIndex, bonus) => {
    const expected = bonus / identity(chapterIndex, innerIndex);
    expect(expected).toBeGreaterThan(1);
    expect(amber(withChapter(saved, chapterIndex, innerIndex, bonus)) / base).toBeCloseTo(expected, 6);
  });

  it('the three stack multiplicatively', () => {
    let target = withChapter(saved, 1, 3, 4);
    target = withChapter(target, 4, 1, 3);
    target = withChapter(target, 5, 1, 10);
    const expected = (4 * 3 * 10) / (identity(1, 3) * identity(4, 1) * identity(5, 1));
    expect(amber(target) / base).toBeCloseTo(expected, 6);
  });

  it('a bonus below 1 is clamped to the 1x identity, as Math.max(1, ...) does in the game', () => {
    expect(amber(withChapter(saved, 4, 1, 0.5)) / base).toBeCloseTo(1, 10);
  });
});

describe('spelunking: stamina regen chapter 5,2', () => {
  const { account: saved } = parseFixture(latest);
  const regen = (target) => getStaminaRegenRate(target).value;

  it('adds its percentage into the same additive group as chapter 2,1', () => {
    const viaChapter5 = regen(withChapter(saved, 5, 2, 60));
    expect(viaChapter5).toBeGreaterThan(regen(saved));
    expect(viaChapter5).toBeCloseTo(regen(withChapter(saved, 2, 1, 60)), 10);
  });
});
