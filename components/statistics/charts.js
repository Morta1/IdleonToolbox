import { cleanUnderscore, formatNum, number2letter, titleCaseName, worldColor } from '@utility/helpers';
import { chartNum } from '@utility/chartScale';
import { CAULDRON_INFO, cauldronsIndexMapping } from '@parsers/world-2/alchemy';
import {
  cauldrons,
  classes,
  cookingMenu,
  deathNote,
  divStyles,
  exoticMarketInfo,
  gamingPalette,
  gods,
  items,
  jellyUpgrades,
  mineheadUpgrades,
  monsters,
  ninjaUpgrades,
  prayers,
  stamps,
  sushiUpgrades,
  talents
} from '@website-data';
import { altStampsMapping, stampsMapping } from '@parsers/world-1/stamps';
import { CLASSES, getBaseClass } from '@parsers/classDefinitions';
import { flattenTalents } from '@utility/builds/itemRefs';
import { monsterSprite } from '@utility/spriteImages';

// A class too rare to matter still counts toward its base class; one with no base class the game names goes in Other.
export const OTHER_PART = 'Other';

// Total level bands, the worker's statistics splits (b). Ids are the ?band= values.
export const BANDS = [
  { id: 1, label: 'Under 8,000', scope: 'under total level 8,000' },
  { id: 2, label: '8,000 to 13,000', scope: 'at total level 8,000 to 13,000' },
  { id: 3, label: '13,000 to 17,000', scope: 'at total level 13,000 to 17,000' },
  { id: 4, label: '17,000 and up', scope: 'at total level 17,000 and up' }
];
export const parseBand = (value) => (BANDS.some(({ id }) => String(id) === String(value)) ? Number(value) : null);

export const className = (id) => cleanUnderscore(classes?.[id] ?? '');
export const classIcon = (id) => `data/ClassIcons${id}.png`;

const STAMP_TYPES = { combat: 'Combat', skills: 'Skills', misc: 'Misc' };
const TALENT_NAMES = new Map(flattenTalents(talents).map((talent) => [talent.skillIndex, talent.name]));
// The skill icons the leaderboards use for each AFK type (utility/leaderboardIcons.js); Fighting takes its top map's monster.
const AFK_TYPE_ICONS = {
  MINING: 'data/ClassIcons42.png', CHOPPIN: 'data/ClassIcons44.png', FISHING: 'data/ClassIcons45.png',
  CATCHING: 'data/ClassIcons47.png', COOKING: 'data/ClassIcons51.png', LABORATORY: 'data/ClassIcons53.png',
  DIVINITY: 'data/ClassIcons55.png', SPELUNKING: 'data/ClassIcons60.png', Nothing: 'data/Afkz5.png'
};

// Spots whose monster entry has no name or sprite of its own: an idle character, and the three monuments
const SPOT_NAMES = { Nothing: 'Nothing (idle)' };
const SPOT_ICONS = {
  Nothing: 'afk_targets/Nothing.png',
  Bravery_Monument: 'afk_targets/Bravery.png',
  Justice_Monument: 'afk_targets/Justice.png',
  Wisdom_Monument: 'afk_targets/Wisdom.png'
};

// The band's rows, every band's when none is picked
export const inBand = (rows, band) => (band ? (rows ?? []).filter((row) => row.b === band) : (rows ?? []));
const total = (rows, field = 'n') => rows.reduce((sum, row) => sum + (row[field] ?? 0), 0);
// One row per key, its counts (or values) added up across bands and stars
const sumBy = (rows, keyOf, field = 'n') => {
  const sums = new Map();
  for (const row of rows) {
    const key = keyOf(row);
    if (key == null) continue;
    sums.set(key, (sums.get(key) ?? 0) + (row[field] ?? 0));
  }
  return [...sums];
};

// The number of characters and players a selection counts, the denominators of every share
export const counted = (data, band, classId) => {
  const classRows = inBand(data?.classes, band).filter((row) => classId == null || row.c === classId);
  return {
    characters: total(classRows),
    players: total(inBand(data?.players, band)),
    starPlayers: total(inBand(data?.blackStarPlayers, band)),
    // Per Menagerie doubler kind, the players who placed any: { mineheadDoublers: 812, ... }
    ...Object.fromEntries(sumBy(inBand(data?.doublerPlayers, band), (row) => row.k)),
    // A band's median from its row; across every band, the class's own median (medians can't be added up)
    medianLevel: classId == null ? null : band ? classRows[0]?.lv ?? null : data?.classMedians?.find((row) => row.c === classId)?.lv ?? null,
    tooFew: classId != null && classRows.length > 0 && total(classRows) < (data?.minGroup ?? 0)
  };
};

