import { companionLineName, isCompanionBonusActive, isCompanionLvl2Active, isMasteryBonusUnlocked } from '@parsers/misc';
import { getVoteBonus } from '@parsers/world-2/voteBallot';
import { getLampBonus } from '@parsers/world-5/caverns/the-lamp';
import { getSushiBonus } from '@parsers/world-7/sushiStation';
import { isArtifactAcquired } from '@parsers/world-5/sailing';
import { getAchievementStatus } from '@parsers/achievements';
import { getBribeBonus } from '@parsers/world-1/bribes';
import { getPostOfficeBonus } from '@parsers/world-3/postoffice';
import { additiveGroup, flat, multiplier, NUMBERED_GROUP, percent, productGroup, sourceName } from '@parsers/breakdown';
import type { BreakdownNode } from '@parsers/breakdown';
import { getActiveBubbleBonus, isPrismaBubble } from '@parsers/world-2/alchemy';
import { getPrismaMulti } from '@parsers/class-specific/tesseract';
import { isJadeBonusUnlocked } from '@parsers/world-6/sneaking';
import { getCoralKidUpgBonus } from '@parsers/world-7/coralReef';
import { getMineheadBonusQTY } from '@parsers/world-7/minehead';
import { getJellyBonus } from '@parsers/world-7/jellyOperator';
import { getUpgradeVaultBonus } from '@parsers/misc/upgradeVault';
import { achievements, cosmoUpgrades, gods } from '@website-data';
import { growth } from '@utility/helpers';
import { getBestActiveCharacter, getHighestTalentAcrossCharacters } from '@parsers/talents';
import { saveField } from '@parsers/saveField';
import { OPT } from '@parsers/accountOptions';

export const getDivinity = (idleonData: any, serializedCharactersData: any, accountData: any) => {
  const divinityRaw = saveField(idleonData, 'Divinity') || idleonData?.Divinity;
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
      // game: Divinity("BlesssBonus"). True Godly Blessings raises every god but Nobisect, whose blessing instead scales
      // with the active character's skill efficiency (getNobisectBonus); its value here is before that scaling.
      const blessingBonus = level * god?.blessingMultiplier * (index === GOD_SLOT.Nobisect ? 1 : emporiumBonus);
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
    divinityPoints: Number(divinityRaw?.[24]) || 0,
    offerings: getDivinityOfferings(divinityRaw, accountData?.serverVars)
  }
}

// game: Divinity("OfferingOdds", t), the chance of offering t (Divinity[26 + t] picks its tier)
const OFFERING_ODDS = [0.01, 0.05, 0.1, 0.25, 0.5];
const OFFERINGS = 2;
// game: Divinity("OfferingCost", t), the Divinity points offering t costs: it grows with every god unlocked (each past
// the third also x the server's DivCostAfter3, between x1 and x1.8) and is the chance times that, so a sure offering
// costs the most. Unlocked gods past the last raise the god rank, so the offerings never run out
export const getDivinityOfferings = (divinityRaw: any, serverVars: any) => {
  const unlocked = Number(divinityRaw?.[25]) || 0;
  const afterThird = Math.min(1.8, Math.max(1, 1 + (Number(serverVars?.DivCostAfter3) || 0) / 100));
  return Array.from({ length: OFFERINGS }, (_, offering) => {
    const tier = Number(divinityRaw?.[26 + offering]) || 0;
    const chance = OFFERING_ODDS[tier] ?? 1;
    let cost = (20 * Math.pow(unlocked + 1.3, 2.3) * Math.pow(2.2, unlocked) + 60) * chance;
    if (unlocked > 2) cost *= Math.pow(afterThird, unlocked - 2);
    return { tier, chance, cost: cost < 1 ? 1 : cost < 1e6 ? Math.ceil(cost) : cost };
  });
};

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

// game: DivMinorBonus scales every character's minor bonus by AlchBubbles.Y2ACTIVE, the BIG_P bubble
// equipped by the LOGGED-IN character. bubbleCharacter is that character for account-wide sums; a
// character's own bonus (viewed as if it were playing) passes nothing and uses its own bubbles.
export const getMinorDivinityBonus = (character: any, account: any, godSlot?: any, characters?: any, bubbleCharacter?: any) => {
  const bigPBubble = getActiveBubbleBonus((bubbleCharacter || character || characters?.[0])?.equippedBubbles, 'BIG_P', account);
  const divinityLevel = (character || characters?.[0])?.skillsInfo?.divinity?.level ?? 0;
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
  const chosen = Number(account?.accountOptions?.[OPT.w7DivinityChosenGod]) || 0;
  if (chosen <= 0) return -1;
  return Number((gods as any)?.[Math.max(0, chosen - 1)]?.godIndex);
}

