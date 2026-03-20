import { equipmentSets } from '@website-data';
import { notateNumber } from '@utility/helpers';
import { isBundlePurchased } from '@parsers/misc';
import type { IdleonData, Account, ServerVars } from '../types';

export const getArmorSmithy = (idleonData: IdleonData, serverVars: ServerVars, account: Account) => {
  const smithyUnlocked = account?.accountOptions?.[380];
  const [, ...unlockedSets] = (account?.accountOptions?.[379] ?? '').toString().split(',');
  const days = account?.accountOptions?.[381];
  const sets = equipmentSets.map((set) => {
    const description = set.description.replace('|', '_')
      .replace('{', String(set.bonusValue))
      .replace('}', String(notateNumber(1 + set.bonusValue / 100, 'MultiplierInfo')))
    const unlocked = unlockedSets.includes(set?.setName);
    return {
      ...set,
      description,
      unlocked
    }
  });
  const hasBundle = isBundlePurchased(account?.bundles, 'bun_i')?.owned ? 1 : 0;
  const isSmithyUnlocked = 2e3 <= (idleonData.ServerGemsReceived ?? 0) + 1500 * hasBundle || 1 > Math.round(30 - Number(days));
  return {
    sets: sets as any,
    days,
    smithyUnlocked,
    unlockedSets,
    isSmithyUnlocked
  }
}

export const getArmorSetBonus = (account: Account, setName: string) => {
  return account?.armorSmithy?.sets?.find(({ setName: sName, unlocked }: any) => unlocked && (sName === setName))?.bonusValue ?? 0;
}