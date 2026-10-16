// Text helpers every wiki kind runs the game's strings through. They lived in nodes/catalogs-b.mjs;
// the registry needs the same ones, and two copies drift.
import { dropUnfilled, formatAmount } from '../../../utility/wiki/effects.mjs';

export { dropUnfilled };

// A game name as page text. A name may carry a trailing underscore in the data (`Kingdom_Flags `).
export const spaced = (text) => String(text ?? '').replace(/_/g, ' ').trim();

// UPKEEP: the bonus panels fill `{` with round(value) and `}` with MultiplierInfo(1 + value / 100) (N.js:122228 sushi, 122505 jelly, 122849 minehead; Ninja.js:583 pristine); the wiki trims MultiplierInfo's two-decimal padding. Not extracted: the fill is four panels' draw code, which no locator may anchor on.
export const fillBonus = (text, value) => String(text)
  .split('{').join(formatAmount(Math.round(value)))
  .split('}').join((Math.round((1 + value / 100) * 100) / 100).toLocaleString('en-US', { maximumFractionDigits: 2 }));

// Characters the game's font draws as glyphs, which are not text anywhere else.
// UPKEEP: a game patch that adds a glyph to the font needs it added here; check the raw strings for stray CJK.
// 蒲 and 识 are the Sushi Station's fireplace and fuel currency icons (shared-data sushiUpgrades 25 and 28).
// 膛 is the Royal Armory's button glyph (Purity Rank, armoryUpgrades 75: "Click the 膛 button").
export const GLYPHS = /[船般航舞製贫鉢尬蒲识膛]/g;

// `@` is the game's line break. It becomes a sentence break, or just a space when the sentence has
// already ended (or a colon opens a list), so a two-line description reads as two sentences.
export const breakLines = (text) => text.replace(/_*(?:@_*)+/g, (match, offset, whole) => (
  /[.!?):]$/.test(whole.slice(0, offset)) ? '_' : '._'
));

// The "Total Bonus: ..." tail is a live readout of the player's own total, which is all
// placeholders without a save.
// The Lab writes it as "@ - @ Total Bonus:", so the dash between the two breaks goes with it.
// UPKEEP: the "Total_Bonus:" label is the game's wording; re-check it when a patch reworks the readout line.
export const dropReadout = (text) => text.replace(/(?:_*@)*(?:_*-(?:_*@)+)?_*Total_Bonus:.*$/i, '');

export const tidy = (text) => breakLines(String(text || '').replace(GLYPHS, ''))
  .replace(/_+/g, '_')
  .replace(/^_|_$/g, '');

// Ends a clause with a full stop unless the game's own text already did.
export const sentence = (text) => (/[.!?]$/.test(text) ? text : `${text}.`);

// The placeholders a term fills in a game description. `?` is left out: the game's own sentences end in it, so only the
// term that fills one (the Tar Pit's) tells the two apart, and levelledText drops that sentence itself.
export const PLACEHOLDERS = ['$', '{', '}', '#', '^', ']', '~', '|', '<', '>'];

// A levelled text (a node or sub-entry with an effect, or any registry page) without the sentences whose placeholder no
// term fills: a builder leaves the term out when the table behind it is absent, and the raw `$` must not reach the page.
const withoutUnfilled = (entry, levelled) => {
  if (!levelled || typeof entry?.description !== 'string') return;
  const tokens = (entry.effect?.terms ?? []).map(({ token }) => token);
  const unfilled = PLACEHOLDERS.filter((mark) => !tokens.some((token) => token.includes(mark)));
  const text = dropUnfilled(entry.description, unfilled);
  if (text !== entry.description) entry.description = text || null;
};

// The build's last pass over the finished nodes, after every enricher: the same rule levelledText applies to a term that
// cannot run, for the tokens no term is left to fill.
export const dropUnfilledSentences = (nodes) => {
  for (const node of Object.values(nodes)) {
    if (!node || typeof node !== 'object') continue;
    withoutUnfilled(node, Boolean(node.effect || node.registry));
    for (const entry of [...(Array.isArray(node.entries) ? node.entries : []), node.familyBonus]) withoutUnfilled(entry, Boolean(entry?.effect));
  }
  return nodes;
};

// titleCase and its acronym list live in a data-free module the wiki components import as well.
export { KEEP_UPPER, titleCase } from '../../../utility/wiki/categories.mjs';
