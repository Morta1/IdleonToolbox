import { notateNumber } from '@utility/helpers';
import { bonuses as bonusNames, items, itemsArray, gameTables } from '@website-data';
import { getCompanionBonus, isBundlePurchased } from '@parsers/misc';
import { getHatRackBonus, isMapClearedBy } from '@parsers/world-3/hatRack';
import { saveField } from '@parsers/saveField';
import { OPT } from '@parsers/accountOptions';
import { additiveGroup, createBreakdown, NUMBERED_GROUP, percent } from '@parsers/breakdown';

// The equipment slot TotalStats skips once the Cape Vine is on (TotalStatsDRI2 12)
export const CAPE_SLOT = 12;
// Cathie: +10% Cape Vine Bonus Multi
const CATHIE_COMPANION = 105;
// The Golden Vine slots the ban_o bundle adds
const BUNDLE_GOLDEN_VINES = 3;
// A cape outside a Golden Vine slot gives a quarter of its bonus (the patch notes say 20%, the code says 0.25)
const NORMAL_VINE_MULTI = 0.25;

// The vine lists its totals as the base stats first, then the etc bonuses by id
const CAPE_BONUS_ORDER: string[] = [
  ...gameTables.galleryBonusStats,
  ...Object.entries(bonusNames.etcBonuses as Record<string, string>)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([, name]) => name)
];
const capeBonusOrder = (name: string) => {
  const index = CAPE_BONUS_ORDER.indexOf(name);
  return index === -1 ? CAPE_BONUS_ORDER.length : index;
};

// game: Gallery("CapevineBonusesSystemON"). A save without the vine's Spelunk[54] slot predates 2.3.561, when the
// worn cape still counted.
const CAPE_VINE_UNLOCK_MAP = 100;
export const isCapeVineActive = (character: any, account: any) =>
  Boolean(account?.capeVine?.inSave) && isMapClearedBy(character, CAPE_VINE_UNLOCK_MAP);

// The capes the vine takes and counts: every cape but the 69420 cosmetics, and the vine's total leaves out EquipmentCape1
export const isCapeVineEligible = (item: any): boolean => item?.typeGen === 'aCape' && Number(item?.lvReqToCraft) !== 69420;
const isCountedCape = (item: any) => isCapeVineEligible(item) && item?.rawName !== 'EquipmentCape1';

export const getCapeVine = (idleonData: any, account: any) => {
  const rawVine = saveField(idleonData, 'Spelunk')?.[54];
  return parseCapeVine(Array.isArray(rawVine) ? rawVine : [], Array.isArray(rawVine), account);
}

const parseCapeVine = (rawCapes: string[], inSave: boolean, account: any) => {
  const goldenVines = getGoldCapeVinesOwned(account);
  const goldenVinesUnlocked = Number(account?.accountOptions?.[OPT.capeVineGoldenVinesUnlocked]) || 0;
  const capesUsed = rawCapes.map((rawName, slot) => {
    const multi = getCapeVineBonusMulti(account, rawCapes.length, slot);
    return { ...withMultipliedBonuses(items?.[rawName], multi), rawName, slot, golden: goldenVines > slot, capeMultiplier: multi };
  });
  const capesUsedSet = new Set(rawCapes);
  const allCapes = itemsArray
    .filter(isCountedCape)
    .map((item: any) => ({ ...item, isAcquired: capesUsedSet.has(item.rawName) }))
    .sort((a: any, b: any) => Number(b.isAcquired) - Number(a.isAcquired) || (a.ID || 0) - (b.ID || 0));

  return {
    inSave,
    bonusMulti: getCapeVineBonusMulti(account, rawCapes.length, 999),
    bonusMultiBreakdown: getCapeVineBonusMultiBreakdown(account, rawCapes.length),
    capeBonuses: getCapeBonuses(rawCapes, account),
    capesUsed,
    allCapes,
    totalCapes: rawCapes.length,
    totalEligibleCapes: allCapes.length,
    goldenVines,
    goldenVinesUnlocked,
    nextGoldenVineClassLevel: Math.round(1e3 + 500 * goldenVinesUnlocked)
  }
}

const withMultipliedBonuses = (item: any, multi: number) => {
  if (!item) return {};
  const modifiedItem: any = { ...item };
  for (const uq of ['UQ1', 'UQ2']) {
    if (item[`${uq}txt`] && item[`${uq}txt`] != '0' && item[`${uq}val`] && item[`${uq}val`] != 0) {
      modifiedItem[`${uq}val`] = notateNumber(Number(item[`${uq}val`]) * multi, 'MultiplierInfo');
    }
  }
  return modifiedItem;
}

// game: Stuff2("GoldCapeVinesOwned")
export const getGoldCapeVinesOwned = (account: any) => Math.round(1
  + (Number(account?.accountOptions?.[OPT.capeVineGoldenVinesUnlocked]) || 0)
  + BUNDLE_GOLDEN_VINES * (isBundlePurchased(account, 'ban_o') ? 1 : 0));

// game: "CapevineBonusMulti" - slot 999 is the full multi the vine's own panel shows
export const getCapeVineBonusMulti = (account: any, capeCount: number, slot: number) => {
  const multi = 1 + (capeCount + getCompanionBonus(account, CATHIE_COMPANION)) / 100;
  return getGoldCapeVinesOwned(account) > slot || slot === 999 ? multi : NORMAL_VINE_MULTI * multi;
}

// The vine's full multi (slot 999) and where it comes from: +1% a cape on the vine, and Catherine
export const getCapeVineBonusMultiBreakdown = (account: any, capeCount: number) => {
  const sources = [
    percent('Capes on the vine (+1% each)', capeCount),
    percent('Catherine (Companion)', getCompanionBonus(account, CATHIE_COMPANION))
  ];
  return createBreakdown('Bonus multi', getCapeVineBonusMulti(account, capeCount, 999), [additiveGroup(NUMBERED_GROUP, sources)]);
};

// game: "InitializeCapeBonuses"
const getCapeBonuses = (rawCapes: string[], account: any) => {
  const capeBonusesObj: Record<string, number> = {};
  rawCapes.forEach((rawName, slot) => {
    const cape: any = items?.[rawName];
    if (!cape) return;
    const multi = getCapeVineBonusMulti(account, rawCapes.length, slot);
    for (const uq of ['UQ1', 'UQ2']) {
      const uqText = cape[`${uq}txt`];
      if (uqText && uqText != '0') {
        capeBonusesObj[uqText] = (capeBonusesObj[uqText] ?? 0) + multi * (Number(cape[`${uq}val`]) || 0);
      }
    }
    // Game bug: the base stats start each cape from the Hat Rack's total (PremHatBonTOT) instead of the vine's own,
    // so the last cape overwrites the rest: Hat Rack stat + the last cape's stat.
    for (const statName of gameTables.galleryBonusStats as string[]) {
      capeBonusesObj[statName] = getHatRackBonus(account, statName) + multi * (Number(cape[statName]) || 0);
    }
  });
  return Object.entries(capeBonusesObj)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => capeBonusOrder(a.name) - capeBonusOrder(b.name));
}

export const getCapeVineBonus = (account: any, bonusName: any) => {
  return account?.capeVine?.capeBonuses?.find((bonus: any) => bonus.name === bonusName)?.value ?? 0;
}
