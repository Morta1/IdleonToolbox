import { isGodEnabledBySorcerer } from '@parsers/world-4/lab';
import { isCompanionBonusActive } from '@parsers/misc';
import { getActiveBubbleBonus, isPrismaBubble } from '@parsers/world-2/alchemy';
import { getPrismaMulti } from '@parsers/class-specific/tesseract';
import { isJadeBonusUnlocked } from '@parsers/world-6/sneaking';
import { getCoralKidUpgBonus } from '@parsers/world-7/coralReef';
import { getMineheadBonusQTY } from '@parsers/world-7/minehead';
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
        maxLevel: Math.round(100 + (coralKidBonus + (getMineheadBonusQTY(accountData, 9) + getUpgradeVaultBonus(accountData?.upgradeVault?.upgrades, 76))))
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

export const getGodByIndex = (linkedDeities: any, characters: any, gIndex: any) => {
  const char = characters?.find((_: any, index: any) => linkedDeities?.[index] === gIndex)
  return char?.deityMinorBonus;
}

export const getDeityLinkedIndex = (account: any, characters: any, deityIndex: any) => {
  const coralKidLinked = account?.accountOptions?.[425] > 0 && account?.accountOptions?.[425] === deityIndex;
  const pocketLinked = account?.hole?.godsLinks?.find(({ index }: any) => index === deityIndex);
  const normalLink = account?.divinity?.linkedDeities?.map((deity: any, index: any) => deityIndex === deity || (isCompanionBonusActive(account, 0) && account?.finishedWorlds?.World4)
    ? index
    : -1);
  const esLink = characters.map((character: any, index: any) => isGodEnabledBySorcerer(character, deityIndex) || (isCompanionBonusActive(account, 0) && account?.finishedWorlds?.World4)
    ? index
    : -1);
  // Check if pocketLinked exists and add it to the result
  return normalLink?.map((charIndex: any, index: any) => {
    // First check for pocket link or coral kid link
    if (pocketLinked || coralKidLinked) {
      return index;
    }
    // Then check for normal and ES links as before
    return charIndex === -1 && esLink?.[index] !== -1
      ? esLink?.[index]
      : charIndex;
  }).filter((index: any) => index !== -1) || [];
}

export const getMinorDivinityBonus = (character: any, account: any, forcedDivinityIndex?: any, characters?: any) => {
  const bigPCharacter = characters?.find((char: any) => char.equippedBubbles?.find(({ bubbleName }: any) => bubbleName === 'BIG_P'));
  const bigPBubble = getActiveBubbleBonus((bigPCharacter || character || characters?.[0])?.equippedBubbles, 'BIG_P', account);
  const divinityLevel = (character || bigPCharacter || characters?.[0])?.skillsInfo?.divinity?.level ?? 0;
  const linkedDeity = forcedDivinityIndex ?? account?.divinity?.linkedDeities?.[character.playerId];
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

// Arctis' slot in the gods list. Its minor bonus is the only one the game ceils into talent levels.
export const ARCTIS_GOD_SLOT = 1;

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
export const getW7ChosenGodIndex = (account: any) => {
  const chosen = Number(account?.accountOptions?.[425]) || 0;
  if (chosen <= 0) return -1;
  return Number((gods as any)?.[Math.max(0, chosen - 1)]?.godIndex);
}

// Divinity("Bonus_MAJOR", playerIndex, godIndex), which decides whether a character gets a god's
// major bonus. `godIndex` is the god's bonus id (the GodsInfo[..][13] column), while every link the
// save stores is a god slot, so each comparison goes through gods[slot].godIndex.
// God indices 6 (Purrmep) and 8 (Kattlekruk) short circuit on their own unlock flags in the game;
// nothing reads those through here yet, so they are not modelled.
export const isMajorDivinityActive = (character: any, account: any, godIndex: number) => {
  if (isCompanionBonusActive(account, 0)) return true;
  if (isPocketDivinityOwned(account, godIndex)) return true;
  if (getW7ChosenGodIndex(account) === godIndex) return true;
  // Research grid square 173 hands Arctis to everyone, and gem shop item 9 does the same for
  // Snehebatu, whoever the character is actually linked to.
  if (godIndex === 2 && (account?.research?.gridSquares?.[173]?.bonuses?.[0] ?? 0) >= 1) return true;
  if (godIndex === 0 && Number(account?.gemShopPurchases?.[9]) > 0) return true;

  const linkedSlot = account?.divinity?.linkedDeities?.[character?.playerId];
  // An unlinked character gets nothing, and the game does not fall through to the polytheism link.
  if (linkedSlot == null || linkedSlot === -1) return false;
  if (Number((gods as any)?.[linkedSlot]?.godIndex) === godIndex) return true;

  const secondSlot = character?.secondLinkedDeityIndex;
  if (secondSlot == null) return false;
  if (Number((gods as any)?.[secondSlot]?.godIndex) !== godIndex) return false;
  // The second link only pays out once that god slot has been unlocked account wide.
  return (Number(account?.divinity?.unlockedDeities) || 0) > secondSlot;
}
