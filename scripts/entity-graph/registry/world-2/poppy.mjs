import { termsFor } from './poppy-text.mjs';

// Poppy's fishing upgrades (kangaroo.ts). The level of each is read from the save, so a page shows
// the sentence and cost at any level the reader types.

// UPKEEP: table position of the upgrades with their own rules (kangaroo.ts): Tasty Fishbait's cost
// scales with its own level, Bonuses from Poppy grants the seven RooBonus bonuses.
const TASTY_FISHBAIT = 0;
const BONUSES_FROM_POPPY = 3;
// UPKEEP: RooBonus bases, hardcoded in kangaroo.ts bonusData (N.js DNSM.RooBonus[k]).
const ROO_BONUS_BASES = [3, 3, 5, 2, 2, 0.5, 3];

const capitalise = (name) => name.charAt(0).toUpperCase() + name.slice(1);

export default {
  kind: 'poppy',
  section: 'poppyBonuses',
  // UPKEEP: keyed by table position; the icon follows the same index.
  key: (entry, index) => `PoppyUpgrade${index}`,
  // The game writes "tasty_Fishbait" and "fishy_discount" with a lowercase first letter.
  name: (entry) => capitalise(entry.name),
  icon: (entry, index) => `/etc/KUpga_${index}.png`,
  fallbackIcon: '/data/RooA.png',
  // Bonuses from Poppy lists the seven bonuses it grants, each with its own token <k>.
  // UPKEEP: rows 1-7 of the `bonus` column are those labels, in RooBonus order.
  describe: (entry, index, data) => (index === BONUSES_FROM_POPPY
    ? `${entry.desc}@${ROO_BONUS_BASES.map((_, k) => data.poppyBonuses[k + 1].bonus.replace('{', `<${k}>`)).join(',_')}`
    : entry.desc),
  effect: (entry, index) => ({
    levelLabel: 'Upgrade level',
    terms: index === BONUSES_FROM_POPPY
      // UPKEEP: bonus k is handed out on level k + 1 and every 7 levels after (kangaroo.ts RooBonus).
      ? ROO_BONUS_BASES.map((perStep, k) => ({ token: `<${k}>`, formula: 'roundRobin', args: { perStep, offset: k, period: ROO_BONUS_BASES.length } }))
      : termsFor(entry)
  }),
  cost: (entry, index) => ({
    formula: index === TASTY_FISHBAIT ? 'linearPowFromOne' : 'pow',
    args: { base: entry.x1, rate: entry.x2 },
    currency: 'Bluefin Fish'
  }),
  // x3 is the Bluefin Fish caught this run before the upgrade opens; the first one is always open.
  fields: (entry, index) => (index === TASTY_FISHBAIT ? [] : [{ label: 'Unlocks after catching (Bluefin Fish)', value: entry.x3 }])
};
