import '../../polyfills';
import { describe, expect, it } from 'vitest';
import { parseEmpty, parseFixture } from '../helpers/parsed-fixtures';
import { getCards, calculateStars } from '@parsers/cards';
import { cauldronsIndexMapping, getLiquidCauldrons, liquidsIndex } from '@parsers/world-2/alchemy';
import { BOARD_SIZE } from '@parsers/world-3/constructionOptimizer';
import { getAnvilProductCatalog } from '@parsers/world-1/anvil';
import { anvilProducts, cards, constellations as constellationsCatalog, coralReef, equipmentSets, flagsReqs, generalSpelunky, invStorage, sigils } from '@website-data';
import { tryToParse } from '@utility/helpers';
import { isBundlePurchased } from '@parsers/misc';
import first from '../fixtures/first.json';
import second from '../fixtures/second.json';
import third from '../fixtures/third.json';
import fourth from '../fixtures/fourth.json';
import latest from '../fixtures/latest.json';

const FIXTURES = [['first', first], ['second', second], ['third', third], ['fourth', fourth], ['latest', latest]];


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

  it('reads a synthetic card amount by its raw name key, not position', () => {
    const anyCardName = Object.keys(cards)[5];
    const result = getCards({ Cards0: { [anyCardName]: 42 } }, {});
    expect(result[cards[anyCardName].displayName].amount).toBe(42);
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

describe('calculateStars ownership guard (fix round 1: newly-reachable unowned-card path)', () => {
  it('does not award five-star tier to an unowned card even if it is in the five-star list', () => {
    expect(calculateStars(5, 0, 'AnyCard', 4, true, false)).toBe(0);
  });

  it('does not award six-star tier to an unowned card even if it is in the six-star list', () => {
    expect(calculateStars(5, 0, 'AnyCard', 5, false, true)).toBe(0);
  });

  it('still awards the five/six-star tier to an owned card in the list (no behavior change for owners)', () => {
    expect(calculateStars(5, 1, 'AnyCard', 4, true, false)).toBe(5);
    expect(calculateStars(5, 1, 'AnyCard', 5, false, true)).toBe(6);
  });

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
    const days = accountOptions?.[381] ?? 0;
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
    expect(account.forge.list).toHaveLength(account.forge.upgrades[0].maxLevel);
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
  it('lists every colosseum arena at zero with no save', () => {
    const { account } = parseEmpty();
    expect(account.highscores.coloHighscores).toEqual([
      { name: 'dewdrop', score: 0 },
      { name: 'sandstone', score: 0 },
      { name: 'chillsnap', score: 0 },
      { name: 'astro', score: 0 },
      { name: 'molten', score: 0 },
      { name: 'whimsical', score: 0 }
    ]);
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

describe('alchemy cauldrons (catalog-driven: save-length loops -> cauldronsIndexMapping/liquidsIndex)', () => {
  const CAULDRON_NAMES = Object.values(cauldronsIndexMapping);
  const LIQUID_NAMES = Object.values(liquidsIndex);
  const BOOSTS = ['speed', 'luck', 'cost', 'extra'];

  it('renders every brewing cauldron and its boosts at zero with no save', () => {
    const { account } = parseEmpty();
    expect(Object.keys(account.alchemy.cauldrons)).toEqual(CAULDRON_NAMES);

    let assertions = 0;
    Object.values(account.alchemy.cauldrons).forEach((cauldron) => {
      expect(cauldron.progress).toBe(0);
      expect(cauldron.req).toBeGreaterThan(0);
      expect(Object.keys(cauldron.boosts)).toEqual(BOOSTS);
      Object.values(cauldron.boosts).forEach((boost) => {
        expect(boost.level).toBe(0);
        expect(boost.progress).toBe(0);
        expect(Number.isFinite(boost.req)).toBe(true);
        assertions++;
      });
    });
    expect(assertions).toBe(CAULDRON_NAMES.length * BOOSTS.length);
  });

  it('renders every pay-2-win cauldron and liquid upgrade at level 0 with no save', () => {
    const { account } = parseEmpty();
    expect(account.alchemy.p2w.cauldrons.map(({ name }) => name)).toEqual(CAULDRON_NAMES);
    expect(account.alchemy.p2w.liquids.map(({ name }) => name)).toEqual(LIQUID_NAMES);

    account.alchemy.p2w.cauldrons.forEach(({ speed, newBubble, boostReq }) => {
      [speed, newBubble, boostReq].forEach(({ level, cost, costToMax }) => {
        expect(level).toBe(0);
        expect(Number.isFinite(cost)).toBe(true);
        expect(Number.isFinite(costToMax)).toBe(true);
      });
    });
    account.alchemy.p2w.liquids.forEach(({ regen, capacity }) => {
      [regen, capacity].forEach(({ level, cost, costToMax }) => {
        expect(level).toBe(0);
        expect(Number.isFinite(cost)).toBe(true);
        expect(Number.isFinite(costToMax)).toBe(true);
      });
    });
  });

  it('renders the decant levels the liquid cards read as 0, not undefined, with no save', () => {
    const { account } = parseEmpty();
    expect(account.alchemy.liquidCauldrons).toHaveLength(LIQUID_NAMES.length);
    account.alchemy.liquidCauldrons.forEach(({ decantCap, decantRate }) => {
      [decantCap, decantRate].forEach(({ level, progress, req }) => {
        expect(level).toBe(0);
        expect(progress).toBe(0);
        expect(Number.isFinite(req)).toBe(true);
      });
    });
  });

  it.each(FIXTURES)('%s: every cauldron level still comes from the save at the same offset', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const { account } = parseFixture(fixture);
    const p2wRaw = tryToParse(data?.CauldronP2W) || data?.CauldronP2W || [];
    const [cauldronsRaw = [], liquidsRaw = []] = p2wRaw;

    let assertions = 0;
    account.alchemy.p2w.cauldrons.forEach(({ speed, newBubble, boostReq }, index) => {
      expect(speed.level).toBe(cauldronsRaw[index * 3] ?? 0);
      expect(newBubble.level).toBe(cauldronsRaw[index * 3 + 1] ?? 0);
      expect(boostReq.level).toBe(cauldronsRaw[index * 3 + 2] ?? 0);
      assertions += 3;
    });
    account.alchemy.p2w.liquids.forEach(({ regen, capacity }, index) => {
      expect(regen.level).toBe(liquidsRaw[index * 2] ?? 0);
      expect(capacity.level).toBe(liquidsRaw[index * 2 + 1] ?? 0);
      assertions += 2;
    });
    expect(assertions).toBe(CAULDRON_NAMES.length * 3 + LIQUID_NAMES.length * 2);
  });

  it.each(FIXTURES)('%s: brewing boost levels still match the save, and nothing is NaN', (_name, fixture) => {
    const { account } = parseFixture(fixture);
    const cauldronsInfo = account.alchemy.cauldronsInfo ?? [];

    let assertions = 0;
    Object.values(account.alchemy.cauldrons).forEach((cauldron, cauldronIndex) => {
      Object.values(cauldron.boosts).forEach((boost, boostIndex) => {
        const [progress, level] = cauldronsInfo[cauldronIndex * 4 + boostIndex] ?? [];
        expect(boost.progress).toBe(progress ?? 0);
        expect(boost.level).toBe(parseInt(level ?? 0));
        expect(Number.isFinite(boost.req)).toBe(true);
        assertions++;
      });
    });
    expect(assertions).toBe(CAULDRON_NAMES.length * BOOSTS.length);
  });
});

describe('alchemy sigils (catalog-driven: sigilsData.length loop -> sigils catalog)', () => {
  const UNDISCOVERED = -1;

  it('renders every catalog sigil as undiscovered with no save', () => {
    const { account } = parseEmpty();
    expect(account.alchemy.p2w.sigils).toHaveLength(sigils.length);
    expect(account.alchemy.p2w.sigils.map(({ name }) => name)).toEqual(sigils.map(({ name }) => name));

    account.alchemy.p2w.sigils.forEach((sigil, index) => {
      expect(sigil.unlocked).toBe(UNDISCOVERED);
      expect(sigil.progress).toBe(0);
      expect(sigil.bonus).toBe(0);
      expect(sigil.characters).toEqual([]);
      expect(sigil.index).toBe(index);
    });
  });

  it('counts no ethereal or eclectic sigils with no save', () => {
    const { account } = parseEmpty();
    expect(account.alchemy.p2w.totalEtherealSigils).toBe(0);
    expect(account.alchemy.p2w.totalEclecticSigils).toBe(0);
  });

  it.each(FIXTURES)('%s: every sigil still reads its own pair from the save at the same offset', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const { account } = parseFixture(fixture);
    const p2wRaw = tryToParse(data?.CauldronP2W) || data?.CauldronP2W || [];
    const sigilsRaw = p2wRaw?.[4] ?? [];

    let assertions = 0;
    account.alchemy.p2w.sigils.forEach((sigil, index) => {
      expect(sigil.progress).toBe(sigilsRaw[index * 2] ?? 0);
      expect(sigil.unlocked).toBe(sigilsRaw[index * 2 + 1] ?? UNDISCOVERED);
      expect(sigil.index).toBe(index);
      assertions++;
    });
    expect(assertions).toBe(sigils.length);
  });

  it.each(FIXTURES)('%s: the bonus each sigil reports still matches its unlock tier', (_name, fixture) => {
    const { account } = parseFixture(fixture);
    const tierBonus = { 0: 'unlockBonus', 1: 'boostBonus', 2: 'jadeBonus', 3: 'etherealBonus', 4: 'eclecticBonus' };

    let assertions = 0;
    let unlockedSigils = 0;
    account.alchemy.p2w.sigils.forEach((sigil) => {
      const expected = tierBonus[sigil.unlocked] ? sigil[tierBonus[sigil.unlocked]] : 0;
      expect(sigil.bonus).toBe(expected);
      if (sigil.unlocked > UNDISCOVERED) unlockedSigils++;
      assertions++;
    });
    expect(assertions).toBe(sigils.length);
    expect(unlockedSigils).toBeGreaterThan(0);
  });
});

describe('coral reef (catalog-driven: save-length loops -> coralReef catalog / fixed coral roster)', () => {
  const DANCING_CORAL_COUNT = generalSpelunky[22].length;

  it('renders every catalog reef upgrade at level 0 with no save', () => {
    const { account } = parseEmpty();
    expect(account.coralReef.reefUpgrades).toHaveLength(coralReef.length);
    account.coralReef.reefUpgrades.forEach((reef, index) => {
      expect(reef.index).toBe(index);
      expect(reef.level).toBe(0);
      expect(reef.x1).toBe(coralReef[index].x1);
      expect(reef.description).toBeTruthy();
      expect(Number.isFinite(reef.cost)).toBe(true);
    });
  });

  it('the coral catalog is the 9 the game ships, so the roster length is not pinned to a literal', () => {
    expect(generalSpelunky[22]).toHaveLength(9);
    expect(generalSpelunky[23]).toHaveLength(9);
    expect(DANCING_CORAL_COUNT).toBe(9);
  });

  it('renders the full dancing coral roster at level 0 with no save', () => {
    const { account } = parseEmpty();
    expect(account.coralReef.dancingCoral).toHaveLength(DANCING_CORAL_COUNT);
    account.coralReef.dancingCoral.forEach((coral, index) => {
      expect(coral.index).toBe(index);
      expect(coral.level).toBe(0);
      expect(coral.coralName).toBeTruthy();
      expect(Number.isFinite(coral.cost)).toBe(true);
    });
  });

  it('reports zero owned and unlocked corals with no save, not undefined', () => {
    const { account } = parseEmpty();
    expect(account.coralReef.ownedCorals).toBe(0);
    expect(account.coralReef.unlockedCorals).toBe(0);
  });

  it.each(FIXTURES)('%s: reef upgrade levels still come from the save at the same index', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const { account } = parseFixture(fixture);
    const rawSpelunking = tryToParse(data?.Spelunk) || {};
    const coralReefLevels = rawSpelunking?.[13] || [];

    let assertions = 0;
    account.coralReef.reefUpgrades.forEach((reef, index) => {
      expect(reef.level).toBe(coralReefLevels[index] ?? 0);
      expect(reef.name).toBe(coralReef[index].name);
      assertions++;
    });
    expect(assertions).toBe(coralReef.length);
  });

  it.each(FIXTURES)('%s: dancing coral levels still come from the tower save at the same offset', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const { account } = parseFixture(fixture);
    const rawTowerInfo = data?.TowerInfo || tryToParse(data?.Tower);
    const rawDancingCoral = rawTowerInfo?.slice(18) || [];

    let assertions = 0;
    account.coralReef.dancingCoral.forEach((coral, index) => {
      expect(coral.level).toBe(rawDancingCoral[index] || 0);
      assertions++;
    });
    expect(assertions).toBe(DANCING_CORAL_COUNT);
  });
});

describe('constellations (catalog-driven: constellationsRaw loop -> constellations catalog)', () => {
  const CATALOG = constellationsCatalog.filter(({ mapIndex }) => mapIndex != null);

  it('renders every catalog constellation as uncompleted with no save', () => {
    const { account } = parseEmpty();
    expect(account.constellations).toHaveLength(CATALOG.length);
    account.constellations.forEach((constellation, index) => {
      expect(constellation.name).toBe(CATALOG[index].name);
      expect(constellation.done).toBe(false);
      expect(constellation.completedChars).toBe('');
      expect(constellation.location).toBeTruthy();
      expect(constellation.requiredPlayers).toBe(CATALOG[index].requiredPlayers);
    });
    expect(account.rawConstellationsDone).toBe(0);
  });

  it('reports a nonzero total points pool with no save, so the page is not "0 / 0"', () => {
    const { account } = parseEmpty();
    const totalPoints = account.constellations.reduce((sum, { points }) => sum + points, 0);
    expect(totalPoints).toBe(CATALOG.reduce((sum, { points }) => sum + points, 0));
    expect(totalPoints).toBeGreaterThan(0);
  });

  it.each(FIXTURES)('%s: each constellation still reads its own save slot by rawIndex', (_name, fixture) => {
    const data = fixture.data ?? fixture;
    const { account } = parseFixture(fixture);
    const constellationsRaw = tryToParse(data?.SSprog) || data?.StarSignProg;

    let assertions = 0;
    let completed = 0;
    account.constellations.forEach((constellation, index) => {
      const catalogEntry = CATALOG[index];
      const [completedChars = '', done = 0] = constellationsRaw?.[catalogEntry.rawIndex ?? catalogEntry.mapIndex] ?? [];
      expect(constellation.completedChars).toBe(completedChars);
      expect(constellation.done).toBe(!!done);
      if (constellation.done) completed++;
      assertions++;
    });
    expect(assertions).toBe(CATALOG.length);
    expect(completed).toBeGreaterThan(0);
  });
});

describe('forge slots', () => {
  const forgeSlotCount = (account) => account.forge.list.length;

  it('renders every forge slot with no save, not an empty board', () => {
    const { account } = parseEmpty();
    const expected = account.forge.upgrades[0].maxLevel;
    expect(expected).toBeGreaterThan(0);
    expect(forgeSlotCount(account)).toBe(expected);
  });

  it('every slot with no save is empty rather than half-built', () => {
    const { account } = parseEmpty();
    let assertions = 0;
    account.forge.list.forEach(({ ore, barrel, bar }) => {
      for (const material of [ore, barrel, bar]) {
        expect(material.rawName).toBe('Blank');
        expect(Number.isFinite(material.quantity)).toBe(true);
        assertions++;
      }
    });
    expect(assertions).toBe(account.forge.list.length * 3);
  });

  it.each(FIXTURES)('%s: a real save still reports the same slot count', (_name, fixture) => {
    const { account } = parseFixture(fixture);
    expect(forgeSlotCount(account)).toBe(account.forge.upgrades[0].maxLevel);
  });

  it('a real save still reads its own ore quantities, slot for slot', () => {
    let assertions = 0;
    let nonZero = 0;
    for (const [, fixture] of FIXTURES) {
      const data = fixture.data ?? fixture;
      const quantities = tryToParse(data?.ForgeItemQuantity) || data?.ForgeItemQty;
      const { account } = parseFixture(fixture);
      account.forge.list.forEach(({ ore }, index) => {
        expect(ore.quantity).toBe(quantities?.[index * 3]);
        if (ore.quantity > 0) nonZero++;
        assertions++;
      });
    }
    expect(assertions).toBe(FIXTURES.length * 16);
    expect(nonZero).toBeGreaterThan(0);
  });
});

describe('anvil product catalog', () => {
  it('lists every anvil product with no save', () => {
    const catalog = getAnvilProductCatalog();
    expect(catalog.length).toBe(Object.keys(anvilProducts).length);
    expect(catalog.length).toBeGreaterThan(0);
  });

  it('resolves a display name, level requirement and cost for each product', () => {
    let assertions = 0;
    for (const { rawName, displayName, requiredAmount, levelReq, exp } of getAnvilProductCatalog()) {
      expect(rawName).toBeTruthy();
      expect(displayName).toBeTruthy();
      expect(displayName).not.toBe(rawName);
      expect(Number.isFinite(requiredAmount)).toBe(true);
      expect(Number.isFinite(levelReq)).toBe(true);
      expect(Number.isFinite(exp)).toBe(true);
      assertions++;
    }
    expect(assertions).toBe(Object.keys(anvilProducts).length);
  });
});

describe('storage', () => {
  it('has no items with no save - there is no catalog to fall back on', () => {
    const { account } = parseEmpty();
    expect(account.storage.list).toEqual([]);
  });

  it('still lists every storage chest with no save, because those ARE a catalog', () => {
    const { account } = parseEmpty();
    expect(account.storage.storageChests.length).toBe(Object.keys(invStorage).length);
    expect(account.storage.storageChests.length).toBeGreaterThan(0);
    for (const { unlocked } of account.storage.storageChests) expect(unlocked).toBe(false);
  });
});

describe('farming plot (no catalog: falls back to the game ceiling with no save)', () => {
  const MAX_PLOTS = 36;

  it('renders the full garden with no save instead of nothing', () => {
    const { account } = parseEmpty();
    expect(account.farming.plot).toHaveLength(MAX_PLOTS);
    account.farming.plot.forEach((plot, index) => {
      expect(plot.index).toBe(index);
      expect(plot.seed).toBeTruthy();
      expect(Number.isFinite(plot.rankRequirement)).toBe(true);
    });
  });

  it('a real save still maps its own plots, not the ceiling', () => {
    const counts = FIXTURES.map(([, fixture]) => parseFixture(fixture).account.farming?.plot?.length);
    counts.forEach((count) => expect(count).toBeGreaterThan(0));
    expect(counts.some((count) => count < MAX_PLOTS)).toBe(true);
  });
});
