import { getEquinoxBonus } from '@parsers/equinox';
import { ninjaExtraInfo } from '../../data/website-data';

export const getVoteBallot = (idleonData, accountData) => {
  return parseVoteBallot(idleonData, accountData);
}

const parseVoteBallot = (idleonData, accountData) => {
  const { votePercent, voteCategories } = accountData?.serverVars || {};
  const [selectedCategory, ...currentCategories] = voteCategories || [];
  const voteMulti = getEquinoxBonus(accountData?.equinox?.upgrades, 'Voter_Rights') || 1;
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
    selectedBonus: bonuses?.[selectedCategory]
  }
}

export const getVoteBonus = (account, index) => {
  const isSelected = account?.voteBallot?.bonuses?.[index]?.selected;
  return isSelected ? account?.voteBallot?.bonuses?.[index]?.bonus : 0;
}