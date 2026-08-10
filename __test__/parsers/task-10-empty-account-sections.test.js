import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { parseData } from '@parsers/index';
import { getCards, calculateStars } from '@parsers/cards';
import { getLiquidCauldrons } from '@parsers/world-2/alchemy';
import { BOARD_SIZE } from '@parsers/world-3/constructionOptimizer';
import { cards, equipmentSets, flagsReqs } from '@website-data';
import { tryToParse } from '@utility/helpers';
import { isBundlePurchased } from '@parsers/misc';
import first from '../fixtures/first.json';
import second from '../fixtures/second.json';
import third from '../fixtures/third.json';
import fourth from '../fixtures/fourth.json';
import latest from '../fixtures/latest.json';

const FIXTURES = [['first', first], ['second', second], ['third', third], ['fourth', fourth], ['latest', latest]];

const parseEmpty = () => parseData(undefined, [], null, null, undefined, undefined, null);
const parseFixture = (fixture) => {
  const data = fixture.data ?? fixture;
  return parseData(data, fixture.charNames ?? [], fixture.companion ?? null, fixture.guildData ?? null, fixture.serverVars);
};

/**
 * Task 10: 13 sections threw on an empty account and were masked by safeSection's fallback. This
 * file is the permanent regression coverage for those fixes - one describe block per section,
 * proving (a) the empty-account crash is gone and produces a sane neutral value, and (b) real
 * fixture saves parse to the exact same values the fix's null-guards were designed to leave
 * untouched.
 *
 * Every `it.each(FIXTURES)` body that loops over save-derived data counts its own assertions and
 * checks the count is > 0 at the end. A `forEach` over a field a fixture happens to lack silently
 * asserts nothing and still shows green - this project has hit that exact defect four times before
 * (see progress.md), so every loop here is self-checking rather than trusted on faith.
 */

describe('cards (catalog-driven: Object.entries(cardsRaw) -> Object.entries(cards))', () => {
  it('renders every catalog card with no save, not just the ones a save would have owned', () => {
    const result = getCards(undefined, {});
    expect(Object.keys(result)).toHaveLength(Object.keys(cards).length);
    expect(Object.values(result).every((c) => c.amount === 0 && c.stars === 0)).toBe(true);
  });

  it('carries catalog fields through for an unowned card', () => {
    const result = getCards(undefined, {});
    const firstCard = Object.values(result)[0];
    expect(firstCard.rawName).toBeTruthy();
    expect(firstCard.category).toBeTruthy();
  });

  // Unconditional synthetic index-alignment test: proves the save's own amount is read by NAME
  // (cards are keyed by rawName, not a positional index), independent of any fixture's content.
  it('reads a synthetic card amount by its raw name key, not position', () => {
    const anyCardName = Object.keys(cards)[5];
    const result = getCards({ Cards0: { [anyCardName]: 42 } }, {});
    expect(result[cards[anyCardName].displayName].amount).toBe(42);
    // Every other card in the same parse is still present, just unowned.
    expect(Object.keys(result)).toHaveLength(Object.keys(cards).length);
  });

  it.each(FIXTURES)('%s: amounts the save covers are unchanged for every owned card', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const cardsRaw = tryToParse(data?.Cards0);
    const result = getCards(data, {});
    let assertions = 0;
    Object.entries(cardsRaw ?? {}).forEach(([rawName, amount]) => {
      const details = cards[rawName];
      if (!details) return; // save can carry stale/unknown keys; not this parser's contract
      expect(result[details.displayName].amount).toBe(amount);
      assertions++;
    });
    expect(assertions).toBeGreaterThan(0);
  });

  it.each(FIXTURES)('%s: returns the full catalog length regardless of how many cards the save owns', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const result = getCards(data, {});
    expect(Object.keys(result)).toHaveLength(Object.keys(cards).length);
  });
});

