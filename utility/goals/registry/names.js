import { cleanUnderscore } from '@utility/helpers';

export const cleanUpgradeName = (name) => cleanUnderscore(name
  .replace(/[船般航舞製]/, '')
  .replace('(Tap_for_more_info)', '')
  .replace('(#)', ''));

// Masterclass glyphs plus 千膛, which only show up in the Royal Guardian catalogs (statues, orblet market, armory).
export const cleanText = (str) => cleanUnderscore((str ?? '').replace(/[船般航舞製千膛]/g, ''));
