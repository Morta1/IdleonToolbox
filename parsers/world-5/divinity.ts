import { isCompanionBonusActive } from '@parsers/misc';
import { getActiveBubbleBonus, isPrismaBubble } from '@parsers/world-2/alchemy';
import { getPrismaMulti } from '@parsers/class-specific/tesseract';
import { isJadeBonusUnlocked } from '@parsers/world-6/sneaking';
import { getCoralKidUpgBonus } from '@parsers/world-7/coralReef';
import { getMineheadBonusQTY } from '@parsers/world-7/minehead';
import { getJellyBonus } from '@parsers/world-7/jellyOperator';
import { getUpgradeVaultBonus } from '@parsers/misc/upgradeVault';
import { cosmoUpgrades, gods } from '@website-data';
import { growth, tryToParse } from '@utility/helpers';

export const getDivinity = (idleonData: any, serializedCharactersData: any, accountData: any) => {
  const divinityRaw = tryToParse(idleonData?.Divinity) || idleonData?.Divinity;
  return { ...parseDivinity(divinityRaw || [], serializedCharactersData, accountData), unlocked: !!divinityRaw };
}

const parseDivinity = (divinityRaw: any, serializedCharactersData: any, accountData: any) => {
  const numberOfChars = serializedCharactersData?.length;
  const deitiesStartIndex = 12;
  const linkedDeities = divinityRaw?.slice(deitiesStartIndex, deitiesStartIndex + numberOfChars);
  const blessingLevelsStartIndex = 28;
  const blessingLevels = divinityRaw?.slice(blessingLevelsStartIndex, blessingLevelsStartIndex + gods?.length + 1);
  const linkedStyles = divinityRaw?.slice(0, serializedCharactersData?.length + 1);
  const unlockedDeities = divinityRaw?.[25] ?? 0;
  const godRank = unlockedDeities - 10;
  const coralKidBonus = getCoralKidUpgBonus(accountData, 1);
  const deities = gods?.map((god, index) => {
      const level = blessingLevels?.[index] ?? 0;
      let emporiumBonus = 1;
      if (isJadeBonusUnlocked(accountData, 'True_Godly_Blessings')) {
        emporiumBonus = (1 + 0.05 * Math.max(0, godRank));
      }
      let blessingBonus = level * god?.blessingMultiplier * emporiumBonus;
      if (index === 2) {
        blessingBonus = Math.min(blessingBonus, 500);
      }
      return {
        ...god,
        rawName: `DivGod${index}`,
        level,
        blessingBonus,
        unlocked: index < unlockedDeities,
        maxLevel: Math.round(100 + (coralKidBonus + (getMineheadBonusQTY(accountData, 9) + (getUpgradeVaultBonus(accountData?.upgradeVault?.upgrades, 76)
          + (getJellyBonus(accountData, 49) + getJellyBonus(accountData, 63))))))
      }
    }
  );

  return {
    linkedDeities,
    linkedStyles,
    deities,
    blessingLevels,
    unlockedDeities,
    godRank: godRank < 0 ? 0 : godRank,
    divinityPoints: Number(divinityRaw?.[24]) || 0
  }
}

export const getDivStylePerHour = (index: any) => {
  return 0 === index ? 1 : 1 === index ? 2 : 2 === index || 3 === index
    ? 1 : 4 === index ? 7 : 5 === index ? 3 : 6 === index
      ? 8 : 7 === index && 10
}

export const applyGodCost = (accountData: any) => {
  return accountData?.divinity?.deities?.map((god: any, index: any) => ({
    ...god,
    cost: getGodCost(god, index, accountData)
  }))
}

const getCostToMax = (level: any, x4: any, x5: any, maxLevel = 100) => {
  let total = 0;
  for (let i = level; i < maxLevel; i++) {
    total += (x4 * Math.pow(x5, i));
  }
  return total;
}