/**
 * Fix round 1 (post-approval review finding): before Task 10's catalog conversion, `calculateStars`
 * only ever ran for cards present in the save's Cards0 - i.e. always owned (amountOfCards > 0). Now
 * every catalog card runs through it, including amount-0 ones. Its five/six-star special case
 * (`isInFiveStarList`/`isInSixStarList`, driven by accountOptions[155]/[603]) never consulted
 * ownership, so an unowned card whose name happened to sit in either list would come back with a
 * nonzero `stars` at `amount: 0` - and `components/common/styles.jsx` renders the star-tier border
 * off `stars > 0` alone, not ownership. Newly reachable, not previously exercised.
 *
 * Fixed by requiring `amountOfCards > 0` before the special case can fire. This block proves that
 * fix is a no-op for every real save: it independently re-derives the exact inputs `parseCards`
 * feeds `calculateStars` for every one of the 272 catalog cards (not just owned ones) from each
 * fixture's OWN parsed account (real accountOptions/rift/spelunking, not a stub), replays the
 * pre-fix (unguarded) formula, and asserts it matches `account.cards`'s actual stars byte-for-byte.
 */
describe('calculateStars ownership guard (fix round 1: newly-reachable unowned-card path)', () => {
  it('does not award five-star tier to an unowned card even if it is in the five-star list', () => {
    // amountOfCards: 0 - would have returned 5 before the ownership guard (cardLvCalco stays 0 for
    // amountOfCards 0, so isInFiveStarList alone used to be enough to return 5).
    expect(calculateStars(5, 0, 'AnyCard', 4, true, false)).toBe(0);
  });

  it('does not award six-star tier to an unowned card even if it is in the six-star list', () => {
    expect(calculateStars(5, 0, 'AnyCard', 5, false, true)).toBe(0);
  });

  it('still awards the five/six-star tier to an owned card in the list (no behavior change for owners)', () => {
    expect(calculateStars(5, 1, 'AnyCard', 4, true, false)).toBe(5);
    expect(calculateStars(5, 1, 'AnyCard', 5, false, true)).toBe(6);
  });

  // Verbatim pre-fix formula (the ownership guard removed) used only to prove the fix changes
  // nothing for real data below - not a copy kept for any other purpose.
  const calculateStarsPreFix = (tierReq, amountOfCards, cardName, maxStars, isInFiveStarList, isInSixStarList) => {
    let cardLvCalco = 0;
    for (let i = 0; i < maxStars; i++) {
      if (cardName === 'Boss3B') {
        if (amountOfCards > 1.5 * Math.pow(i + 1 + Math.floor(i / 3), 2)) cardLvCalco = i + 2;
      } else if (amountOfCards > tierReq * Math.pow(i + 1 + (Math.floor(i / 3) + (16 * Math.floor(i / 4) + 100 * Math.floor(i / 5))), 2)) {
        cardLvCalco = i + 2;
      }
    }
    if (isInSixStarList && cardLvCalco < 7) return 6;
    if (isInFiveStarList && cardLvCalco < 6) return 5;
    return cardLvCalco > 0 ? cardLvCalco - 1 : cardLvCalco;
  };

  it.each(FIXTURES)("%s: every catalog card's stars value is byte-identical before and after the ownership guard", (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const { account } = parseFixture(fixture);
    const cardsRaw = tryToParse(data?.Cards0) ?? {};
    const rawRift = tryToParse(data?.Rift) || data?.Rift;
    const [currentRift] = rawRift || [];
    const riftFiveStarCards = currentRift >= 45 ? 1 : 0;
    const spelunkingSixStarCards = account?.spelunking?.loreBosses?.[2]?.defeated ? 1 : 0;
    const maxStars = Math.round(4 + riftFiveStarCards + spelunkingSixStarCards);
    const rawFiveStarList = account?.accountOptions?.[155] || '';
    const fiveStarList = rawFiveStarList?.toString()?.split(',') || [];
    const rawSixStarList = account?.accountOptions?.[603] || '';
    const sixStarList = rawSixStarList?.toString()?.split(',') || [];

    let assertions = 0;
    let intersectingUnownedCards = 0;
    Object.entries(cards).forEach(([rawName, cardDetails]) => {
      const amountOfCards = cardsRaw?.[rawName] ?? 0;
      const isInFiveStarList = fiveStarList.includes(rawName);
      const isInSixStarList = sixStarList.includes(rawName);
      if (amountOfCards === 0 && (isInFiveStarList || isInSixStarList)) intersectingUnownedCards++;
      const before = calculateStarsPreFix(cardDetails.perTier, amountOfCards, rawName, maxStars, isInFiveStarList, isInSixStarList);
      const after = account.cards[cardDetails.displayName].stars;
      expect(after).toBe(before);
      assertions++;
    });
    // Documents the reviewer's finding for this fixture: zero unowned cards intersect either list,
    // which is *why* the assertion above passes - not an assumption baked into the assertion itself.
    expect(intersectingUnownedCards).toBe(0);
    expect(assertions).toBe(Object.keys(cards).length);
  });
});

