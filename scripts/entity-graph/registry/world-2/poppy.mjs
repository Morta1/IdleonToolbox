import { gameTable } from '../data.mjs';
import { termsFor } from './poppy-text.mjs';

// Poppy's fishing upgrades (kangaroo.ts). The level of each is read from the save, so a page shows
// the sentence and cost at any level the reader types.

// The rooBonuses table (Summoning:RooBonuses): upgrade `upgrade` (Bonuses from Poppy) grants the RooBonus bonuses, bonus
// k worth bases[k] per step, handed out on level k + 1 and every `period` levels after. No table, the row reads as
// any other.
const rooBonusesOf = (index, data) => {
  const roo = gameTable(data, 'rooBonuses');
  return roo && index === roo.upgrade ? roo : null;
};

const capitalise = (name) => name.charAt(0).toUpperCase() + name.slice(1);

// The game draws Bluefin Fish as a font glyph, not a png; the art is the site's own, the same as the Poppy listing's.
const BLUEFIN = '/etc/KFish.png';

export default {
  kind: 'poppy',
  section: 'poppyBonuses',
  // UPKEEP: keyed by table position; the icon follows the same index.
  key: (entry, index) => `PoppyUpgrade${index}`,
  // The game writes "tasty_Fishbait" and "fishy_discount" with a lowercase first letter.
  name: (entry) => capitalise(entry.name),
  icon: (entry, index) => `/etc/KUpga_${index}.png`,
  fallbackIcon: '/data/RooA.png',
  // Bonuses from Poppy lists the bonuses it grants, each with its own token <k>.
  // UPKEEP: rows 1-7 of the `bonus` column are those labels, in RooBonus order.
  describe: (entry, index, data) => {
    const roo = rooBonusesOf(index, data);
    return roo
      ? `${entry.desc}@${roo.bases.map((_, k) => data.poppyBonuses[k + 1].bonus.replace('{', `<${k}>`)).join(',_')}`
      : entry.desc;
  },
  effect: (entry, index, data) => {
    const roo = rooBonusesOf(index, data);
    return {
      levelLabel: 'Upgrade level',
      terms: roo
        ? roo.bases.map((perStep, k) => ({ token: `<${k}>`, formula: 'roundRobin', args: { perStep, offset: k, period: roo.period } }))
        : termsFor(entry, data)
    };
  },
  // The rooFirstCost table (Summoning:RooCost's `0 == t`): that row's cost scales with its own level. No table, no price.
  cost: (entry, index, data) => {
    const first = gameTable(data, 'rooFirstCost');
    return first
      ? { formula: index === first.row ? 'linearPowFromOne' : 'pow', args: { base: entry.x1, rate: entry.x2 }, currency: 'Bluefin Fish', currencyIcon: BLUEFIN }
      : null;
  },
  // x3 is the Bluefin Fish caught this run before the upgrade opens; the first-cost row is always open. No table, no
  // unlock field.
  fields: (entry, index, data) => {
    const first = gameTable(data, 'rooFirstCost');
    return !first || index === first.row ? [] : [{ label: 'Unlocks after catching (Bluefin Fish)', value: entry.x3 }];
  }
};
