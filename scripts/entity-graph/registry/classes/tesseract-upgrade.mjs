import { formatAmount } from '../../../../utility/wiki/effects.mjs';
import { linked } from '../../../../utility/wiki/field-links.mjs';
import { gameTable } from '../data.mjs';
import { nodeId } from '../links.mjs';
import { spaced } from '../text.mjs';
import { formClassField, helpNote, multiplierTerm, unlocksAt } from './fields.mjs';

// UPKEEP: talents 483 and 599 cap and lower these two rows (ArcaneType.js:110-118, 228-234).
const CAPPED_BY = { 7: "The Tenteyecle talent's own chance" };
const LOWERED_BY = { 13: 'The Backup Energy talent, up to 10 more kills' };

// The tachyon colour row x3 costs: the k-th "<colour>_Tachyons_owned" row (row 12 says "Purple_Tachyon_owned") names
// tachyon k, as OptionsListAccount[388 + k] holds them (the parser's tachyonNames, tesseract.ts:24-31).
const tachyonOf = (type, data) => {
  const colour = data.tesseract
    .map(({ description }) => String(description).split('_'))
    .map((words) => words[words.findIndex((word, at) => /^Tachyons?$/.test(word) && words[at + 1] === 'owned') - 1])
    .filter(Boolean)[type];
  return colour ? { currency: `${colour} Tachyons`, currencyOne: `${colour} Tachyon` } : {};
};

// The row Fractal Tesseract boosts this one from: the arcaneNotFractal table, ArcaneUpgBonus's leading `3 == t || ...`
// (rows it does not multiply) and its self-call (N.js:107159).
const fractalOf = (index, data) => {
  const fractal = gameTable(data, 'arcaneNotFractal');
  return fractal && !fractal.notMultiplied.includes(index) && data.tesseract[fractal.multiplierRow] ? fractal.multiplierRow : null;
};

// The `$` the panel computes per row: the arcaneDollarFills table, the handler each row's fill calls (N.js:118290,
// ArcaneType.js:110-118, 228-234). Tenteyecle Nostalgia (7) and Beyond All Limits (58) are the bonus itself, Arcane
// Charging (13) counts down from `from`, Astrology Cultism (40) and Pinnacle of Prisma (45) add to their base.
const dollarOf = (entry, index, data) => {
  const fill = gameTable(data, 'arcaneDollarFills')?.[index];
  const values = fill?.values ?? {};
  if (fill?.handler === 'ArcaneType:TenteyeclePCT') return { formula: 'linear', args: { perLevel: entry.x5 } };
  if (fill?.handler === 'ArcaneType:CrystalChargeReq') return { formula: 'growth', args: { func: 'reduce', x1: values.from, x2: entry.x5 } };
  if (fill?.handler !== 'ArcaneType:ArcaneUpgBonus') return null;
  return values.base === undefined
    ? { formula: 'linear', args: { perLevel: entry.x5 } }
    : { formula: 'growth', args: { func: 'bigBase', x1: values.base, x2: entry.x5 / values.divisor } };
};

// Row `row` fills `$` with 1 / PrismaBubDropChance: `base` with no bubble found, no Drop Rate Crossfire and no Primo
// Prisma talent 594 (the arcanePrismaOdds table, N.js:107169, ArcaneType.js:74-85).
const describeOf = (entry, index, data) => {
  const prisma = gameTable(data, 'arcanePrismaOdds');
  return prisma && index === prisma.row ? entry.description.replace('$', formatAmount(prisma.base)) : entry.description;
};

const row = {
  kind: 'tesseractupgrade',
  section: 'tesseract',
  key: (entry, index) => `ArcaneUpg${index}`,
  icon: (entry, index) => `/data/ArcaneUpg${index}.png`,
  fallbackIcon: '/data/StatusArc0.png',
  // UPKEEP: unreleased rows are named Boundless_Energy ("These pages are missing...").
  skip: (entry) => (entry.name === 'Boundless_Energy' ? 'placeholder: missing page' : false),
  describe: describeOf,
  effect: (entry, index, data) => {
    const dollar = dollarOf(entry, index, data);
    return {
      levelLabel: 'Upgrade level',
      // UPKEEP: the buy check is level < x4 (N.js:118290, 118310), so 999999 is a real cap even though the panel prints "Lv x/max" only
      // below 999 (N.js:118290).
      cap: entry.x4,
      terms: [
        { token: '{', formula: 'linear', args: { perLevel: entry.x5 } },
        multiplierTerm(data, 'arcane', entry.x5),
        dollar ? { token: '$', ...dollar } : null
      ].filter(Boolean)
    };
  },
  // The arcaneUpgradeCost table, ArcaneUpgCost (N.js:107167): scale x indexRate^t x (L + (x1 + L) x (x2 + rateBump)^L), before
  // the masterclass and Massivon Hoarding discounts. No table, no price.
  cost: (entry, index, data) => {
    const price = gameTable(data, 'arcaneUpgradeCost');
    return price
      ? {
        formula: 'notateBig',
        args: {
          formula: 'affinePowPlusLevel',
          args: { scale: price.scale * Math.pow(price.indexRate, index), base: entry.x1, rate: entry.x2 + price.rateBump }
        },
        ...tachyonOf(entry.x3, data)
      }
      : null;
  },
  costs: (entry) => [{ item: `Tach${entry.x3}` }],
  fields: (entry, index, data) => {
    const fractal = fractalOf(index, data);
    const backupEnergy = gameTable(data, 'arcaneDollarFills')?.backupEnergyTalent;
    return [
      // The Tesseract is the shop of Arcanist Form (TesseractArcanist).
      formClassField(data, 'TesseractArcanist'),
      // UPKEEP: ArcaneUpgUNLOCKED counts the rows by x6 against the total; the panel's locked line is N.js:118290.
      unlocksAt(entry.x6, 'Tesseract'),
      fractal === null ? null : linked({ label: 'Boosted by', value: spaced(data.tesseract[fractal].name) }, 'boostedBy', nodeId(row, null, fractal)),
      CAPPED_BY[index] ? { label: 'Capped at', value: CAPPED_BY[index] } : null,
      // Backup Energy is the talent CrystalChargeReq lowers the kills by (GetTalentNumber(599)).
      LOWERED_BY[index] && backupEnergy !== undefined ? linked({ label: 'Lowered by', value: LOWERED_BY[index] }, 'boostedBy', `talent:${backupEnergy}`) : null,
      // The (?) help the panel shows beside a row (N.js:118292).
      helpNote(data, 'arcane', index)
    ].filter(Boolean);
  }
};

export default row;