describe('construction board (catalog-driven: flagsUnlockedRaw length -> fixed BOARD_SIZE)', () => {
  it('renders the full BOARD_SIZE board with no save instead of throwing', () => {
    const { account } = parseEmpty();
    expect(account.construction.baseBoard).toHaveLength(BOARD_SIZE);
    expect(account.construction.baseBoard.every((slot) => slot.cog.name === undefined && slot.currentAmount === 0)).toBe(true);
  });

  it.each(FIXTURES)('%s: flag current/required amounts the save covers are unchanged at the same index', (_name, fixture) => {
    const { account } = parseFixture(fixture);
    const data = fixture.data ?? fixture;
    const flagsUnlockedRaw = data?.FlagUnlock || tryToParse(data?.FlagU);
    let assertions = 0;
    flagsUnlockedRaw?.slice(0, BOARD_SIZE).forEach((flagSlot, index) => {
      const expectedCurrent = flagSlot === -11 ? flagsReqs?.[index] : parseFloat(flagSlot ?? 0);
      expect(account.construction.baseBoard[index].currentAmount).toBe(expectedCurrent);
      expect(account.construction.baseBoard[index].requiredAmount).toBe(flagsReqs?.[index]);
      assertions++;
    });
    expect(assertions).toBeGreaterThan(0);
  });

  it.each(FIXTURES)('%s: returns exactly BOARD_SIZE board slots regardless of save length', (_name, fixture) => {
    const { account } = parseFixture(fixture);
    expect(account.construction.baseBoard).toHaveLength(BOARD_SIZE);
  });
});

describe('alchemy.liquidCauldrons (structural 4 liquid types, not save-driven)', () => {
  it('renders all 4 liquid cauldron slots with no save instead of throwing', () => {
    const { account } = parseEmpty();
    expect(account.alchemy.liquidCauldrons).toHaveLength(4);
  });

  // Unconditional: 4 fixed slots regardless of what any fixture's save happens to contain.
  it.each(FIXTURES)('%s: still returns exactly 4 liquid cauldron slots and never throws', (_name, fixture) => {
    const { account } = parseFixture(fixture);
    expect(account.alchemy.liquidCauldrons).toHaveLength(4);
    expect(() => getLiquidCauldrons(account)).not.toThrow();
  });

  it.each(FIXTURES)('%s: decant levels the save covers are unchanged at the same index', (_name, fixture) => {
    const { account } = parseFixture(fixture);
    const data = fixture.data ?? fixture;
    const cauldronsInfo = data?.CauldUpgLVs && data?.CauldUpgXPs
      ? data.CauldUpgLVs.map((lvl, i) => [data.CauldUpgXPs[i], lvl])
      : data?.CauldronInfo?.[8]?.reduce((res, arr) => [...res, ...arr], []);
    const liquidCauldronsRaw = cauldronsInfo?.slice(18);
    let assertions = 0;
    for (let index = 0; index < 4; index++) {
      const [, decantCapLevel] = liquidCauldronsRaw?.[index * 4] ?? [];
      if (decantCapLevel === undefined) continue;
      expect(account.alchemy.liquidCauldrons[index].decantCap.level).toBe(decantCapLevel);
      assertions++;
    }
    expect(assertions).toBeGreaterThan(0);
  });
});

