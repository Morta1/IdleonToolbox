// Text helpers every wiki kind runs the game's strings through. They lived in nodes/catalogs-b.mjs;
// the registry needs the same ones, and two copies drift.
import { formatAmount } from '../../../utility/wiki/effects.mjs';

// A game name as page text. A name may carry a trailing underscore in the data (`Kingdom_Flags `).
export const spaced = (text) => String(text ?? '').replace(/_/g, ' ').trim();

// UPKEEP: the bonus panels fill `{` with round(value) and `}` with MultiplierInfo(1 + value / 100) (N.js:122228 sushi, 122505 jelly, 122849 minehead; Ninja.js:583 pristine); the wiki trims MultiplierInfo's two-decimal padding.
export const fillBonus = (text, value) => String(text)
  .split('{').join(formatAmount(Math.round(value)))
  .split('}').join((Math.round((1 + value / 100) * 100) / 100).toLocaleString('en-US', { maximumFractionDigits: 2 }));

// Characters the game's font draws as glyphs, which are not text anywhere else.
// UPKEEP: a game patch that adds a glyph to the font needs it added here; check the raw strings for stray CJK.
// 蒲 and 识 are the Sushi Station's fireplace and fuel currency icons (shared-data sushiUpgrades 25 and 28).
export const GLYPHS = /[船般航舞製贫鉢尬蒲识]/g;

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

// Acronyms the game writes in capitals that title case would turn into a word (VIP_PARCHMENT,
// EVOLUTION_GMO, OG_FERTILIZER), and the roman numerals that end tiered names (SPROUTLUCK_II).
// UPKEEP: one-letter numerals (I, V) already survive; add any new acronym a patch's names use.
const KEEP_UPPER = new Set(['VIP', 'GMO', 'OG', 'II', 'III', 'IV']);

// The game writes most names in capitals with underscores. Underscores stay so cleanUnderscore
// still turns them into spaces at render time.
export const titleCase = (text) => String(text || '')
  .split('_')
  .map((word) => (KEEP_UPPER.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()))
  .join('_');
