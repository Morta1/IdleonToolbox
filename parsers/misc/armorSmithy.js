import { equipmentSets } from '../../data/website-data';
import { notateNumber } from '@utility/helpers';
import { isBundlePurchased } from '@parsers/misc';

export const getArmorSmithy = (idleonData, serverVars, account) => {
  const smithyUnlocked = account?.accountOptions?.[380];
  const [, ...unlockedSets] = (account?.accountOptions?.[379] ?? '').toString().split(',');
  const days = account?.accountOptions?.[381];
  const sets = equipmentSets.map((set) => {
    const description = set.description.replace('|', '_')
      .replace('{', set.bonusValue)
      .replace('}', notateNumber(1 + set.bonusValue / 100, 'MultiplierInfo'))
    const unlocked = unlockedSets.includes(set?.setName);
    return {
      ...set,
      description,
      unlocked
    }
  });
  const hasBundle = isBundlePurchased(account?.bundles, 'bun_i')?.owned ? 1 : 0;
  const isSmithyUnlocked = 2e3 <= idleonData.ServerGemsReceived + 1500 * hasBundle || 1 > Math.round(30 - days);
  return {
    sets,
    days,
    smithyUnlocked,
    unlockedSets,
    isSmithyUnlocked
  }
}

export const getArmorSetBonus = (account, setName) => {
  return account?.armorSmithy?.sets?.find(({ setName: sName, unlocked }) => unlocked && (sName === setName))?.bonusValue ?? 0;
}