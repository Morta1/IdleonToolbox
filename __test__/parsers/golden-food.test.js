import '../../polyfills';
import 'core-js/modules/web.structured-clone';
import { beforeAll, describe, expect, it } from 'vitest';
import { getGoldenFoodBonus, getGoldenFoodMulti } from '@parsers/misc';
import { items } from '@website-data';
import { lavaLog } from '@utility/helpers';
import { parseData } from '@parsers/index';
import fourth from '../fixtures/fourth.json';

// Golden foods are keyed by Effect in the game, not by name. Two of them carry DropRatez:
// Golden_Cake (Amount 8, beanstalk index 14) and Golden_Sugar_Cookie (Amount 2, index 16).
const CAKE = items.FoodG13;
const COOKIE = items.FoodG15;
const HAM = items.FoodG5;

const slot = (item, amount) => ({ name: item.displayName, ...item, amount });

// A real parsed save, so getGoldenFoodMulti gets every input it expects. Only the fields under
// test are overridden.
let baseAccount;
let baseCharacter;
let baseCharacters;

beforeAll(() => {
  const { data, charNames, companion, guildData, serverVars } = fourth;
  const parsed = parseData(data, charNames, companion, guildData, serverVars);
  baseAccount = parsed.account;
  baseCharacters = parsed.characters;
  baseCharacter = parsed.characters[0];
});

const withAccount = ({ beanstalkUnlocked = true, beanstalkData = [], cards } = {}) => ({
  ...baseAccount,
  ...(cards ? { cards } : {}),
  sneaking: {
    ...baseAccount.sneaking,
    beanstalkData,
    jadeEmporium: [{ name: 'Gold_Food_Beanstalk', unlocked: beanstalkUnlocked }]
  }
});

const withFood = (food = []) => ({ ...baseCharacter, food });

const bonusOf = (foodName, character, account) => getGoldenFoodBonus(foodName, character, account, baseCharacters);

const multiOf = (character, account) => getGoldenFoodMulti(character, account, baseCharacters)?.value;

// Mirrors the game's per-food term, so expectations don't depend on the fixture's multi.
const expectedTerm = (item, quantity, multi) =>
  item.Amount * multi * 0.05 * lavaLog(1 + quantity) * (1 + lavaLog(1 + quantity) / 2.14);

const rankedAt = (index, rank) => {
  const data = new Array(17).fill(0);
  data[index] = rank;
  return data;
};

describe('getGoldenFoodBonus - Effect matching', () => {
  it('counts every equipped golden food sharing the requested food Effect', () => {
    const account = withAccount({ beanstalkUnlocked: false });
    const character = withFood([slot(CAKE, 10000), slot(COOKIE, 10000)]);
    const multi = multiOf(character, account);

    const expected = expectedTerm(CAKE, 10000, multi) + expectedTerm(COOKIE, 10000, multi);
    expect(bonusOf('Golden_Cake', character, account)).toBeCloseTo(expected, 6);
  });

  it('counts an equipped Golden Sugar Cookie even when no Golden Cake is equipped', () => {
    const account = withAccount({ beanstalkUnlocked: false });
    const character = withFood([slot(COOKIE, 10000)]);
    const multi = multiOf(character, account);

    // Before the Effect fix this was 0 - Drop Rate only ever looked up Golden_Cake by name.
    expect(bonusOf('Golden_Cake', character, account)).toBeCloseTo(expectedTerm(COOKIE, 10000, multi), 6);
  });

  it('resolves either DropRatez food name to the same total', () => {
    const account = withAccount({ beanstalkUnlocked: false });
    const character = withFood([slot(CAKE, 10000), slot(COOKIE, 10000)]);

    expect(bonusOf('Golden_Sugar_Cookie', character, account))
      .toBeCloseTo(bonusOf('Golden_Cake', character, account), 6);
  });

  it('ignores equipped foods belonging to a different Effect', () => {
    const account = withAccount({ beanstalkUnlocked: false });
    const character = withFood([slot(HAM, 10000)]);
    expect(bonusOf('Golden_Cake', character, account)).toBe(0);
  });

  it('ignores non-golden food occupying a slot', () => {
    const account = withAccount({ beanstalkUnlocked: false });
    const character = withFood([{ name: 'Raw_Nigiri', Type: 'FOOD', Effect: 'DropRatez', Amount: 999, amount: 10000 }]);
    expect(bonusOf('Golden_Cake', character, account)).toBe(0);
  });

  it('returns 0 for a name that is not a golden food', () => {
    const account = withAccount({ beanstalkUnlocked: false });
    const character = withFood([slot(CAKE, 10000)]);
    expect(bonusOf('Raw_Nigiri', character, account)).toBe(0);
  });

  it('returns 0 without a character', () => {
    expect(getGoldenFoodBonus('Golden_Cake', undefined, withAccount(), baseCharacters)).toBe(0);
  });
});

