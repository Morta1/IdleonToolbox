// Data-free on purpose: the NavBar imports this on every page, so no parsers, @website-data or registry here.
export const GOAL_ROUTES = {
  bubble: '/account/world-2/bubbles',
  stamp: '/account/world-1/stamps',
  grimoire: '/account/class-specific/grimoire',
  compass: '/account/class-specific/compass',
  tesseract: '/account/class-specific/tesseract',
  armory: '/account/class-specific/royal-armory',
  item: '/tools/material-tracker',
  greenstack: '/tools/material-tracker',
  skill: '/characters',
  talent: '/characters',
  starTalent: '/characters',
  postOffice: '/characters',
  charLevel: '/characters',
  statue: '/account/misc/general',
  forge: '/account/world-1/forge',
  owl: '/account/clickers/owl',
  bribe: '/account/world-1/bribes',
  arcade: '/account/world-2/arcade-shop',
  vial: '/account/world-2/vials',
  sigil: '/account/world-2/sigils',
  cauldronUpgrade: '/account/world-2/cauldrons',
  killroyKills: '/account/world-2/killroy',
  killroyUpgrade: '/account/world-2/killroy',
  killroyShop: '/account/world-2/killroy',
  kangaroo: '/account/clickers/kangaroo',
  island: '/account/world-2/islands'
};

const ROUTES = new Set(Object.values(GOAL_ROUTES));

export const hasGoals = (pathname) => ROUTES.has(String(pathname ?? '').split(/[?#]/)[0].replace(/\/$/, ''));