// Divinity("Bonus_MAJOR", playerIndex, godIndex), which decides whether a character gets a god's
// major bonus. `godIndex` is the god's bonus id (the GodsInfo[..][13] column), while every link the
// save stores is a god slot, so each comparison goes through gods[slot].godIndex.
// Purrmep and Kattlekruk pay theirs account wide while any character is directly linked to them: the
// game reads flags (GenINFO[87] and [210]) it sets from every link at load, polytheism not included.
// King Doot (Companions(0)) follows the logged-in character's divinity level: pass loggedInCharacter
// when the game walks every character while one is logged in (lab tubes); without it the character
// is treated as the one playing.
// game: "Bonus_MAJOR"
export const isMajorDivinityActive = (character: any, account: any, godIndex: number, loggedInCharacter?: any) => {
  if (isGodGrantedToEveryone(character, account, godIndex, loggedInCharacter) || getW7ChosenGodIndex(account) === godIndex) return true;
  if (godIndex === GOD_INDEX.Purrmep || godIndex === GOD_INDEX.Kattlekruk) {
    return (account?.divinity?.linkedDeities ?? []).some((slot: any) => slot >= 0 && Number((gods as any)?.[slot]?.godIndex) === godIndex);
  }
  return getLinkedGodSlot(character, account, godIndex) !== -1;
}

const DIV_STYLE_TRANQI = 5;

// Divinity("DivPerHr", t) without its TranQi clause: whether character t meditates, AFK at Divinity or
// counted in the lab with Goharut. The game's own rules here, not Bonus_MAJOR's: a raw pocket god slot
// (no unlocked-spot check) of Arctis puts everyone in the lab, and only a pocket Goharut, King Doot or
// a direct Goharut link counts for the god. King Doot and the "logged in at the lab with Goharut
// major" clause, which makes every character meditate, follow the logged-in character.
// game: "DivPerHr"
export const isMeditatingForDivinity = (character: any, account: any, characters: any) => {
  if (character?.afkTarget === 'Divinity') return true;
  const loggedInCharacter = getBestActiveCharacter(characters) ?? character;
  if (loggedInCharacter?.afkTarget === 'Laboratory'
    && isMajorDivinityActive(loggedInCharacter, account, GOD_INDEX.Goharut, loggedInCharacter)) return true;
  const pockets = [29, 30].map((index) => Number(account?.hole?.holesObject?.extraCalculations?.[index]));
  const inLab = character?.afkTarget === 'Laboratory' || pockets.includes(GOD_SLOT.Arctis);
  const hasGoharut = pockets.includes(GOD_SLOT.Goharut)
    || isKingDootActive(loggedInCharacter, account)
    || account?.divinity?.linkedDeities?.[character?.playerId] === GOD_SLOT.Goharut;
  return inLab && hasGoharut;
}

// What an AFK claim actually pays a character's style rate for. DivPerHr above only feeds the "/hr"
// numbers on the Divinity screen; Divinity_PTS is granted solely by the Divinity claim and by the
// Laboratory claim with the claimer's own Goharut major, and the claimer is the one logged in.
// Every other claim pays nothing but the TranQi EXP.
// game: AFK claim "DIVINITY" / "LABORATORY" branches
export const isMeditatingOnClaim = (character: any, account: any) =>
  character?.afkTarget === 'Divinity'
  || (character?.afkTarget === 'Laboratory'
    && isMajorDivinityActive(character, account, GOD_INDEX.Goharut, character));

// Divinity("DivPerHr", t) == 1: the TranQi style earns while not meditating.
// game: "DivPerHr"
export const isGainingDivinityPoints = (character: any, account: any, characters: any) =>
  Number(account?.divinity?.linkedStyles?.[character?.playerId]) === DIV_STYLE_TRANQI
  || isMeditatingForDivinity(character, account, characters);

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
  const loggedInCharacter = getBestActiveCharacter(characters);
  const toEveryone = (godIndex === GOD_INDEX.Harriep || godIndex === GOD_INDEX.Goharut)
    && (isKingDootActive(loggedInCharacter, account)
      || isPocketDivinityOwned(account, godIndex)
      || Number(account?.accountOptions?.[OPT.w7DivinityChosenGod]) === godIndex + 1);
  return (characters ?? []).reduce((sum: number, character: any) => {
    const linkedSlot = account?.divinity?.linkedDeities?.[character?.playerId];
    const slot = toEveryone
      ? getGodSlotOf(godIndex)
      : linkedSlot != null && linkedSlot !== -1 && Number((gods as any)?.[linkedSlot]?.godIndex) === godIndex ? linkedSlot : -1;
    return slot === -1 ? sum : sum + getMinorDivinityBonus(character, account, slot, characters, loggedInCharacter);
  }, 0);
}