const getGodCost = ({ name, level, x4, x5, maxLevel = 100 }: any = {}, index: any, account: any) => {
  if (level < maxLevel) {
    const cost = x4 * Math.pow(x5, level);
    const nextLevelCost = x4 * Math.pow(x5, level + 1);
    const costToMax = getCostToMax(level, x4, x5, maxLevel);
    if (0 === index || 8 === index || 4 === index || 2 === index) {
      const atoms = account?.gaming?.bits;
      return {
        type: 'bits',
        cost,
        nextLevelCost,
        costToMax,
        currency: atoms
      }
    } else if (1 === index) {
      const sailingGold = account?.sailing?.lootPile?.[0];
      return {
        type: 'sailingGold',
        cost,
        nextLevelCost,
        costToMax,
        currency: sailingGold
      }
    } else if (3 === index || 6 === index) {
      const money = account?.currencies?.rawMoney;
      return {
        type: 'coins',
        cost,
        nextLevelCost,
        costToMax,
        currency: money
      }
    } else {
      const particles = account?.atoms?.particles;
      return {
        type: 'particles',
        cost,
        nextLevelCost,
        costToMax,
        currency: particles
      }
    }
  }
  return {
    cost: 'MAX'
  }
}

export const getGodBlessingBonus = (gods: any, godName: any) => {
  return gods?.find(({ name }: any) => name === godName)?.blessingBonus ?? 0;
}

export const getMinorDivinityBonus = (character: any, account: any, godSlot?: any, characters?: any) => {
  const bigPCharacter = characters?.find((char: any) => char.equippedBubbles?.find(({ bubbleName }: any) => bubbleName === 'BIG_P'));
  const bigPBubble = getActiveBubbleBonus((bigPCharacter || character || characters?.[0])?.equippedBubbles, 'BIG_P', account);
  const divinityLevel = (character || bigPCharacter || characters?.[0])?.skillsInfo?.divinity?.level ?? 0;
  const linkedDeity = godSlot ?? account?.divinity?.linkedDeities?.[character.playerId];
  return getMinorDivinityBonusValue({
    divinityLevel,
    bigPBubble,
    multiplier: getGodMinorBonusMultiplier(linkedDeity),
    coralKidUpgBonus: getCoralKidUpgBonus(account, 3)
  });
}

export interface MinorDivinityInputs {
  divinityLevel: number;
  bigPBubble: number;
  multiplier: number;
  coralKidUpgBonus: number;
}

// A god's slot is its position in the gods list: every link the save stores is one, and every helper
// here takes one except isMajorDivinityActive. The game's Divinity("Bonus_Minor"/"Bonus_MAJOR", p, i)
// takes the god's index (GodsInfo[slot][13]) instead, so a number copied from the game into a slot
// helper reads a different god. Name the god from these maps; divinity-breakpoints.test pins them.
export const GOD_SLOT = {
  Snehebatu: 0, Arctis: 1, Nobisect: 2, Harriep: 3, Goharut: 4,
  Omniphau: 5, Purrmep: 6, Flutterbis: 7, Kattlekruk: 8, Bagur: 9
} as const;

export const GOD_INDEX = {
  Snehebatu: 0, Arctis: 2, Nobisect: 7, Harriep: 3, Goharut: 5,
  Omniphau: 4, Purrmep: 6, Flutterbis: 1, Kattlekruk: 8, Bagur: 9
} as const;

// Every link the save stores is a god slot, while the minorBonusMultiplier column is in godIndex
// order, so the multiplier for a slot always comes out of a second lookup.
export const getGodMinorBonusMultiplier = (godSlot: any) => {
  const godIndex = (gods as any)?.[godSlot]?.godIndex;
  return (gods as any)?.[godIndex]?.minorBonusMultiplier ?? 0;
}

const divinityFactor = (divinityLevel: number) => divinityLevel > 0 ? divinityLevel / (60 + divinityLevel) : 0;

const minorBonusFrom = (factor: number, { bigPBubble, multiplier, coralKidUpgBonus }: Omit<MinorDivinityInputs, 'divinityLevel'>) =>
  Math.max(1, Number(bigPBubble) || 0) * (1 + (Number(coralKidUpgBonus) || 0) / 100) * factor * (Number(multiplier) || 0);

export const getMinorDivinityBonusValue = ({ divinityLevel, ...rest }: MinorDivinityInputs) =>
  minorBonusFrom(divinityFactor(Number(divinityLevel) || 0), rest);

