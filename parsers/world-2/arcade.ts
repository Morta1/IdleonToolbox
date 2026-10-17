import type { IdleonData, Account, ServerVars } from '../types';
import { growth, notateNumber, tryToParse } from '@utility/helpers';
import { arcadeShop } from '@website-data';
import { isCompanionBonusActive } from '@parsers/misc';
import { getPaletteBonus } from '@parsers/world-5/gaming';
import { getTesseractBonus } from '@parsers/class-specific/tesseract';
import { getExoticMarketBonus } from '@parsers/world-6/farming';
import { isKingDootActive } from '@parsers/world-5/divinity';
import { getBestActiveCharacter } from '@parsers/talents';
import { additiveGroup, createBreakdown, multiplier, percent } from '@parsers/breakdown';
import type { StatBreakdown } from '@parsers/breakdown';

export const getArcade = (idleonData: IdleonData, account: Account, serverVars: ServerVars, characters?: any[]) => {
  const arcadeRaw = tryToParse((idleonData as any)?.ArcadeUpg) || (idleonData as any)?.ArcadeUpg;
  return parseArcade(arcadeRaw, account, serverVars, characters);
}

export const ARCADE_MAX_LEVEL = 100;
export const ARCADE_SUPER_LEVEL = 101;
export const ARCADE_OMEGA_LEVEL = 102;

// game: "DungeonCalc:ArcadeCost" - Lv 100 -> 101 costs 5 Royal balls, Lv 101 -> 102 costs 2 Omega balls;
// null below Lv 100 (the gold-ball curve lives with the shop page)
export const getArcadeCapCost = (level: number): { cost: number, currency: 'royal' | 'omega' } | null =>
  level === ARCADE_SUPER_LEVEL ? { cost: 2, currency: 'omega' }
    : level === ARCADE_MAX_LEVEL ? { cost: 5, currency: 'royal' }
      : null;

// The shop data ends in placeholder rows ("+{%_who_knows") the game has not filled yet
export const isArcadePlaceholder = (upgrade: any) => /who_knows/i.test(upgrade?.effect ?? '');

// game: the ArcadeShopInfo text, "{" -> NotateNumber(bonus, "Smaller") and "}" -> NotateNumber(1 + bonus/100,
// "MultiplierInfo") with "#" stripped (the "}x_" entries are multipliers)
export const formatArcadeEffect = (effect: string = '', bonus: number = 0) => effect
  .replace('{', String(notateNumber(bonus, 'Smaller')))
  .replace('}', String(notateNumber(1 + bonus / 100, 'MultiplierInfo')).replace('#', ''));

const GOLDEN_YELLOW_PALETTE = 15;
const GOLD_BALL_ARCADE_BONUS = 39;
const SPHERES_OF_GOLD_ARCANE = 16;
const GOLD_FIGLEAF_EXOTIC = 57;
const BALLTHEZAR_GOLD_BALLS = 50;
const HEDGEHOG_COMPANION = 36;