const getGodSlotOf = (godIndex: number) => (gods as any)?.findIndex((god: any) => Number(god?.godIndex) === godIndex) ?? -1;

// Companions(0) reads 0 while the active character's divinity level is under 2: for one character that
// is itself, account wide it is the logged-in character (getBestActiveCharacter).
// The lab passes raw save characters, which hold the level in Lv0[14] rather than skillsInfo.
export const isKingDootActive = (character: any, account: any) =>
  !!isCompanionBonusActive(account, 0)
  && (Number(character?.skillsInfo?.divinity?.level ?? character?.Lv0?.[14]) || 0) >= 2;

// What hands a god's bonus to every character whoever they are linked to: King Doot, a pocket
// divinity, research grid square 173 for Arctis and gem shop item 9 for Snehebatu.
const isGodGrantedToEveryone = (character: any, account: any, godIndex: number, loggedInCharacter?: any) =>
  isKingDootActive(loggedInCharacter ?? character, account)
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

// The Divinity page header: every god's blessing level summed
export const getTotalBlessingLevels = (deities: any[] | undefined) => deities?.reduce((sum, { level }) => sum + (level || 0), 0) ?? 0;

// Total Divinity LV across all players, the gate on Coral Kid upgrades
export const getTotalDivinityLevel = (characters: any[] | undefined) =>
  characters?.reduce((sum, character) => sum + (character?.skillsInfo?.divinity?.level ?? 0), 0) ?? 0;

// Divinity("DivPTSPerHr", t): the base points a style earns per hour, before every multiplier. Not the EXP table
// (getDivStylePerHour): here TranQi and the fourth style earn no points.
const DIV_PTS_STYLE_BASE = [1, 2, 4, 0, 2, 0, 8, 15];
export const getDivStylePointsPerHour = (styleIndex: any) => DIV_PTS_STYLE_BASE[Number(styleIndex)] ?? 0;

// The god slots whose blessing feeds Divinity("DivMulti", 0..4); the last two entries are artifacts
const DIV_MULTI_BLESSINGS = [GOD_SLOT.Snehebatu, GOD_SLOT.Arctis, GOD_SLOT.Harriep, GOD_SLOT.Omniphau];
const DIV_MULTI_ARTIFACTS = ['Ashen_Urn', 'Jade_Rock'];
const DIVINITY_SKILL_INDEX_MASTERY_TIER = 1;