// What the bonus converges to as divinity level grows, since divinityLevel / (60 + divinityLevel)
// never reaches 1.
export const getMinorDivinityBonusCap = (inputs: Omit<MinorDivinityInputs, 'divinityLevel'>) => minorBonusFrom(1, inputs);

export const getBigPBubbleShape = (account: any) => {
  const bubble = account?.alchemy?.bubblesFlat?.find(({ bubbleName }: any) => bubbleName === 'BIG_P');
  // CauldronStats("BubbleBonus") multiplies Math.max(1, PrismaBonusMult) into every prisma'd
  // bubble, active ones included, so the minor-link formula sees the multiplied value.
  const prismaMultiplier = isPrismaBubble(account, bubble?.bubbleIndex)
    ? Math.max(1, getPrismaMulti(account)?.value ?? 1)
    : 1;
  return {
    level: Number(bubble?.level) || 0,
    x1: Number(bubble?.x1) || 0.5,
    x2: Number(bubble?.x2) || 60,
    prismaMultiplier
  };
}

export const getBigPBubbleBonus = (level: number, x1 = 0.5, x2 = 60, prismaMultiplier = 1) =>
  Math.max(1, prismaMultiplier) * (growth('decayMulti', Number(level) || 0, x1, x2, false) ?? 1);

// Arctis hands out Math.ceil(bonus) talent levels, so a target of +40 needs the bonus to clear 39,
// not to reach 40. Every solver below is written the same way: smallest whole level whose bonus is
// strictly above the threshold passed in.
const smallestLevelAbove = (closedForm: number, threshold: number, valueAt: (level: number) => number) => {
  if (!isFinite(closedForm)) return null;
  let level = Math.max(0, Math.ceil(closedForm));
  // The closed form solves for equality, and its ceiling can land back on the threshold, so step up
  // until the level actually clears it.
  for (let i = 0; i < 4 && valueAt(level) <= threshold; i++) level++;
  return valueAt(level) > threshold ? level : null;
}

// null means the target is out of reach for that knob alone, with the other two left as they are.
// Any divinityLevel passed in is ignored, since that is the one being solved for.
export const getRequiredDivinityLevel = ({ targetBonus, bigPBubble, multiplier, coralKidUpgBonus }: Omit<MinorDivinityInputs, 'divinityLevel'> & { targetBonus: number }) => {
  const inputs = { bigPBubble, multiplier, coralKidUpgBonus };
  const cap = getMinorDivinityBonusCap(inputs);
  if (!(targetBonus < cap)) return null;
  return smallestLevelAbove((60 * targetBonus) / (cap - targetBonus), targetBonus,
    (divinityLevel) => getMinorDivinityBonusValue({ divinityLevel, ...inputs }));
}

export const getRequiredBigPLevel = ({ targetBonus, divinityLevel, multiplier, coralKidUpgBonus, x1 = 0.5, x2 = 60, prismaMultiplier = 1 }: Omit<MinorDivinityInputs, 'bigPBubble'> & {
  targetBonus: number,
  x1?: number,
  x2?: number,
  prismaMultiplier?: number
}) => {
  const prisma = Math.max(1, prismaMultiplier);
  const base = getMinorDivinityBonusValue({ divinityLevel, bigPBubble: prisma, multiplier, coralKidUpgBonus });
  if (base <= 0) return null;
  // The bubble is a decayMulti, so beyond its level-0 value it can never multiply by more than
  // 1 + x1, prisma'd or not.
  const needed = targetBonus / base - 1;
  if (needed >= x1) return null;
  const closedForm = needed <= 0 ? 0 : (x2 * needed) / (x1 - needed);
  return smallestLevelAbove(closedForm, targetBonus, (level) => getMinorDivinityBonusValue({
    divinityLevel,
    bigPBubble: getBigPBubbleBonus(level, x1, x2, prisma),
    multiplier,
    coralKidUpgBonus
  }));
}

