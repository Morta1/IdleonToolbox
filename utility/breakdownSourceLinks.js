// Where a breakdown line's bonus comes from: the page and tab the drawer's link opens. Breakdown lines are named
// for their source as the game names it (Vial, Star Sign, Arcade (Class XP Multi)), so one entry links that source
// in every breakdown. A line the map gets wrong sets its own `link` (parsers/breakdown.ts). Data-free, so any page
// can import it. Every target is checked against the nav's pages and tabs by breakdown-source-links.test.js.

const page = (url, tab, nestedTab) => ({ url, ...(tab ? { tab } : {}), ...(nestedTab ? { nestedTab } : {}) });

const W2 = '/account/world-2';
const W3 = '/account/world-3';
const W4 = '/account/world-4';
const W5 = '/account/world-5';
const W6 = '/account/world-6';
const W7 = '/account/world-7';
const MISC = '/account/misc';
const CLASS = '/account/class-specific';

// Keyed by the source's name; matched through sourceKey, so case, a plural s and a trailing (detail) don't matter
const SOURCES = {
  // Account
  statue: page(`${MISC}/general`),
  shrine: page(`${MISC}/general`),
  'family obol': page(`${MISC}/general`),
  obol: page(`${MISC}/general`),
  'star sign': page(`${MISC}/constellations`, 'Star Signs'),
  constellation: page(`${MISC}/constellations`, 'Constellations'),
  'upgrade vault': page(`${MISC}/upgrade-vault`),
  vault: page(`${MISC}/upgrade-vault`),
  'vault upgrade': page(`${MISC}/upgrade-vault`),
  'event shop': page(`${MISC}/event-shop`),
  guild: page(`${MISC}/guild`, 'Bonuses'),
  'Guild bonus': page(`${MISC}/guild`, 'Bonuses'),
  dungeon: page(`${MISC}/dungeons`),
  'Friend bonus': page(`${MISC}/friends-stats`),
  companion: page(`${MISC}/tournament`, 'Companions'),
  achievement: page('/account/task-board/achievements'),
  merit: page('/account/task-board/merits'),
  task: page('/account/task-board/tasks'),
  bundle: page('/account/prem-currency/bundles', 'Bundles'),
  'gem bundle': page('/account/prem-currency/bundles', 'Bundles'),
  'gem shop': page('/account/prem-currency/gem-shop'),
  owl: page('/account/clickers/owl'),
  kangaroo: page('/account/clickers/kangaroo'),
  roo: page('/account/clickers/kangaroo'),
  bubba: page('/account/clickers/bubba'),

  // Class specific
  grimoire: page(`${CLASS}/grimoire`, 'Upgrades'),
  compass: page(`${CLASS}/compass`, 'Upgrades'),
  medallion: page(`${CLASS}/compass`, 'Medallions'),
  tesseract: page(`${CLASS}/tesseract`, 'Upgrades'),
  'tesseract map': page(`${CLASS}/tesseract`, 'Maps'),
  'royal statue': page(`${CLASS}/royal-armory`, 'Royal Statues'),
  'royal armory': page(`${CLASS}/royal-armory`, 'Armory'),
  armory: page(`${CLASS}/royal-armory`, 'Armory'),
  outpost: page(`${CLASS}/royal-armory`, 'Outposts'),
  orblet: page(`${CLASS}/royal-armory`, 'Orblet Market'),

  // World 1
  stamp: page('/account/world-1/stamps'),
  bribe: page('/account/world-1/bribes'),

  // World 2
  bubble: page(`${W2}/bubbles`),
  cauldron: page(`${W2}/cauldrons`),
  vial: page(`${W2}/vials`),
  sigil: page(`${W2}/sigils`),
  arcade: page(`${W2}/arcade-shop`),
  island: page(`${W2}/islands`),
  'island shimmer': page(`${W2}/islands`),
  killroy: page(`${W2}/killroy`, 'Upgrades'),
  'Weekly boss': page(`${W2}/weekly-bosses`),
  vote: page(`${W2}/vote-ballot`, 'Bonus'),
  ballot: page(`${W2}/vote-ballot`, 'Bonus'),
  'vote bonus': page(`${W2}/vote-ballot`, 'Bonus'),
  meritocracy: page(`${W2}/vote-ballot`, 'Meritocracy'),

  // World 3
  printer: page(`${W3}/printer`),
  refinery: page(`${W3}/refinery`),
  'atom collider': page(`${W3}/atom-collider`),
  atom: page(`${W3}/atom-collider`),
  equinox: page(`${W3}/equinox`, 'Upgrades'),
  'equinox multi': page(`${W3}/equinox`, 'Upgrades'),
  'death note': page(`${W3}/death-note`),
  worship: page(`${W3}/worship`),
  totem: page(`${W3}/worship`, 'Totems'),
  prayer: page(`${W3}/prayers`),
  trap: page(`${W3}/traps`),
  'salt lick': page(`${W3}/salt-lick`),
  'hat rack': page(`${W3}/hat-rack`),

  // World 4
  meal: page(`${W4}/cooking`, 'Meals'),
  'meal level bonus': page(`${W4}/cooking`, 'Meals'),
  ribbon: page(`${W4}/cooking`, 'Ribbons'),
  'cooking mastery node': page(`${W4}/cooking`, 'Mastery'),
  shiny: page(`${W4}/breeding`, 'Mobs', 'Shinies'),
  'shiny pet': page(`${W4}/breeding`, 'Mobs', 'Shinies'),
  'pet arena': page(`${W4}/breeding`, 'Arena'),
  lab: page(`${W4}/laboratory`, 'Main frame'),
  laboratory: page(`${W4}/laboratory`, 'Main frame'),
  jewel: page(`${W4}/laboratory`, 'Main frame'),
  chip: page(`${W4}/laboratory`, 'Console'),
  rift: page(`${W4}/rift`, 'Bonuses'),
  'skill mastery': page(`${W4}/rift`, 'Skill Mastery'),
  'construct mastery': page(`${W4}/rift`, 'Construct Mastery'),
  tome: page(`${W4}/tome`),
  'tome multi': page(`${W4}/tome`),
  'tome epilogue': page(`${W4}/tome`),
  'cape vine': page(`${W4}/cape-vine`),

  // World 5
  artifact: page(`${W5}/sailing`, 'Artifacts'),
  'gold relic': page(`${W5}/sailing`, 'Artifacts'),
  'frost relic artifact': page(`${W5}/sailing`, 'Artifacts'),
  captain: page(`${W5}/sailing`, 'Boats and Captains'),
  god: page(`${W5}/divinity`, 'Gods'),
  divinity: page(`${W5}/divinity`, 'Gods'),
  'coral kid upgrade': page(`${W5}/divinity`, 'Coral Kid Upgrades'),
  'coral kid': page(`${W5}/divinity`, 'Coral Kid Upgrades'),
  superbit: page(`${W5}/gaming`, 'Superbits'),
  palette: page(`${W5}/gaming`, 'Palette'),
  mutation: page(`${W5}/gaming`, 'Mutations'),
  schematic: page(`${W5}/hole`, 'Engineer'),
  measurement: page(`${W5}/hole`, 'Measure'),
  study: page(`${W5}/hole`, 'Study'),
  lamp: page(`${W5}/hole`, 'Explore', 'The Lamp'),
  fountain: page(`${W5}/hole`, 'Explore', 'The Fountain'),
  'the fountain': page(`${W5}/hole`, 'Explore', 'The Fountain'),
  slab: page(`${W5}/slab`),

  // World 6
  'exotic market': page(`${W6}/farming`, 'Exotic Market'),
  sticker: page(`${W6}/farming`, 'Stickers'),
  'land rank': page(`${W6}/farming`, 'Rank database'),
  'land rank total': page(`${W6}/farming`, 'Rank database'),
  'crop depot': page(`${W6}/farming`, 'Crop'),
  'jade emporium': page(`${W6}/sneaking`, 'Jade Emporium'),
  charm: page(`${W6}/sneaking`, 'Charms'),
  'pristine charm': page(`${W6}/sneaking`, 'Charms'),
  'ninja mastery': page(`${W6}/sneaking`, 'Mastery'),
  gemstone: page(`${W6}/sneaking`, 'Gemstones'),
  summoning: page(`${W6}/summoning`, 'Upgrades'),
  'Winner bonus': page(`${W6}/summoning`, 'Winner Bonuses'),
  'Winner bonuses': page(`${W6}/summoning`, 'Winner Bonuses'),
  beanstalk: page(`${W6}/beanstalk`),
  emperor: page(`${W6}/emperor`),

  // World 7
  spelunk: page(`${W7}/spelunking`, 'Upgrades'),
  spelunking: page(`${W7}/spelunking`, 'Upgrades'),
  elixir: page(`${W7}/spelunking`, 'Elixirs'),
  research: page(`${W7}/research`, 'Grid'),
  'research grid': page(`${W7}/research`, 'Grid'),
  observation: page(`${W7}/research`, 'Observations'),
  gallery: page(`${W7}/gallery`, 'Trophies'),
  trophy: page(`${W7}/gallery`, 'Trophies'),
  nametag: page(`${W7}/gallery`, 'Nametags'),
  'legend talent': page(`${W7}/legend-talents`),
  'dancing coral': page(`${W7}/coral-reef`, 'Dancing Coral'),
  reef: page(`${W7}/coral-reef`, 'Reef Upgrades'),
  'zenith market': page(`${W7}/zenith-market`),
  'clam work': page(`${W7}/clam-work`, 'Upgrades'),
  minehead: page(`${W7}/minehead`, 'Upgrades'),
  glimbo: page(`${W7}/glimbo`),
  'glimbo dr': page(`${W7}/glimbo`),
  sushi: page(`${W7}/sushi-station`, 'Sushi'),
  'sushi station': page(`${W7}/sushi-station`, 'Upgrades'),
  'jelly operator': page(`${W7}/jelly-operator`, 'Upgrades'),
  menagerie: page(`${W7}/menagerie`),
  'the button': page(`${W7}/the-button`),
  button: page(`${W7}/the-button`),
  'button bonus': page(`${W7}/the-button`)
};

// 'Arcade (Class XP Multi)' -> 'arcade', 'Star Signs' -> 'star sign'
export const sourceKey = (name) => String(name ?? '').replace(/\s*\(.*\)\s*$/, '').trim().toLowerCase()
  .replace(/s$/, '');

export const BREAKDOWN_SOURCES = SOURCES;
const BY_KEY = Object.fromEntries(Object.entries(SOURCES).map(([name, link]) => [sourceKey(name), link]));

// The link a breakdown line shows: its own when it sets one (false: none), else its name's entry
export const breakdownLinkFor = (line) => {
  if (line?.link !== undefined) return line.link || undefined;
  return BY_KEY[sourceKey(line?.name)];
};

// The href a link opens, in the query the nav and quick search use for tabs. session: the params that keep the save
// being viewed (sessionQuery: a profile, the demo), as every nav link carries them
/**
 * @param {{ url: string, tab?: string, nestedTab?: string }} link
 * @param {Record<string, string | string[]>} [session]
 */
export const breakdownLinkHref = ({ url, tab, nestedTab }, session = {}) => ({
  pathname: url,
  query: { ...session, ...(tab ? { t: tab } : {}), ...(nestedTab ? { nt: nestedTab } : {}) }
});
