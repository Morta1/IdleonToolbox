import { linked } from '../../../../utility/wiki/field-links.mjs';
import { gameTable, listAt } from '../data.mjs';
import { nodeId } from '../links.mjs';
import { dropReadout, spaced, titleCase } from '../text.mjs';
import menagerieUnlock, { UNLOCK_NAMES, unlockName } from './menagerie-unlock.mjs';

// UPKEEP: generalSpelunky[27] holds the 18 upgrade texts, page 1 then page 2 (Scurge). Not extracted: only the Clam Work panel's
// numbered draw event (_event_8, N.js:119468) reads it, at `_DRI + 9 x page`.
const TEXTS = 27;
// UPKEEP: page 1 upgrade 3's "Currently gives }x" scales with the Multikill of whoever works the Clamworks (ClamBonuses,
// N.js:106819), an account readout; the cut keeps the sentence. Page 2 upgrade 0 breaks its line mid-phrase ("+$_@__Scurge_EXP"),
// which tidy would turn into a sentence break, so the break is joined back.
const CUTS = [{ 3: [/_Currently_gives_\}x/, ''] }, { 0: [/_@_+/, '_'] }];
const textOf = ({ page, slot, text }) => {
  const cut = CUTS[page][slot];
  return dropReadout(cut ? String(text).replace(...cut) : String(text ?? ''));
};

// UPKEEP: the `$` each slot's panel line fills (the Clam Work draw event, N.js:119468; clamWork.ts formatClamWorkDescription and
// formatScurgeDescription). Page 1: the pearl value 1 + bonus, the clam count (clamFills.mobs), the 10x pearl chance and the
// discount as floor(1e4 x (1 - 1 / (1 + bonus / 100))) / 100, the pure pearl worth (clamFills.blackPearl). Page 2: the Scurge EXP
// per kill 1 + bonus, the DMG cut 100^L, the discount, the starting EXP (clamFills.scurgeStart). Every other upgrade on that
// page alone, so the other upgrades' factors stand at their level 0. Not extracted: the fill is the panel's draw code.
const DOLLARS = [
  {
    0: ({ perLevel }) => ({ formula: 'growth', args: { func: 'bigBase', x1: 1, x2: perLevel } }),
    1: (entry, fills) => ({ formula: 'affineCapped', args: { base: fills.mobs.base, perLevel: 1, max: fills.mobs.max } }),
    2: ({ perLevel }) => ({ formula: 'diminishingPercent', args: { perLevel } }),
    4: ({ perLevel }) => ({ formula: 'diminishingPercent', args: { perLevel } }),
    5: ({ perLevel }, fills) => ({ formula: 'growth', args: { func: 'bigBase', x1: fills.blackPearl.base, x2: perLevel } })
  },
  {
    0: ({ perLevel }) => ({ formula: 'growth', args: { func: 'bigBase', x1: 1, x2: perLevel } }),
    2: () => ({ formula: 'pow', args: { base: 1, rate: 100 } }),
    3: ({ perLevel }) => ({ formula: 'diminishingPercent', args: { perLevel } }),
    // min(max, L / (L + half) x scale) reads as the decay alone while scale stays under max.
    6: (entry, { scurgeStart }) => (scurgeStart.scale <= scurgeStart.max
      ? { formula: 'decayFloorHundredths', args: { scale: 100 * scurgeStart.scale, offset: scurgeStart.half } }
      : null)
  }
];

// The clamCost table, Thingies Clam_Cost (N.js:106823): page 1 upgrade 0 costs rate^L + perLevel L + L^power, the others
// (Clam_PearlUpgReq(t) / divisor) rate^L + perLevel L + L^power, Clam_PearlUpgReq growing with the Worker Class
// (OptionsListAccount[464]); page 2 costs Scurge points per level.
const pearlCost = ({ slot, rate }, price) => {
  if (slot === 0) return { base: 1, rate, perLevel: price.first.perLevel, exponent: price.first.power };
  const req = price.pearlReq.base * Math.pow(price.pearlReq.rate, slot - price.pearlReq.offset);
  return { base: req / price.rest.divisor, rate, perLevel: price.rest.perLevel, exponent: price.rest.power };
};