export const getRequiredCoralKidLevel = ({ targetBonus, divinityLevel, bigPBubble, multiplier }: Omit<MinorDivinityInputs, 'coralKidUpgBonus'> & { targetBonus: number }) => {
  const base = getMinorDivinityBonusValue({ divinityLevel, bigPBubble, multiplier, coralKidUpgBonus: 0 });
  if (base <= 0) return null;
  return smallestLevelAbove(100 * (targetBonus / base - 1), targetBonus, (level) => getMinorDivinityBonusValue({
    divinityLevel,
    bigPBubble,
    multiplier,
    // Coral Kid upgrade 3 rounds its level into a flat percent.
    coralKidUpgBonus: Math.round(level)
  }));
}

// The floor no amount of divinity or bubble levels can get under: both maxed, only Coral Kid left.
export const getMinCoralKidLevel = ({ targetBonus, multiplier, x1 = 0.5, prismaMultiplier = 1 }: { targetBonus: number, multiplier: number, x1?: number, prismaMultiplier?: number }) => {
  const maxBubble = Math.max(1, prismaMultiplier) * (1 + x1);
  const base = minorBonusFrom(1, { bigPBubble: maxBubble, multiplier, coralKidUpgBonus: 0 });
  if (base <= 0) return null;
  return smallestLevelAbove(100 * (targetBonus / base - 1), targetBonus, (level) => minorBonusFrom(1, {
    bigPBubble: maxBubble,
    multiplier,
    coralKidUpgBonus: Math.round(level)
  }));
}

// Holes("PocketDivOwned", i, 0). The two pocket divinity spots live in Holes[11][29] and [11][30]
// and hold god slots, not god indices. How many of them count is Holes("CosmoBonusQTY", 2, 0).
// game: "PocketDivOwned"
const isPocketDivinityOwned = (account: any, godIndex: number) => {
  const holesObject = account?.hole?.holesObject;
  const cosmoUpgrade = Number((cosmoUpgrades as any)?.[2]?.[0]?.x0) || 0;
  const unlockedSpots = Math.floor(cosmoUpgrade * (Number(holesObject?.idleonMajiks?.[0]) || 0));
  const first = Number((gods as any)?.[Number(holesObject?.extraCalculations?.[29])]?.godIndex);
  const second = Number((gods as any)?.[Number(holesObject?.extraCalculations?.[30])]?.godIndex);
  return (first === godIndex && unlockedSpots > 0) || (second === godIndex && unlockedSpots > 1);
}

// Divinity("W7divChosen", 0, 0). OptionsListAccount[425] is a 1-based god slot, 0 meaning nobody
// has been chosen yet.
// game: "W7divChosen"
export const getW7ChosenGodIndex = (account: any) => {
  const chosen = Number(account?.accountOptions?.[425]) || 0;
  if (chosen <= 0) return -1;
  return Number((gods as any)?.[Math.max(0, chosen - 1)]?.godIndex);
}

// Divinity("Bonus_MAJOR", playerIndex, godIndex), which decides whether a character gets a god's
// major bonus. `godIndex` is the god's bonus id (the GodsInfo[..][13] column), while every link the
// save stores is a god slot, so each comparison goes through gods[slot].godIndex.
// Purrmep and Kattlekruk pay theirs account wide while any character is directly linked to them: the
// game reads flags (GenINFO[87] and [210]) it sets from every link at load, polytheism not included.
// game: "Bonus_MAJOR"
export const isMajorDivinityActive = (character: any, account: any, godIndex: number) => {
  if (isGodGrantedToEveryone(character, account, godIndex) || getW7ChosenGodIndex(account) === godIndex) return true;
  if (godIndex === GOD_INDEX.Purrmep || godIndex === GOD_INDEX.Kattlekruk) {
    return (account?.divinity?.linkedDeities ?? []).some((slot: any) => slot >= 0 && Number((gods as any)?.[slot]?.godIndex) === godIndex);
  }
  return getLinkedGodSlot(character, account, godIndex) !== -1;
}