// game: (1 + Summoning("ArcadeGballsExtraPCT") / 100) * (1 + ServerVar ArcGballPCT / 100), what every Gold Ball
// prize on the arcade board is multiplied by (the jackpot leaves the event part out)
export const getGoldBallMulti = (account: Account, serverVars: ServerVars, characters?: any[], shop = (account as any)?.arcade?.shop)
  : { value: number, breakdown: StatBreakdown } => {
  const palette = getPaletteBonus(account, GOLDEN_YELLOW_PALETTE);
  const arcade = getArcadeBonus(shop, GOLD_BALL_ARCADE_BONUS)?.bonus ?? 0;
  const arcane = getTesseractBonus(account, SPHERES_OF_GOLD_ARCANE);
  const exotic = getExoticMarketBonus(account, GOLD_FIGLEAF_EXOTIC);
  // Coral Kid's first upgrade becomes Ballthezar once King Doot is owned (Companions(0), logged-in character)
  const coralKidLevel = (account as any)?.coralReef?.coralKidUpgrades?.[0]?.level ?? 0;
  const kingDoot = isKingDootActive(getBestActiveCharacter(characters), account) ? 1 : 0;
  const ballthezar = BALLTHEZAR_GOLD_BALLS * Math.min(1, coralKidLevel * kingDoot);
  const hedgehog = isCompanionBonusActive(account, HEDGEHOG_COMPANION)
    ? ((account as any)?.companions?.list?.at(HEDGEHOG_COMPANION)?.bonus ?? 0)
    : 0;
  const event = Number((serverVars as any)?.ArcGballPCT) || 0;
  const extra = palette + arcade + arcane + exotic + ballthezar + hedgehog;
  const value = (1 + extra / 100) * (1 + event / 100);
  const tree = [
    additiveGroup('Gold ball gain bonuses', [
      percent('Golden Yellow palette', palette),
      percent('Arcade shop', arcade),
      percent('Spheres of Gold', arcane),
      percent('Gold Figleaf', exotic),
      percent('Ballthezar', ballthezar),
      percent('Hedgehog', hedgehog)
    ]),
    multiplier('Gold ball event', 1 + event / 100, { note: 'Not applied to the jackpot' })
  ];
  return { value, breakdown: createBreakdown('Gold ball multi', `${notateNumber(value, 'MultiplierInfo')}x`, tree) };
}

const parseArcade = (arcadeRaw: any, account: Account, serverVars: ServerVars, characters?: any[]) => {
  const balls = (account as any)?.accountOptions?.[74];
  const goldBalls = (account as any)?.accountOptions?.[75];
  const royalBalls = (account as any)?.accountOptions?.[324];
  // 2.3.540 Omega balls (Menagerie unlock 6), spent on the Lv 101 -> 102 Omega upgrade
  const omegaBalls = (account as any)?.accountOptions?.[625] ?? 0;

  const arcadeShopList = arcadeShop?.map((upgrade: any, index: number) => {
    const { x1, x2, func } = upgrade;
    const level = arcadeRaw?.[index] ?? 0;
    const bonus = growth(func, level, x1, x2, false);
    // game: "ArcadeBonus" (Lv 101 Super doubles the bonus, Lv 102 Omega multiplies it by 6)
    const superBonus = level === ARCADE_OMEGA_LEVEL ? 6 : level === ARCADE_SUPER_LEVEL ? 2 : 1;
    const companionBonus = isCompanionBonusActive(account, 27) ? 2 : 1;
    return {
      ...upgrade,
      level,
      active: (serverVars as any)?.ArcadeBonuses?.includes(index),
      rotationIndex: (serverVars as any)?.ArcadeBonuses?.indexOf(index),
      bonus: bonus * superBonus * companionBonus,
      iconName: `PachiShopICON${index}`
    }
  });
  const totalUpgradeLevels = arcadeShopList?.reduce((res: number, { level }: { level: number }) => res + level, 0);
  return {
    shop: arcadeShopList,
    balls,
    goldBalls,
    royalBalls,
    omegaBalls,
    totalUpgradeLevels,
    goldBallMulti: getGoldBallMulti(account, serverVars, characters, arcadeShopList)
  }
}

// The name must match the effect exactly, minus its leading "+{%_" or "}x_" (multiplier entries): a
// substring match let 'Drop_Rate' reach Marble Drop Rate. Names the shop repeats (Cash_from_Mobs is 10 and 11, Artifact_Find 32 and
// 66) go by index, as the game's ArcadeBonus(i) does.
export const getArcadeBonus = (list: any[] | undefined, effectNameOrIndex: string | number) => {
  if (typeof effectNameOrIndex === 'number') return list?.[effectNameOrIndex];
  return list?.find(({ effect }: { effect: string }) => effect.replace(/^[^A-Za-z]*(x_)?/, '') === effectNameOrIndex);
}