const bubbleName = (cauldronIndex, bubbleIndex) =>
  titleCaseName(cleanUnderscore(cauldrons?.[cauldronsIndexMapping[cauldronIndex]]?.[bubbleIndex]?.bubbleName));
const bubbleIcon = (cauldronIndex, bubbleIndex) => `data/aUpgrades${CAULDRON_INFO[cauldronIndex]?.imageLetter}${bubbleIndex}.png`;
const stampOf = (category, index) => stamps?.[category]?.[index];

// Each chart: its Panel's title and subtitle, its form, which count its shares are of (per), and rows from the
// band's raw rows ({ key, name, icon, tag, value }). 'pct' rows are each a share of the per count (a character
// equips several prayers, so they never add up to the whole); 'share' rows split the whole and fold into Other.
const pctChart = (chart) => ({ form: 'pct', ...chart });

const CHARACTER_CHARTS = {
  prayers: pctChart({
    title: 'Prayers', classTitle: 'Prayers they equip', per: 'characters', nameLabel: 'Prayer',
    rows: (raw) => sumBy(raw, (row) => row.k).map(([prayer, value]) => ({
      key: String(prayer), name: cleanUnderscore(prayers?.[prayer]?.name), icon: `data/Prayer${prayer}.png`, value
    }))
  }),
  superTalents: pctChart({
    title: 'Super talents', classTitle: 'Super talents they pick', per: 'characters', nameLabel: 'Talent',
    subtitle: 'Characters with it in either talent preset',
    rows: (raw) => sumBy(raw, (row) => row.k).map(([talent, value]) => ({
      key: String(talent), name: titleCaseName(cleanUnderscore(TALENT_NAMES.get(talent) ?? `Talent ${talent}`)), icon: `data/UISkillIcon${talent}.png`, value
    }))
  }),
  gods: pctChart({
    title: 'Linked gods', classTitle: 'Gods they link', per: 'characters', nameLabel: 'God',
    subtitle: 'Characters linked to each god',
    rows: (raw) => sumBy(raw, (row) => row.k).map(([slot, value]) => ({
      key: String(slot), name: cleanUnderscore(gods?.[slot]?.name), icon: `data/DivGod${slot}.png`, value
    }))
  }),
  activities: {
    form: 'share', title: 'Activities', per: 'characters', nameLabel: 'Activity', otherNoun: 'activities',
    subtitle: 'What characters do while away',
    // One activity spans many maps (Fighting is every monster map), so each type adds up all of its maps.
    rows: (raw) => {
      const spots = sumBy(raw, (row) => row.k);
      const byType = new Map();
      for (const [spot, value] of spots) {
        const type = monsters?.[spot]?.AFKtype;
        if (!type || type === 'error') continue;
        const entry = byType.get(type) ?? { value: 0, top: null };
        entry.value += value;
        if (!entry.top || value > entry.top[1]) entry.top = [spot, value];
        byType.set(type, entry);
      }
      return [...byType].map(([type, { value, top }]) => ({
        key: type, name: titleCaseName(cleanUnderscore(type)), value,
        icon: AFK_TYPE_ICONS[type] ?? (top ? SPOT_ICONS[top[0]] ?? monsterSprite(top[0]) : undefined)
      }));
    }
  },
  spots: pctChart({
    title: 'AFK spots', classTitle: 'Where they AFK', per: 'characters', nameLabel: 'Spot', from: 'activities',
    rows: (raw) => sumBy(raw, (row) => row.k).filter(([spot]) => monsters?.[spot]?.AFKtype && monsters[spot].AFKtype !== 'error')
      .map(([spot, value]) => ({
        key: spot, value,
        name: SPOT_NAMES[spot] ?? cleanUnderscore(monsters[spot].Name?.trim() || spot),
        icon: SPOT_ICONS[spot] ?? monsterSprite(spot)
      }))
  }),
  prints: pctChart({
    title: '3D printer', classTitle: 'What they print', per: 'characters', nameLabel: 'Sample',
    subtitle: 'Characters printing each sample now',
    rows: (raw) => sumBy(raw, (row) => row.k).map(([item, value]) => ({
      key: item, name: cleanUnderscore(items?.[item]?.displayName ?? item), icon: `data/${item}.png`, value
    }))
  }),
  styles: {
    form: 'share', title: 'Meditation styles', classTitle: 'Meditation styles', per: 'characters', nameLabel: 'Style', otherNoun: 'styles',
    rows: (raw) => sumBy(raw, (row) => row.k).map(([style, value]) => ({
      key: String(style), name: cleanUnderscore(divStyles?.[style]?.name), icon: `etc/Div_Style_${style}.png`, value
    }))
  }
};