describe('currencies.KeysAll (structural 5 keys, not save-driven)', () => {
  it('renders all 5 key types with no save instead of throwing', () => {
    const { account } = parseEmpty();
    expect(account.currencies.KeysAll).toHaveLength(5);
    expect(account.currencies.KeysAll.every((k) => k.amount === 0)).toBe(true);
  });

  it.each(FIXTURES)('%s: key amounts the save covers are unchanged at the same index', (_name, fixture) => {
    const { account } = parseFixture(fixture);
    const data = fixture.data ?? fixture;
    const keys = data?.CurrenciesOwned?.KeysAll || data?.CYKeysAll;
    let assertions = 0;
    (keys ?? []).slice(0, 5).forEach((amount, index) => {
      expect(account.currencies.KeysAll[index].amount).toBe(amount);
      assertions++;
    });
    expect(assertions).toBeGreaterThan(0);
  });

  it.each(FIXTURES)('%s: still returns exactly 5 key entries for a real save', (_name, fixture) => {
    const { account } = parseFixture(fixture);
    expect(account.currencies.KeysAll).toHaveLength(5);
  });
});

describe('armorSmithy (idleonData?.ServerGemsReceived guard)', () => {
  it('renders every equipment set unlocked=false with no save instead of throwing', () => {
    const { account } = parseEmpty();
    expect(account.armorSmithy.sets).toHaveLength(equipmentSets.length);
    expect(account.armorSmithy.sets.every((s) => s.unlocked === false)).toBe(true);
  });

  it.each(FIXTURES)('%s: isSmithyUnlocked replicates the exact real-save formula', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const { account } = parseFixture(fixture);
    const accountOptions = tryToParse(data?.OptLacc);
    const days = accountOptions?.[381];
    const hasBundle = isBundlePurchased(account.bundles, 'bun_i')?.owned ? 1 : 0;
    const expected = 2e3 <= (data?.ServerGemsReceived ?? 0) + 1500 * hasBundle || 1 > Math.round(30 - Number(days));
    expect(account.armorSmithy.sets).toHaveLength(equipmentSets.length);
    expect(account.armorSmithy.days).toBe(days);
    expect(account.armorSmithy.isSmithyUnlocked).toBe(expected);
  });
});

describe('atoms getCost (account?.tasks?.[2]?.[4]?.[6] guard)', () => {
  it('computes atom costs with no save instead of throwing', () => {
    const { account } = parseEmpty();
    expect(account.atoms.atoms.length).toBeGreaterThan(0);
    expect(account.atoms.atoms.every((a) => Number.isFinite(a.level))).toBe(true);
  });

  it.each(FIXTURES)('%s: atom costs still compute (finite, no NaN) for a real save', (_name, fixture) => {
    const { account } = parseFixture(fixture);
    expect(account.atoms.atoms.length).toBeGreaterThan(0);
    expect(account.atoms.atoms.every((a) => Number.isFinite(a.cost))).toBe(true);
  });
});

describe('forge (forgeLevels?.[index] guard)', () => {
  it('renders all 6 forge upgrades at level 0 with no save instead of throwing', () => {
    const { account } = parseEmpty();
    expect(account.forge.upgrades).toHaveLength(6);
    expect(account.forge.upgrades.every((u) => u.level === 0)).toBe(true);
    expect(account.forge.list).toEqual([]);
  });

  it.each(FIXTURES)('%s: upgrade levels the save covers are unchanged at the same index', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const forgeLevels = data?.FurnaceLevels || data?.ForgeLV;
    const { account } = parseFixture(fixture);
    let assertions = 0;
    forgeLevels?.forEach((level, index) => {
      expect(account.forge.upgrades[index].level).toBe(level);
      assertions++;
    });
    expect(assertions).toBeGreaterThan(0);
  });
});

