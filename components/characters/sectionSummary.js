import { cleanUnderscore, formatNum } from 'utility/helpers';
import { HIDDEN_INVENTORY_BAG } from '@parsers/character';
import { isSectionFailed } from '@components/common/styles';

// What a closed section says on a phone, one line from the character and the account, reading the same number the section
// prints. The pieces both read live here, so the two can't drift.
export const totalStats = (stats) => Object.entries(stats || {}).reduce((sum, [statName, statValue]) => sum + (statName !== 'level' ? statValue : 0), 0);

// `level` carries the added levels on top of the points actually invested, so summing it counts the account-wide bonus once
// per talent. Star talents never take added levels and carry no baseLevel, so they fall back to level.
export const pointsSpent = (orderedTalents) => orderedTalents?.reduce((res, { level = 0, baseLevel }) => res + (baseLevel ?? level), 0);

// A slot with nothing in it has nothing to read
export const isFilledSlot = ({ rawName, displayName } = {}) => rawName !== 'Blank' && Boolean(displayName) && displayName !== 'ERROR';

const count = (value) => formatNum(value, 'whole');
const counted = (value, word) => `${count(value)} ${word}${value === 1 ? '' : 's'}`;
const equipped = (list) => (list ? `${count(list.length)} equipped` : null);
const unspent = (value) => (value > 0 ? `${count(value)} unspent` : null);

const SUMMARIES = {
  Stats: ({ stats }) => {
    const total = totalStats(stats);
    return stats && Number.isFinite(total) ? `Total stats ${formatNum(total)}` : null;
  },
  // A Talents section opens on its first page
  Talents: ({ talents }) => {
    const points = pointsSpent(talents?.[0]?.orderedTalents);
    return Number.isFinite(points) ? `${count(points)} point${points === 1 ? '' : 's'} spent` : null;
  },
  Cards: ({ cards }) => (cards?.cardSet?.name ? cleanUnderscore(cards.cardSet.name) : null),
  Skills: ({ skillsInfo }) => {
    const levels = Object.entries(skillsInfo || {}).filter(([skillName]) => skillName !== 'character').map(([, { level }]) => level);
    return levels.length ? `Highest Lv ${count(Math.max(...levels))}` : null;
  },
  Equipment: ({ equipment, tools, food }) => (equipment
    ? `${count(equipment.filter(isFilledSlot).length)} worn, ${counted(tools?.filter(isFilledSlot).length ?? 0, 'tool')}, ${count(food?.filter(isFilledSlot).length ?? 0)} food`
    : null),
  Obols: ({ obols }) => equipped(obols?.list?.filter((item) => isFilledSlot(item) && !item?.rawName?.includes('Blank') && !item?.rawName?.includes('Locked'))),
  'Obols Stats': ({ obols }) => {
    const stats = Object.keys(obols?.stats ?? {}).length;
    return stats ? counted(stats, 'stat') : null;
  },
  Inventory: ({ inventory, inventorySlots }) => (inventorySlots ? `${count(inventory?.length ?? 0)} / ${count(inventorySlots)}` : null),
  Bags: ({ invBagsUsed, carryCapBags }) => {
    const bags = invBagsUsed?.filter((bag) => bag?.displayName !== HIDDEN_INVENTORY_BAG);
    return bags ? `${count(bags.filter((bag) => bag?.acquired).length)} of ${count(bags.length)}, ${count(carryCapBags?.length ?? 0)} carry` : null;
  },
  Prayers: ({ activePrayers }) => equipped(activePrayers),
  'Star Signs': ({ starSigns }) => equipped(starSigns?.filter(({ starName }) => starName !== 'None')),
  'Equipped Bubbles': ({ equippedBubbles }) => equipped(equippedBubbles?.filter(({ bubbleName }) => bubbleName)),
  Chips: ({ playerId }, account) => equipped(account?.lab?.playersChips?.[playerId]?.filter((chip) => chip !== -1)),
  Divinity: ({ linkedDeity, secondLinkedDeityIndex }, account) => {
    const deities = account?.divinity?.deities;
    const slot = [linkedDeity, secondLinkedDeityIndex].find((link) => link != null && link >= 0 && deities?.[link]);
    return slot != null ? cleanUnderscore(deities[slot].name) : null;
  },
  'Anvil Details': ({ anvil }) => unspent(anvil?.anvilStats?.availablePoints),
  'Post Office': ({ postOffice }) => unspent(Math.floor(postOffice?.totalOrders ?? 0) - Math.floor(postOffice?.totalPointsSpent ?? 0))
};

// The parse's section behind a summary: failed, its number isn't the player's, so the closed row says nothing
const FED_BY = {
  Cards: 'cards',
  Obols: 'obols',
  'Obols Stats': 'obols',
  Prayers: 'prayers',
  'Star Signs': 'starSigns',
  'Equipped Bubbles': 'equippedBubbles',
  Chips: 'lab',
  Divinity: 'divinity'
};

export const sectionSummary = (name, character, account) => {
  if (FED_BY[name] && isSectionFailed(account, FED_BY[name])) return null;
  try {
    return SUMMARIES[name]?.(character, account) ?? null;
  } catch {
    return null;
  }
};
