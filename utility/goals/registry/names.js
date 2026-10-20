import { cleanUnderscore } from '@utility/helpers';

export const cleanUpgradeName = (name) => cleanUnderscore(name
  .replace(/[船般航舞製]/, '')
  .replace('(Tap_for_more_info)', '')
  .replace('(#)', ''));

// Same rule as the Royal Guardian pages (Armory, OrbletMarket, RoyalStatues).
export const cleanText = (str) => cleanUnderscore((str ?? '').replace(/[船般航舞製千膛]/g, ''));
