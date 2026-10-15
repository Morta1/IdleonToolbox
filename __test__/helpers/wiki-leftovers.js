import { firstLevel, levelledText } from '../../utility/wiki/effects.mjs';

// What must never reach a wiki page: a game placeholder no number filled, or a value that is not text. `&` stays legal
// because game text uses it literally (Lamp Wish 4 "Shiny Mob LV Up & Breedability"); `]` is guild bonus 9's member cap.
export const LEFTOVER = /[{}$#@^~|<\]]|NaN|Infinity|\bundefined\b|\bnull\b|\[object Object\]/;
const LEFTOVER_ALL = new RegExp(LEFTOVER.source, 'g');

// Everything a page prints for one levelled thing: its text at its first level, 10 and its cap, and its field values.
const textsOf = (entry) => {
  const { effect } = entry;
  const description = typeof entry.description === 'string'
    ? (effect ? [firstLevel(entry), 10, effect.cap ?? 1000].map((level) => levelledText(entry, level)) : [entry.description])
    : [];
  const fields = Array.isArray(entry.fields) ? entry.fields.map(({ value }) => [].concat(value).join(' ')) : [];
  return [...description, ...fields];
};

// How many leftovers each node, sub-entry or catalog row of a builder's output prints, by its path in the output.
// Only a count above the same output's with every table present is a defect: item texts hold `#` and `^` of their own.
export const leftovers = (output) => {
  const counts = {};
  const visit = (value, at) => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${at}[${index}]`));
      return;
    }
    if (!value || typeof value !== 'object') return;
    if ('description' in value || 'fields' in value) {
      const count = textsOf(value).reduce((sum, text) => sum + (String(text ?? '').match(LEFTOVER_ALL)?.length ?? 0), 0);
      if (count) counts[at] = count;
    }
    for (const [key, child] of Object.entries(value)) {
      if (!['effect', 'cost', 'fields', 'description'].includes(key)) visit(child, at ? `${at}.${key}` : key);
    }
  };
  visit(output, '');
  return counts;
};

// The paths whose leftovers grew from `baseline` (the same output with every table present) to `now`.
export const grownLeftovers = (baseline, now) => Object.entries(now)
  .filter(([at, count]) => count > (baseline[at] ?? 0))
  .map(([at, count]) => `${at}: ${count}`);
