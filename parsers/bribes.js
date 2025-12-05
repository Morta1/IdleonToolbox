import { tryToParse } from '@utility/helpers';
import { bribes } from '@website-data';

export const getBribes = (idleonData) => {
  const bribesRaw = idleonData?.BribeStatus || tryToParse(idleonData?.BribeStatus);
  return parseBribes(bribesRaw);
}

const parseBribes = (bribesRaw) => {
  return bribes?.map((bribe, index) => {
    const bribeStatus = bribesRaw?.[index];
    return {
      ...bribe,
      done: bribeStatus === 1
    };
  });
}

export const getBribeBonus = (bribes, bribeName) => {
  return bribes?.find(({ name, done }) => name === bribeName && done)?.value ?? 0;
}