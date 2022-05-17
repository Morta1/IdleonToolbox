import { tryToParse } from "../utility/helpers";
import { bribes } from "../data/website-data";

export const getBribes = (idleonData) => {
  const bribesRaw = idleonData?.BribeStatus || tryToParse(idleonData?.BribeStatus);
  return parseBribes(bribesRaw);
}

const parseBribes = (bribesRaw) => {
  return bribesRaw?.reduce((res, bribeStatus, index) => {
    return bribeStatus !== -1 ? [...res, {
      ...(bribes?.[index] || []),
      done: bribeStatus === 1
    }] : res;
  }, []);
}

export const getBribeBonus = (bribes, bribeName) => {
  return bribes?.find(({name, done}) => name === bribeName && done)?.value ?? 0;
}