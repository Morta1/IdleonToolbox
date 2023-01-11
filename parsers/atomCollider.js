import { tryToParse } from "../utility/helpers";
import { atomsInfo } from "../data/website-data";
import { getBubbleBonus } from "./alchemy";

export const getAtoms = (idleonData, account) => {
  const atomsRaw = tryToParse(idleonData?.Atoms) || idleonData?.Atoms
  const divinityRaw = tryToParse(idleonData?.Divinity) || idleonData?.Divinity;
  if (!atomsRaw) return {};
  return parseAtoms(divinityRaw, atomsRaw, account);
}

const parseAtoms = (divinityRaw, atomsRaw, account) => {
  const particles = Math.floor(divinityRaw?.[39]);
  const atoms = atomsRaw.map((level, index) => {
    const atomColliderLevel = account?.towers?.data?.[8]?.level ?? 0;
    const atomInfo = atomsInfo?.[index];
    const atomReductionFromAtom = atomsRaw?.[9] > 0 ? 1 : 0;
    const bubbleBonus = getBubbleBonus(account?.alchemy?.bubbles, 'kazam', 'ATOM_SPLIT', false)
    const cost = (1 / (1 + (atomReductionFromAtom + (bubbleBonus + atomColliderLevel / 10)) / 100)) * (atomInfo?.x3 + atomInfo?.x1 * level) * Math.pow(atomInfo?.x2, level);
    return { level, rawName: `Atom${index}`, ...(atomsInfo?.[index] || {}), cost: Math.floor(cost) }
  });
  return {
    particles,
    atoms
  }
}