export default {
  kind: 'clamupgrade',
  // The 18 texts, page 1 then page 2, named by the gameTables clamWorkBonusNames (the panel's names), with
  // listIndexes.clamBonusValues (Thingies ClamBonuses, `t + 9` on page 2) and listIndexes.clamCostRates (Clam_Cost, page 1 only).
  section: (data) => {
    const texts = data.generalSpelunky[TEXTS] || [];
    const names = gameTable(data, 'clamWorkBonusNames');
    const values = listAt(data.generalSpelunky, data, 'clamBonusValues');
    const rates = listAt(data.generalSpelunky, data, 'clamCostRates');
    const perPage = texts.length / 2;
    return texts.map((text, index) => {
      const page = Math.floor(index / perPage);
      const slot = index % perPage;
      return {
        name: names?.[index] ?? null,
        page,
        slot,
        text,
        perLevel: values ? Number(values[index]) : null,
        rate: page === 0 && rates ? Number(rates[slot]) : null
      };
    });
  },
  key: (entry, index) => `ClamWork${index}`,
  // Without the names table the page keeps its key as its title, so it stays reachable until z-processing finds the names again.
  name: (entry, index) => (entry.name ? titleCase(entry.name) : `ClamWork${index}`),
  // The panel draws no art per upgrade (the app shows none either), so the pages carry none.
  fallbackIcon: null,
  describe: textOf,
  effect: (entry, index, data) => {
    if (entry.perLevel === null) return undefined;
    const fills = gameTable(data, 'clamFills');
    const dollar = fills && DOLLARS[entry.page][entry.slot] ? DOLLARS[entry.page][entry.slot](entry, fills) : null;
    // UPKEEP: every `}` is MultiplierInfo(1 + bonus / 100), bonus = value x L (N.js:119468).
    return {
      levelLabel: 'Upgrade level',
      terms: [
        { token: '}', formula: 'growth', args: { func: 'bigBase', x1: 1, x2: entry.perLevel / 100 } },
        ...(dollar ? [{ token: '$', ...dollar }] : [])
      ]
    };
  },
  cost: (entry, index, data) => {
    const price = gameTable(data, 'clamCost');
    if (!price) return null;
    if (entry.page === 1) {
      const points = price.scurgePoints[entry.slot];
      return points === undefined
        ? null
        : { formula: 'pow', args: { base: points, rate: 1 }, currency: 'Scurge Points', currencyOne: 'Scurge Point', note: 'Each Scurge LV gives one point.' };
    }
    return entry.rate === null
      ? null
      : {
        formula: 'polyPlusPow',
        args: pearlCost(entry, price),
        currency: 'Pearls',
        currencyOne: 'Pearl',
        currencyIcon: '/data/ClamPearl0.png',
        ...(entry.slot > 0 ? { label: 'Cost at Worker Class 0', note: 'Base cost, before discounts. Each Worker Class raises it.' } : {})
      };
  },
  fields: (entry, index, data) => {
    if (entry.page === 0) return [{ label: 'Page', value: 'Upgrades' }];
    const levels = gameTable(data, 'scurgeUpgradeLevelReq');
    const unlock = gameTable(data, 'menagerieUnlockUses')?.scurge;
    const name = unlock === undefined ? null : unlockName(data.research[UNLOCK_NAMES]?.[unlock]);
    return [
      { label: 'Page', value: 'Scurge' },
      ...(levels ? [{ label: 'Scurge LV needed', value: levels[entry.slot] }] : []),
      ...(name ? [linked({ label: 'Unlocked by', value: spaced(name) }, 'unlockedBy', nodeId(menagerieUnlock, null, unlock))] : [])
    ];
  }
};
