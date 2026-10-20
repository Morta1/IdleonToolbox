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
  charLevel: '/characters'
};

const ROUTES = new Set(Object.values(GOAL_ROUTES));

export const hasGoals = (pathname) => ROUTES.has(String(pathname ?? '').split(/[?#]/)[0].replace(/\/$/, ''));
