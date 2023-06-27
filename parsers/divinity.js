import { isGodEnabledBySorcerer } from './lab';
import { isCompanionBonusActive } from './misc';

const { tryToParse } = require('../utility/helpers');
const { gods } = require('../data/website-data');

export const getDivinity = (idleonData, serializedCharactersData) => {
  const divinityRaw = tryToParse(idleonData?.Divinity) || idleonData?.Divinity;
  if (!divinityRaw) return null;
  return parseDivinity(divinityRaw, serializedCharactersData);
}

const parseDivinity = (divinityRaw, serializedCharactersData) => {
  const numberOfChars = serializedCharactersData?.length;
  const deitiesStartIndex = 12;
  const linkedDeities = divinityRaw?.slice(deitiesStartIndex, deitiesStartIndex + numberOfChars);
  const blessingBasesStartIndex = 28;
  const blessingBases = divinityRaw?.slice(blessingBasesStartIndex, blessingBasesStartIndex + gods?.length + 1);
  const linkedStyles = divinityRaw?.slice(0, serializedCharactersData?.length + 1);
  const unlockedDeities = divinityRaw?.[25];

  const deities = gods?.map((god, index) => {
      const blessingBonus = blessingBases?.[index] * god?.blessingMultiplier;
      return {
        ...god,
        rawName: `DivGod${index}`,
        blessingBonus
      }
    }
  );

  return {
    linkedDeities,
    linkedStyles,
    deities,
    blessingBases,
    unlockedDeities
  }
}

export const getGodBlessingBonus = (gods, godName) => {
  return gods?.find(({ name }) => name === godName)?.blessingBonus ?? 0;
}

export const getGodByIndex = (linkedDeities, characters, gIndex) => {
  const char = characters?.find((_, index) => linkedDeities?.[index] === gIndex)
  return char?.deityMinorBonus;
}

export const getDeityLinkedIndex = (account, characters, deityIndex) => {
  const normalLink = account?.divinity?.linkedDeities?.map((deity, index) => deityIndex === deity || isCompanionBonusActive(account, 0)
    ? index
    : -1);
  const esLink = characters.map((character, index) => isGodEnabledBySorcerer(character, deityIndex) || isCompanionBonusActive(account, 0)
    ? index
    : -1);
  return (normalLink?.map((charIndex, index) => charIndex === -1
  && esLink?.[index] !== -1
    ? esLink?.[index]
    : charIndex)) || [];
}