// Divinity("Bonus_Minor", playerIndex, godIndex): the god's minor bonus for one character, 0 when the
// character doesn't get it. Unlike the major bonus, Coral Kid's chosen god plays no part here.
// game: "Bonus_Minor"
export const getCharacterMinorDivinityBonus = (character: any, account: any, godIndex: number, characters?: any) => {
  const slot = isGodGrantedToEveryone(character, account, godIndex)
    ? getGodSlotOf(godIndex)
    : getLinkedGodSlot(character, account, godIndex);
  return slot === -1 ? 0 : getMinorDivinityBonus(character, account, slot, characters);
}

// Divinity("Bonus_Minor", -1, godIndex): the minor bonus summed over every character linked to the
// god. Only for Harriep and Goharut do King Doot, a pocket divinity or Coral Kid hand it to everyone,
// and Coral Kid counts when OptionsListAccount[425] is godIndex + 1, although 425 is a 1-based slot
// everywhere else (getW7ChosenGodIndex): for Goharut that is choosing Omniphau. The game has it that
// way. Polytheism links, grid square 173 and gem shop item 9 don't count here.
// game: "Bonus_Minor"
export const getAccountMinorDivinityBonus = (account: any, characters: any, godIndex: number) => {
  const toEveryone = (godIndex === GOD_INDEX.Harriep || godIndex === GOD_INDEX.Goharut)
    && ((characters ?? []).some((character: any) => isKingDootActive(character, account))
      || isPocketDivinityOwned(account, godIndex)
      || Number(account?.accountOptions?.[425]) === godIndex + 1);
  return (characters ?? []).reduce((sum: number, character: any) => {
    const linkedSlot = account?.divinity?.linkedDeities?.[character?.playerId];
    const slot = toEveryone
      ? getGodSlotOf(godIndex)
      : linkedSlot != null && linkedSlot !== -1 && Number((gods as any)?.[linkedSlot]?.godIndex) === godIndex ? linkedSlot : -1;
    return slot === -1 ? sum : sum + getMinorDivinityBonus(character, account, slot, characters);
  }, 0);
}

const getGodSlotOf = (godIndex: number) => (gods as any)?.findIndex((god: any) => Number(god?.godIndex) === godIndex) ?? -1;

// Companions(0) reads 0 while the active character's divinity level is under 2. For one character that
// character is the active one; account wide the toolbox can't tell, so any character at 2 counts.
// The lab passes raw save characters, which hold the level in Lv0[14] rather than skillsInfo.
const isKingDootActive = (character: any, account: any) =>
  !!isCompanionBonusActive(account, 0)
  && (Number(character?.skillsInfo?.divinity?.level ?? character?.Lv0?.[14]) || 0) >= 2;

// What hands a god's bonus to every character whoever they are linked to: King Doot, a pocket
// divinity, research grid square 173 for Arctis and gem shop item 9 for Snehebatu.
const isGodGrantedToEveryone = (character: any, account: any, godIndex: number) =>
  isKingDootActive(character, account)
  || isPocketDivinityOwned(account, godIndex)
  || (godIndex === GOD_INDEX.Arctis && (account?.research?.gridSquares?.[173]?.bonuses?.[0] ?? 0) >= 1)
  || (godIndex === GOD_INDEX.Snehebatu && Number(account?.gemShopPurchases?.[9]) > 0);

// The slot linking a character to a god, or -1: its own link, else the Elemental Sorcerer's polytheism
// link once that slot is unlocked account wide. An unlinked character gets nothing, and the game does
// not fall through to the polytheism link.
const getLinkedGodSlot = (character: any, account: any, godIndex: number) => {
  const linkedSlot = account?.divinity?.linkedDeities?.[character?.playerId];
  if (linkedSlot == null || linkedSlot === -1) return -1;
  if (Number((gods as any)?.[linkedSlot]?.godIndex) === godIndex) return linkedSlot;
  // Raw save characters (the lab) carry the polytheism talent level instead of the parsed link.
  const polytheism = Number(character?.SkillLevels?.[505]) || 0;
  const secondSlot = character?.secondLinkedDeityIndex ?? (polytheism > 0 ? polytheism % 10 : undefined);
  if (secondSlot == null || Number((gods as any)?.[secondSlot]?.godIndex) !== godIndex) return -1;
  return (Number(account?.divinity?.unlockedDeities) || 0) > secondSlot ? secondSlot : -1;
}