describe('getGoldenFoodBonus - beanstalk', () => {
  it('adds the first Effect-matching beanstalk food when it is on the stalk', () => {
    const account = withAccount({ beanstalkData: rankedAt(14, 2) });
    const character = withFood();
    const multi = multiOf(character, account);

    expect(bonusOf('Golden_Cake', character, account))
      .toBeCloseTo(expectedTerm(CAKE, 1e3 * Math.pow(10, 2), multi), 6);
  });

  it('never counts a later food sharing the Effect - the game breaks at the first match', () => {
    // Cake (index 14) is off the stalk, Sugar Cookie (index 16) is on it. The game's loop reaches
    // Cake first, sees rank 0, and breaks - so the Cookie's stalk bonus is unreachable.
    const account = withAccount({ beanstalkData: rankedAt(16, 3) });
    expect(bonusOf('Golden_Cake', withFood(), account)).toBe(0);
  });

  it('counts only the first match when both foods are on the stalk', () => {
    const beanstalkData = rankedAt(14, 2);
    beanstalkData[16] = 3;
    const account = withAccount({ beanstalkData });
    const character = withFood();
    const multi = multiOf(character, account);

    expect(bonusOf('Golden_Cake', character, account))
      .toBeCloseTo(expectedTerm(CAKE, 1e3 * Math.pow(10, 2), multi), 6);
  });

  it('skips the beanstalk entirely when the jade bonus is locked', () => {
    const account = withAccount({ beanstalkUnlocked: false, beanstalkData: rankedAt(14, 3) });
    expect(bonusOf('Golden_Cake', withFood(), account)).toBe(0);
  });

  it('adds equipped and beanstalk contributions together', () => {
    const account = withAccount({ beanstalkData: rankedAt(14, 2) });
    const character = withFood([slot(CAKE, 10000)]);
    const multi = multiOf(character, account);

    const expected = expectedTerm(CAKE, 10000, multi) + expectedTerm(CAKE, 1e3 * Math.pow(10, 2), multi);
    expect(bonusOf('Golden_Cake', character, account)).toBeCloseTo(expected, 6);
  });

  it('leaves single-Effect foods behaving exactly as before', () => {
    const account = withAccount({ beanstalkData: rankedAt(6, 1) });
    const character = withFood([slot(HAM, 5000)]);
    const multi = multiOf(character, account);

    const expected = expectedTerm(HAM, 5000, multi) + expectedTerm(HAM, 1e3 * Math.pow(10, 1), multi);
    expect(bonusOf('Golden_Ham', character, account)).toBeCloseTo(expected, 6);
  });
});

describe('getGoldenFoodMulti - golden food cards', () => {
  // Game: min(4 * CardLv(cropfallEvent1), 50) + min(5 * CardLv(anni5Event1), 50). CardLv is
  // stars + 1, which is what calcCardBonus multiplies by.
  const cardSource = (cards) => getGoldenFoodMulti(baseCharacter, withAccount({ cards }), baseCharacters)
    .breakdown.categories
    .find(({ name }) => name === 'Additive').sources
    .find(({ name }) => name === 'Card').value;

  it('caps each card separately so the pair can reach 100', () => {
    // 4 * 20 = 80 -> 50, 5 * 20 = 100 -> 50. The old single cap on the sum returned 50 in total.
    expect(cardSource({
      Bort_The_Cornhusk: { bonus: 4, stars: 19, amount: 1 },
      IdleOn_5th_Anniversary: { bonus: 5, stars: 19, amount: 1 }
    })).toBe(100);
  });

  it('caps a single card at 50', () => {
    expect(cardSource({ Bort_The_Cornhusk: { bonus: 4, stars: 19, amount: 1 } })).toBe(50);
  });

  it('sums uncapped cards', () => {
    expect(cardSource({
      Bort_The_Cornhusk: { bonus: 4, stars: 1, amount: 1 },
      IdleOn_5th_Anniversary: { bonus: 5, stars: 2, amount: 1 }
    })).toBe(8 + 15);
  });

  it('ignores a card the account does not own', () => {
    expect(cardSource({ Bort_The_Cornhusk: { bonus: 4, stars: 0, amount: 0 } })).toBe(0);
  });

  it('treats missing cards as zero', () => {
    expect(cardSource({})).toBe(0);
  });
});