const doublerChart = (key, title, nameLabel, nameOf, iconOf) => ({
  [key]: pctChart({
    title, per: key, nameLabel, subtitle: 'Of the players who placed any, each upgrade picked',
    rows: (raw) => sumBy(raw, (row) => row.k).filter(([id]) => nameOf(id) && nameOf(id) !== 'Name')
      .map(([id, value]) => ({ key: String(id), name: nameOf(id), icon: iconOf(id), value }))
  })
});

const PLAYER_CHARTS = {
  pocketGods: pctChart({
    title: 'Pocket divinity', per: 'players', nameLabel: 'God', subtitle: 'Players with each god in a pocket divinity spot',
    rows: (raw) => sumBy(raw, (row) => row.k).map(([slot, value]) => ({
      key: String(slot), name: cleanUnderscore(gods?.[slot]?.name), icon: `data/DivGod${slot}.png`, value
    }))
  }),
  w7Gods: pctChart({
    // A 1-based slot in the save
    title: 'World 7 chosen god', per: 'players', nameLabel: 'God',
    rows: (raw) => sumBy(raw, (row) => row.k - 1).map(([slot, value]) => ({
      key: String(slot), name: cleanUnderscore(gods?.[slot]?.name), icon: `data/DivGod${slot}.png`, value
    }))
  }),
  meals: pctChart({
    title: 'Meals cooking', per: 'players', nameLabel: 'Meal', subtitle: 'Players with a kitchen cooking each meal',
    rows: (raw) => sumBy(raw, (row) => row.k).map(([meal, value]) => ({
      key: String(meal), name: cleanUnderscore(cookingMenu?.[meal]?.name), icon: `data/${cookingMenu?.[meal]?.rawName}.png`, value
    }))
  }),
  blackStars: pctChart({
    title: 'Gaming palette black stars', per: 'starPlayers', nameLabel: 'Colour', subtitle: 'Of the players who placed any, each colour starred',
    rows: (raw) => sumBy(raw, (row) => row.k).map(([colour, value]) => {
      const entry = gamingPalette?.[colour];
      return {
        key: String(colour), name: cleanUnderscore(entry?.name || `Palette ${colour + 1}`), value,
        swatch: entry ? `rgb(${entry.x0}, ${entry.x1}, ${entry.x2})` : undefined
      };
    })
  }),
  // Where players place their limited Menagerie doublers, each a share of the players who placed any of that kind
  ...doublerChart('mineheadDoublers', 'Minehead doublers', 'Upgrade',
    (id) => cleanUnderscore(mineheadUpgrades?.[id]?.name), (id) => `data/MineUpg${id}.png`),
  ...doublerChart('sushiDoublers', 'Sushi doublers', 'Upgrade',
    (id) => cleanUnderscore(sushiUpgrades?.[id]?.[0]), (id) => `data/SushiUpg${id}.png`),
  ...doublerChart('jellyDoublers', 'Jelly Operator doublers', 'Upgrade',
    (id) => cleanUnderscore(jellyUpgrades?.[id]?.[0]), (id) => `data/JellyUpg${id}.png`),
  ...doublerChart('organicLabels', 'Organic labels', 'Exotic market upgrade',
    (id) => titleCaseName(cleanUnderscore(exoticMarketInfo?.[id]?.name)), (id) => `data/FarmCrop${exoticMarketInfo?.[id]?.x2}.png`),
  ...doublerChart('omnijade', 'Omnijade', 'Ninja upgrade',
    (id) => cleanUnderscore(ninjaUpgrades?.[id]?.name), (id) => `data/NjUpgI${id}.png`),
  prismaBubbles: pctChart({
    title: 'Prisma bubbles', per: 'players', nameLabel: 'Bubble', tagLabel: 'Cauldron', subtitle: "Players with it prisma'd",
    rows: (raw) => sumBy(raw, (row) => row.k).flatMap(([bubble, value]) => {
      const match = String(bubble).match(/^([a-zA-Z_]+)(\d+)$/);
      if (!match) return [];
      const cauldronIndex = number2letter.indexOf(match[1]);
      return [{ key: bubble, name: bubbleName(cauldronIndex, match[2]), icon: bubbleIcon(cauldronIndex, match[2]), tag: CAULDRON_INFO[cauldronIndex]?.displayName, value }];
    })
  }),
  exaltedStamps: pctChart({
    title: 'Exalted stamps', per: 'players', nameLabel: 'Stamp', tagLabel: 'Type', subtitle: 'Players with it exalted',
    rows: (raw) => sumBy(raw, (row) => row.k).flatMap(([stamp, value]) => {
      const match = String(stamp).match(/^([a-zA-Z_]+)(\d+)$/);
      const category = match ? altStampsMapping?.[match[1]] : null;
      const entry = category ? stampOf(category, match[2]) : null;
      return entry ? [{ key: stamp, name: cleanUnderscore(entry.displayName), icon: `data/${entry.rawName}.png`, tag: STAMP_TYPES[category], value }] : [];
    })
  }),
  bubbles: {
    form: 'rank', title: 'Bubble levels', per: 'players', unit: 'Levels', nameLabel: 'Bubble', tagLabel: 'Cauldron', subtitle: 'Levels, added up',
    rows: (raw) => sumBy(raw, (row) => `${row.s}-${row.k}`, 'v').map(([key, value]) => {
      const [cauldronIndex, bubbleIndex] = key.split('-');
      return { key, name: bubbleName(cauldronIndex, bubbleIndex), icon: bubbleIcon(cauldronIndex, bubbleIndex), tag: CAULDRON_INFO[cauldronIndex]?.displayName, value };
    })
  },
  stamps: {
    form: 'rank', title: 'Stamp levels', per: 'players', unit: 'Levels', nameLabel: 'Stamp', tagLabel: 'Type', subtitle: 'Levels, added up',
    rows: (raw) => sumBy(raw, (row) => `${row.s}-${row.k}`, 'v').flatMap(([key, value]) => {
      const [arrayIndex, stampIndex] = key.split('-');
      const category = stampsMapping?.[arrayIndex];
      const entry = stampOf(category, stampIndex);
      return entry ? [{ key, name: cleanUnderscore(entry.displayName), icon: `data/${entry.rawName}.png`, tag: STAMP_TYPES[category], value }] : [];
    })
  },
  monsters: {
    form: 'rank', title: 'Killed monsters', per: 'players', unit: 'Kills', nameLabel: 'Monster', tagLabel: 'World', subtitle: 'Kills, added up',
    rows: (raw) => sumBy(raw, (row) => row.k, 'v').filter(([enemy]) => enemy !== '_').map(([enemy, value]) => {
      const world = deathNote.find(({ name }) => name === enemy)?.world;
      return { key: enemy, name: cleanUnderscore(enemy), icon: monsterSprite(enemy), tag: world != null ? `W${world + 1}` : undefined, value };
    })
  }
};