// Divinity("DivPTSPerHr", 999): every account multiplier on a style's points per hour, the style rate and the
// character's DivPerHr gate left out. The breakdown tree mirrors the game's factors.
// game: "DivPTSPerHr"
export const getDivinityPointsMultiplier = (account: any, characters: any) => {
  const loggedInCharacter = getBestActiveCharacter(characters) ?? characters?.[0];
  const deities = account?.divinity?.deities ?? [];
  const gemShopBonus = Number(account?.gemShopPurchases?.[130]) || 0;
  const petMartBonus = isCompanionLvl2Active(account, 0) ? 1 : 0;
  const sushiBonus = getSushiBonus(account, 46);
  const coralKidBonus = getCoralKidUpgBonus(account, 6);
  const blessings = DIV_MULTI_BLESSINGS.map((slot) => ({ name: deities?.[slot]?.name, value: Number(deities?.[slot]?.blessingBonus) || 0 }));
  const artifacts = DIV_MULTI_ARTIFACTS.map((name) => ({ name, value: Number(isArtifactAcquired(account?.sailing?.artifacts, name)?.bonus) || 0 }));
  const divMulti = Math.max(1, [...blessings, ...artifacts].reduce((product, { value }) => product * (1 + value / 100), 1));
  const talentBonus = getHighestTalentAcrossCharacters(characters, 'POLYTHEISM', loggedInCharacter);
  // Bonus_MAJOR(0, 6): Purrmep, paid account wide while any character is linked to it
  const purrmepMajor = isMajorDivinityActive(characters?.[0], account, GOD_INDEX.Purrmep, loggedInCharacter) ? 1 : 0;
  const voteBonus = getVoteBonus(account, 23);
  const lampBonus = getLampBonus({ holesObject: account?.hole?.holesObject, t: 1, i: 2, account });
  const reefLevels = (account?.spelunking?.coralReefLevels ?? []).slice(0, 6)
    .reduce((sum: number, level: any) => sum + (Number(level) || 0), 0);
  const reefBonus = reefLevels * getCoralKidUpgBonus(account, 4);
  // BoxRewards "22c": the third bonus of the logged-in character's Box of Gosh
  const postOfficeBonus = getPostOfficeBonus(loggedInCharacter?.postOffice, 'Box_of_Gosh', 2);
  const achievementBonus298 = 10 * getAchievementStatus(account?.achievements, 298);
  const achievementBonus304 = 10 * getAchievementStatus(account?.achievements, 304);
  const masteryBonus = 15 * isMasteryBonusUnlocked(account?.rift, account?.totalSkillsLevels?.divinity?.rank, DIVINITY_SKILL_INDEX_MASTERY_TIER);
  const bribeBonus = getBribeBonus(account?.bribes, 'Divine_PTS_Miscounting');
  const vaultBonus = getUpgradeVaultBonus(account?.upgradeVault?.upgrades, 71);

  const value = (1 + gemShopBonus / 4)
    * (1 + 0.25 * petMartBonus)
    * (1 + sushiBonus / 100)
    * (1 + coralKidBonus / 100)
    * divMulti
    * (1 + talentBonus / 100)
    * Math.max(1, 1 + purrmepMajor)
    * (1 + voteBonus / 100)
    * (1 + lampBonus / 100)
    * (1 + reefBonus / 100)
    * (1 + (postOfficeBonus + (achievementBonus298 + achievementBonus304 + (masteryBonus + (bribeBonus + vaultBonus)))) / 100);

  return {
    value,
    tree: [
      productGroup(NUMBERED_GROUP, [
        multiplier('Gem shop', 1 + gemShopBonus / 4),
        multiplier(`${companionLineName(0)} Pet Mart+`, 1 + 0.25 * petMartBonus),
        multiplier('Sushi', 1 + sushiBonus / 100),
        multiplier('Coral Kid', 1 + coralKidBonus / 100),
        ...blessings.map(({ name, value: bonus }) => multiplier(sourceName('Blessing', name), 1 + bonus / 100)),
        ...artifacts.map(({ name, value: bonus }) => multiplier(sourceName('Artifact', name), 1 + bonus / 100)),
        multiplier('Polytheism talent', 1 + talentBonus / 100),
        multiplier('Purrmep major link', Math.max(1, 1 + purrmepMajor)),
        multiplier('Vote', 1 + voteBonus / 100),
        multiplier('Lamp', 1 + lampBonus / 100),
        multiplier('Coral Kid (reef levels)', 1 + reefBonus / 100)
      ]),
      additiveGroup(NUMBERED_GROUP, [
        percent('Post office', postOfficeBonus),
        percent(sourceName('Achievement', achievements?.[298]?.name), achievementBonus298),
        percent(sourceName('Achievement', achievements?.[304]?.name), achievementBonus304),
        percent('Skill mastery', masteryBonus),
        percent(sourceName('Bribe', 'Divine_PTS_Miscounting'), bribeBonus),
        percent('Vault', vaultBonus)
      ])
    ] as BreakdownNode[]
  };
}

// Divinity("DivPTSPerHr", t): a character's points per hour as the Divinity screen shows it, 0 when its style earns
// none or Divinity("DivPerHr", t) says it is not gaining. The multiplier is the account's, so pass it when listing
// several characters.
// game: "DivPTSPerHr"
export const getCharacterDivinityPointsPerHour = (character: any, account: any, characters: any, multiplier?: number) => {
  if (!isGainingDivinityPoints(character, account, characters)) return 0;
  const base = getDivStylePointsPerHour(account?.divinity?.linkedStyles?.[character?.playerId]);
  return base * (multiplier ?? getDivinityPointsMultiplier(account, characters).value);
}

// Every character's points per hour and the account's total, the total's breakdown being the style rates of the
// characters gaining points times the shared multiplier.
export const getDivinityPointsPerHour = (account: any, characters: any) => {
  const { value: multi, tree } = getDivinityPointsMultiplier(account, characters);
  const perCharacter = (characters ?? []).map((character: any) => ({
    playerId: character?.playerId,
    value: getCharacterDivinityPointsPerHour(character, account, characters, multi)
  }));
  const styleRates = (characters ?? []).reduce((sum: number, character: any) => isGainingDivinityPoints(character, account, characters)
    ? sum + getDivStylePointsPerHour(account?.divinity?.linkedStyles?.[character?.playerId]) : sum, 0);
  return {
    total: styleRates * multi,
    perCharacter,
    tree: [flat('Style rates', styleRates), ...tree] as BreakdownNode[]
  };
}