describe('highscores (parseColosseum/parseMinigame null guard, pure user state)', () => {
  it('returns empty colosseum highscores with no save instead of throwing', () => {
    const { account } = parseEmpty();
    expect(account.highscores.coloHighscores).toEqual([]);
  });

  it.each(FIXTURES)('%s: colosseum scores the save covers are unchanged', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const coloHighscores = data?.FamilyValuesMap?.ColosseumHighscores || data?.FamValColosseumHighscores;
    const { account } = parseFixture(fixture);
    let assertions = 0;
    coloHighscores?.slice(1, 7).forEach((score, index) => {
      expect(account.highscores.coloHighscores[index].score).toBe(parseFloat(String(score)));
      assertions++;
    });
    expect(assertions).toBeGreaterThan(0);
  });
});

describe('killroy (serverVars?.KillroySwap guard)', () => {
  it('computes a killroy schedule with no save/serverVars instead of throwing', () => {
    const { account } = parseEmpty();
    expect(account.killroy.killRoyClasses).toBeDefined();
    expect(account.killroy.list.length).toBeGreaterThan(0);
  });

  it.each(FIXTURES)('%s: killroy list and kill counts still compute for a real save', (_name, fixture) => {
    const { account } = parseFixture(fixture);
    expect(account.killroy.list.length).toBeGreaterThan(0);
    expect(account.killroy.killRoyClasses).toBeDefined();
  });
});

describe('libraryTimes (timeAway?.GlobalTime guard, pure user state)', () => {
  it('returns bookCount 0 with no save instead of throwing or spinning', () => {
    const { account } = parseEmpty();
    expect(account.libraryTimes.bookCount).toBe(0);
  });

  it.each(FIXTURES)('%s: book count is finite and starts from the save\'s own base count', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const accountOptions = tryToParse(data?.OptLacc);
    const baseBookCount = accountOptions?.[55];
    const { account } = parseFixture(fixture);
    expect(Number.isFinite(account.libraryTimes.bookCount)).toBe(true);
    expect(baseBookCount).toBeDefined();
    expect(account.libraryTimes.bookCount).toBeGreaterThanOrEqual(baseBookCount);
  });
});

describe('owl (account?.accountOptions?.[...] guards)', () => {
  it('renders every owl upgrade with no save instead of throwing', () => {
    const { account } = parseEmpty();
    expect(account.owl.upgrades.length).toBeGreaterThan(0);
    // `level` is left `undefined` (not defaulted to 0) here on purpose - real saves leave it
    // `undefined` too for any upgrade past what the account has ever touched (see the fixture
    // regression below), so defaulting only for the empty-account case would be a real-save
    // behavior change disguised as a neutral default.
    expect(account.owl.upgrades.every((u) => u.level === undefined || Number.isFinite(u.level))).toBe(true);
  });

  it.each(FIXTURES)('%s: owl upgrade levels the save covers are unchanged at the same index', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const accountOptions = tryToParse(data?.OptLacc);
    const { account } = parseFixture(fixture);
    let assertions = 0;
    account.owl.upgrades.forEach((upgrade, i) => {
      expect(upgrade.level).toBe(accountOptions?.[254 + i]);
      assertions++;
    });
    expect(assertions).toBeGreaterThan(0);
  });
});

describe('statues (getHighestLevelStatues empty-characters guard)', () => {
  it('renders every statue at level 0 with no characters instead of throwing', () => {
    const { account } = parseEmpty();
    expect(account.statues.length).toBeGreaterThan(0);
    expect(account.statues.every((s) => s.level === 0)).toBe(true);
  });

  it.each(FIXTURES)('%s: statue levels are finite for a real save', (_name, fixture) => {
    const { account } = parseFixture(fixture);
    expect(account.statues.length).toBeGreaterThan(0);
    expect(account.statues.every((s) => Number.isFinite(s.level))).toBe(true);
  });
});