// Columns over a range: one series and a bar each
const SPREAD_CHARTS = {
  totalLevels: {
    // Every band: picked by a total level band, this chart would only show that band back
    form: 'spread', title: 'Total levels', per: 'allPlayers', subtitle: 'Every total level band', unit: 'Players', nameLabel: 'Total level',
    // Every bucket from the first one kept to the last, a missing one at 0, so the axis never jumps a step. A bucket
    // runs to the next one; 18,000 holds everyone past it.
    rows: (raw) => {
      const sent = new Map(sumBy(raw, (row) => row.k));
      const froms = [...sent.keys()].filter((from) => from >= 500).toSorted((a, b) => a - b);
      if (!froms.length) return [];
      const first = froms[0];
      const steps = [500, 600, 700, 800, ...Array.from({ length: 18 }, (_, i) => (i + 1) * 1000)].filter((from) => from >= first);
      return steps.map((from, index) => {
        const next = steps[index + 1];
        const open = next == null;
        return {
          key: String(from), label: `${chartNum(from)}${open ? '+' : ''}`,
          range: open ? `${formatNum(from)}+` : `${formatNum(from)} to ${formatNum(next - 1)}`,
          values: { count: sent.get(from) ?? 0 }
        };
      });
    }
  },
  worlds: {
    form: 'spread', title: 'World reached', per: 'players', unit: 'Players', nameLabel: 'World',
    // The game's own world colors, allowed because every column is named.
    rows: (raw) => sumBy(raw, (row) => row.k).filter(([world]) => Number(world) >= 1).toSorted((a, b) => a[0] - b[0])
      .map(([world, count]) => ({ key: String(world), label: `W${world}`, range: `World ${world}`, color: worldColor[world - 1], values: { count } }))
  },
  accountAge: {
    form: 'spread', title: 'Account age', per: 'players', subtitle: 'Players, by years since the account was made', unit: 'Players', nameLabel: 'Years',
    rows: (raw) => sumBy(raw, (row) => row.k).filter(([age]) => age >= 0).toSorted((a, b) => a[0] - b[0])
      .map(([age, count]) => ({ key: String(age), label: String(age), range: age === 0 ? 'Under 1 year' : age === 1 ? '1 year' : `${age} years`, values: { count } }))
  },
  slots: {
    form: 'stacked', title: 'Class per slot', per: 'characters', unit: 'Characters', nameLabel: 'Slot',
    // Each base class keeps its series slot whatever its count, in this order, Beginner at the bottom.
    series: [CLASSES.Beginner, CLASSES.Warrior, CLASSES.Archer, CLASSES.Mage, OTHER_PART],
    rows: (raw) => {
      const slots = Array.from({ length: 11 }, (_, i) => ({ key: `slot-${i}`, label: String(i + 1), range: `Slot ${i + 1}`, values: {} }));
      for (const row of raw) {
        const slot = slots[row.k];
        if (!slot) continue;
        const baseClass = getBaseClass(classes?.[row.c]);
        const part = [CLASSES.Beginner, CLASSES.Warrior, CLASSES.Archer, CLASSES.Mage].includes(baseClass) ? baseClass : OTHER_PART;
        slot.values[part] = (slot.values[part] ?? 0) + row.n;
      }
      return slots;
    }
  }
};

