// Leaderboard metric -> sprite under public/ (no extension). Boards without one get a monogram.
const SKILL_ICONS = {
  mining: 42, smithing: 43, choppin: 44, fishing: 45, alchemy: 46, catching: 47, trapping: 48, construction: 49,
  worship: 50, cooking: 51, breeding: 52, laboratory: 53, sailing: 54, divinity: 55, gaming: 56, farming: 57,
  sneaking: 58, summoning: 59, spelunking: 60, research: 61
};

export const metricIcon = (metric) => (SKILL_ICONS[metric] ? `data/ClassIcons${SKILL_ICONS[metric]}` : null);

const FILLER = new Set(['Total', 'Highest', 'Best', 'Most', 'Biggest']);

export const monogram = (label = '') => {
  const words = label.split(/\s+/).filter(Boolean);
  const word = words.find((entry) => !FILLER.has(entry)) ?? words[0];
  return word ? word.slice(0, 2) : '?';
};
