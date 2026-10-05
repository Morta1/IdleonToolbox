import type { IdleonData, Account } from '../types';
import { getEquinoxBonus } from '@parsers/world-3/equinox';
import { mapPortals, ninjaExtraInfo } from '@website-data';
import { getCosmoBonus } from '@parsers/world-5/hole';
import { getWinnerBonus } from '@parsers/world-6/summoning';
import { getEventShopBonus, isCompanionBonusActive } from '@parsers/misc';
import { getLegendTalentBonus } from '@parsers/world-7/legendTalents';
import { getArcadeBonus } from '@parsers/world-2/arcade';
import { getClamWorkBonus } from '@parsers/world-7/clamWork';
import { getPaletteBonus } from '@parsers/world-5/gaming';
import { getSushiBonus } from '@parsers/world-7/sushiStation';
import { getJellyBonus } from '@parsers/world-7/jellyOperator';

export const getVoteBallot = (idleonData: IdleonData, accountData: Account, characters?: any[]) => {
  return parseVoteBallot(idleonData, accountData, characters);
}

const parseVoteBallot = (idleonData: IdleonData, accountData: Account, characters?: any[]) => {
  const { votePercent, voteCategories, voteCat2, votePercent2 } = (accountData as any)?.serverVars || {};
  const [selectedCategory, ...currentCategories] = voteCategories || [];
  const [selectedCategory2, ...currentCategories2] = voteCat2 || [];

  // "MeritocBonuszMulti" == e
  // Game: 0 >= KillsLeft2Advance[250][0], ie. Spirit Village (the World 6 town) has been reached,
  // otherwise every meritocracy bonus is 0. character.kills stores kills done, so compare to the requirement.
  const world6TownReq = parseFloat(mapPortals?.[250]?.[0] as any);
  const meritocracyUnlocked = characters?.some(({ kills }: any) => kills?.[250] >= world6TownReq) ?? false;
  // Until the Demonflesh is handed in (OptionsListAccount[472]) the base is 25% instead of 100%
  const canVote = (accountData as any)?.accountOptions?.[472] === 1 ? 1 : 0;
  const meritocracyBase = Math.min(1, Math.max(0.25, 0.25 + canVote));
  const companionBonus = isCompanionBonusActive(accountData, 39) ? (accountData as any)?.companions?.list?.at(39)?.bonus : 0;
  const poppyBonus = isCompanionBonusActive(accountData, 161) ? (accountData as any)?.companions?.list?.at(161)?.bonus ?? 0 : 0;
  const arcadeBonus = getArcadeBonus((accountData as any)?.arcade?.shop, 'Meritocracy_Bonus')?.bonus ?? 0;
  const legendTalentBonus = getLegendTalentBonus(accountData, 24) ?? 0;
  const clamWorkBonus = getClamWorkBonus(accountData, 3) ?? 0;
  const meritocracySushiBonus = getSushiBonus(accountData, 51) ?? 0;
  const meritocracyJellyBonus = getJellyBonus(accountData, 33);
  const meritocracyEventShopBonus = getEventShopBonus(accountData, 23) ?? 0;
  const meritocracyMult = !meritocracyUnlocked ? 0 : (1 + poppyBonus / 100) * (meritocracyBase + (5 * clamWorkBonus
    + (companionBonus
      + (legendTalentBonus
        + (arcadeBonus
          + (20 * meritocracyEventShopBonus + (meritocracySushiBonus + meritocracyJellyBonus)))))) / 100);
  const meritocracyMultBreakdown = {
    statName: 'Meritocracy multi',
    totalValue: meritocracyMult,
    categories: [
      {
        name: 'Multiplicative',
        sources: [
          { name: 'Poppy Companion', value: 1 + poppyBonus / 100 }
        ]
      },
      {
        name: 'Additive (% bonus)',
        sources: [
          { name: 'Base (Demonflesh)', value: 100 * meritocracyBase },
          { name: 'Clam Work ', value: 5 * clamWorkBonus },
          { name: 'Companion (Pufferblob)', value: companionBonus },
          { name: 'Legend Talent', value: legendTalentBonus },
          { name: 'Arcade', value: arcadeBonus },
          { name: 'Event Shop', value: 20 * meritocracyEventShopBonus },
          { name: 'Sushi Tier 51', value: meritocracySushiBonus },
          { name: 'Jelly Operator', value: meritocracyJellyBonus }
        ]
      }
    ]
  };

  const parts = ninjaExtraInfo[41];
  const upgrades: { description: string; value: number; extra: number }[] = [];
  let meritocracyBonuses: any[];

  for (let i = 0; i < parts.length;) {
    let desc: string[] = [];

    while (isNaN(Number(parts[i]))) {
      desc.push(parts[i]);
      i++;
    }

    const value = Number(parts[i++]);
    const extra = Number(parts[i++]); // always 0

    upgrades.push({ description: desc.join(" "), value, extra });
  }

  // Step 2: Apply your transformation logic
  meritocracyBonuses = upgrades.map((bonus, index) => {
    const bonusIndex = currentCategories2.findIndex((ind: number) => ind === index);

    return {
      ...bonus,
      icon: `MeritBon${index}.png`,
      active: bonusIndex > -1,
      selected: selectedCategory2 === index,
      percent: votePercent2?.[bonusIndex] || 0,
      bonus: bonus.value * meritocracyMult
    };
  });

  const companionBonus2 = isCompanionBonusActive(accountData, 19) ? (accountData as any)?.companions?.list?.at(19)?.bonus ?? 0 : 0;
  const companionBonus3 = isCompanionBonusActive(accountData, 41) ? (accountData as any)?.companions?.list?.at(41)?.bonus ?? 0 : 0;
  const paletteBonus = getPaletteBonus(accountData, 32) ?? 0;
  const legendTalentBonus2 = getLegendTalentBonus(accountData, 22) ?? 0;
  const eventShopBonus2 = getEventShopBonus(accountData, 7) ?? 0;
  const eventShopBonus3 = getEventShopBonus(accountData, 16) ?? 0;
  const cosmoBonus = getCosmoBonus({ majik: (accountData as any)?.hole?.holesObject?.idleonMajiks, t: 2, i: 3 }) ?? 0;
  const winnerBonus = getWinnerBonus(accountData, '+{% Ballot Bonus') ?? 0;
  const equinoxBonus = getEquinoxBonus((accountData as any)?.equinox?.upgrades, 'Voter_Rights') ?? 0;
  const meritocracyBonus = getMeritocracyBonus(accountData, 9) ?? 0;
  const ballotSushiBonus = getSushiBonus(accountData, 50) ?? 0;

  // VotingBonusz == e
  const voteMulti = (1 + poppyBonus / 100)
    * (1 + meritocracyBonus / 100)
    * (1 + (companionBonus3 + equinoxBonus + (cosmoBonus + (winnerBonus +
      (17 * eventShopBonus2 + 13 * eventShopBonus3 + (companionBonus2 + (paletteBonus + (legendTalentBonus2 + ballotSushiBonus))))))) / 100);
  const voteMultiBreakdown = {
    statName: 'Bonus multi',
    totalValue: voteMulti,
    categories: [
      {
        name: 'Multiplicative',
        sources: [
          { name: 'Companion (Poppy)', value: 1 + poppyBonus / 100 },
          { name: 'Meritocracy Bonus', value: 1 + meritocracyBonus / 100 }
        ]
      },
      {
        name: 'Additive (% bonus)',
        sources: [
          { name: 'Companion (Crystal Cuttlefish)', value: companionBonus3 },
          { name: 'Equinox', value: equinoxBonus },
          { name: 'Cosmo', value: cosmoBonus },
          { name: 'Summoning Win', value: winnerBonus },
          { name: 'Event Shop 7', value: 17 * eventShopBonus2 },
          { name: 'Event Shop 16', value: 13 * eventShopBonus3 },
          { name: 'Companion (Mashed Potato)', value: companionBonus2 },
          { name: 'Palette', value: paletteBonus },
          { name: 'Legend Talent', value: legendTalentBonus2 },
          { name: 'Sushi Tier 50', value: ballotSushiBonus }
        ]
      }
    ]
  };

  const bonuses = (ninjaExtraInfo[38] as any).toChunks(3).map((bonus: any, index: number) => {
    const bonusIndex = currentCategories.findIndex((ind: any) => ind === index);
    return {
      ...bonus,
      icon: `VoteBon${index}.png`,
      active: bonusIndex > -1,
      selected: selectedCategory === index,
      percent: votePercent?.[bonusIndex] || 0,
      bonus: parseFloat(bonus?.[1]) * voteMulti
    }
  });

  return {
    bonuses,
    meritocracyBonuses,
    voteMulti,
    voteMultiBreakdown,
    meritocracyMult,
    meritocracyMultBreakdown,
    selectedBonus: { ...bonuses?.[selectedCategory], index: selectedCategory },
    selectedMeritocracyBonus: { ...meritocracyBonuses?.[selectedCategory2], index: selectedCategory2 }
  }
}

export const getVoteBonus = (account: Account, index: number): number => {
  const isSelected = (account as any)?.voteBallot?.bonuses?.[index]?.selected;
  return isSelected ? (account as any)?.voteBallot?.bonuses?.[index]?.bonus : 0;
}

export const getMeritocracyBonus = (account: Account, index: number): number => {
  const isSelected = (account as any)?.voteBallot?.meritocracyBonuses?.[index]?.selected;
  return isSelected ? (account as any)?.voteBallot?.meritocracyBonuses?.[index]?.bonus : 0;
}
