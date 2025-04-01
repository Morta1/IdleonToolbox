import { getEquinoxBonus } from '@parsers/equinox';
import { ninjaExtraInfo } from '../../data/website-data';
import { getCosmoBonus } from '@parsers/world-5/hole';
import { getWinnerBonus } from '@parsers/world-6/summoning';
import { getEventShopBonus, isCompanionBonusActive } from '@parsers/misc';

export const getVoteBallot = (idleonData, accountData) => {
  return parseVoteBallot(idleonData, accountData);
}

const parseVoteBallot = (idleonData, accountData) => {
  const { votePercent, voteCategories } = accountData?.serverVars || {};
  const [selectedCategory, ...currentCategories] = voteCategories || [];
  const companionBonus = isCompanionBonusActive(accountData, 19) ? accountData?.companions?.list?.at(19)?.bonus : 0;
  const voteMulti = 1 + (getEquinoxBonus(accountData?.equinox?.upgrades, 'Voter_Rights') +
    (getCosmoBonus({ majik: accountData?.hole?.holesObject?.idleonMajiks, t: 2, i: 3 })
      + getWinnerBonus(accountData, '+{% Ballot Bonus')
      + (17 * getEventShopBonus(accountData, 7) + 13 * getEventShopBonus(accountData, 7) + companionBonus))) / 100;

  const bonuses = ninjaExtraInfo[38].split(' ').toChunks(3).map((bonus, index) => {
    const bonusIndex = currentCategories.findIndex((ind) => ind === index);
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
    voteMulti,
    selectedBonus: { ...bonuses?.[selectedCategory], index: selectedCategory }
  }
}

export const getVoteBonus = (account, index) => {
  const isSelected = account?.voteBallot?.bonuses?.[index]?.selected;
  return isSelected ? account?.voteBallot?.bonuses?.[index]?.bonus : 0;
}