export const CLASS_DISTRIBUTION = {
  form: 'share', title: 'Class distribution', per: 'allCharacters', nameLabel: 'Class', otherNoun: 'classes',
  // Every class: the small ones fold into Other, so the shares add up to the whole.
  rows: (raw) => sumBy(raw, (row) => row.c).map(([id, value]) => ({ key: String(id), name: className(id), icon: classIcon(id), value }))
};

const ALL_CHARTS = { ...CHARACTER_CHARTS, ...PLAYER_CHARTS, ...SPREAD_CHARTS, classes: CLASS_DISTRIBUTION };
// Charts that always count every band: Total levels picked by a total level band would only show that band back.
const EVERY_BAND = new Set(['totalLevels']);

// The all-classes view's tabs (the ?t= values), each a list of groups under an optional heading. Each tab counts one
// kind of thing: characters, players' account choices, and the player base itself.
export const STATISTICS_TABS = [
  { key: 'Characters', groups: [{ charts: ['prayers', 'superTalents', 'gods', 'activities', 'prints', 'styles'] }] },
  {
    key: 'Account', groups: [
      { title: 'Doublers', charts: ['mineheadDoublers', 'sushiDoublers', 'jellyDoublers', 'organicLabels', 'omnijade'] },
      { title: 'Other choices', charts: ['pocketGods', 'w7Gods', 'meals', 'blackStars', 'prismaBubbles', 'exaltedStamps'] }
    ]
  },
  {
    key: 'Players', groups: [
      { charts: ['classes', 'monsters', 'bubbles', 'stamps'] },
      { title: 'Player base', charts: ['slots', 'totalLevels', 'worlds', 'accountAge'] }
    ]
  }
];

// One chart with the raw rows it reads for the band
const entryOf = (data, band, key) => {
  const chart = ALL_CHARTS[key];
  return { key, chart, raw: inBand(data?.[chart.from ?? key], EVERY_BAND.has(key) ? null : band) };
};

// The class view's charts, in order: its class's panels, then the class split
export const classChartsFor = (data, band) => [
  ...['prayers', 'superTalents', 'gods', 'spots', 'prints', 'styles']
    .map((key) => ({ ...entryOf(data, band, key), title: ALL_CHARTS[key].classTitle })),
  entryOf(data, band, 'classes')
];

// The all-classes view: each tab's groups with their charts
export const tabsFor = (data, band) => STATISTICS_TABS.map((tab) => ({
  ...tab,
  groups: tab.groups.map((group) => ({ ...group, charts: group.charts.map((key) => entryOf(data, band, key)) }))
}));

// Every chart either view draws, flat: what the tests read
export const chartsFor = (data, band, classId) => (classId != null
  ? classChartsFor(data, band)
  : tabsFor(data, band).flatMap((tab) => tab.groups.flatMap((group) => group.charts)));
