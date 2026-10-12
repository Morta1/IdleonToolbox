import { equipmentSets, randomList } from '@website-data';
import { notateNumber } from '@utility/helpers';
import { isBundlePurchased } from '@parsers/misc';
import { getBestActiveCharacter } from '@parsers/talents';
import type { IdleonData, Account, ServerVars } from '../types';

// The smithy's list order (RANDOlist[113]); any set it does not list goes last
const SMITHY_SET_ORDER: string[] = randomList?.[113] ?? [];
const smithyOrder = (setName: string) => {
  const index = SMITHY_SET_ORDER.indexOf(setName);
  return index === -1 ? SMITHY_SET_ORDER.length : index;
};

// game: GetSetBonus(set, "PartsOn") - armour pieces worn, tools held (up to requiredTools) and one
// weapon when the set needs it, counted for the logged-in character
export const getSetPartsOn = (set: any, character: any) => {
  const equipped = new Set((character?.equipment ?? []).map((item: any) => item?.rawName));
  const tools = new Set((character?.tools ?? []).map((item: any) => item?.rawName));
  const armorParts = set.armors.filter((rawName: string) => equipped.has(rawName)).length;
  const toolParts = Math.min(set.requiredTools, set.tools.filter((rawName: string) => tools.has(rawName)).length);
  const weaponPart = set.requiredWeapon === 1 && set.weapons.some((rawName: string) => equipped.has(rawName)) ? 1 : 0;
  return armorParts + toolParts + weaponPart;
};

// game: GetSetBonus(set, "PartsReq")
export const getSetPartsReq = (set: any) => set.armors.length + set.requiredTools + set.requiredWeapon;

export const getArmorSmithy = (idleonData: IdleonData, serverVars: ServerVars, account: Account, characters?: any[]) => {
  const smithyUnlocked = account?.accountOptions?.[380];
  const [, ...unlockedSets] = (account?.accountOptions?.[379] ?? '').toString().split(',');
  const days = account?.accountOptions?.[381] ?? 0;
  const loggedInCharacter = getBestActiveCharacter(characters);
  const sets = [...equipmentSets]
    .sort((a, b) => smithyOrder(a.setName) - smithyOrder(b.setName))
    .map((set) => {
      const description = set.description.replace('|', '_')
        .replace('{', String(set.bonusValue))
        .replace('}', String(notateNumber(1 + set.bonusValue / 100, 'MultiplierInfo')))
      const unlocked = unlockedSets.includes(set?.setName);
      // game: GetSetBonus(set, "Bonus") also counts a set the logged-in character wears in full,
      // whether or not it was ever handed in to the smithy
      const equipped = getSetPartsOn(set, loggedInCharacter) >= getSetPartsReq(set);
      return {
        ...set,
        description,
        unlocked,
        equipped
      }
    });
  // game: GetSetBonus("PermaUnlockAfford") - the smithy reads the bun_c bundle
  const hasBundle = isBundlePurchased(account, 'bun_c') ? 1 : 0;
  const isSmithyUnlocked = 2e3 <= (idleonData?.ServerGemsReceived ?? 0) + 1500 * hasBundle || 1 > Math.round(30 - Number(days));
  return {
    sets: sets as any,
    days,
    smithyUnlocked,
    unlockedSets,
    isSmithyUnlocked
  }
}

export const getArmorSetBonus = (account: Account, setName: string) => {
  return account?.armorSmithy?.sets?.find(({ setName: sName, unlocked, equipped }: any) => (unlocked || equipped) && (sName === setName))?.bonusValue ?? 0;
}
