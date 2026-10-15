// Which kinds get a listing page of their own, and the order they are offered in. Biggest first,
// which also puts the two categories nobody browses by name (items, monsters) where the eye lands.
// Shops is 9 entries and sits last.
//
// Quest is deliberately absent. A quest's name means nothing without its giver ("Cool Coloured
// Bows" is Glumlee's third), the 348 of them carry no category to band by, and every one is
// reached from the NPC that gives it: an NPC page already renders its whole chain in full, with
// the step number, the objectives and both item lists. A flat A-Z of 348 names is a worse way to
// find any of them than the NPC page or the search box, so quests keep their pages and lose the
// catalog. Nothing is stranded by that: all 348 have a giver, so the NPC listing still reaches
// every quest page in two hops.
//
// Shop is absent for the same reason once removed. All nine are named for the town they sit in, so
// the tile was a second list of nine names already in Maps. They are reached three ways: an item's
// "Sold by" (149 links), the town map's "Shop", and the 29 town NPCs that carry the shop of the
// town they stand in.
//
// Map is absent too. Nobody arrives at the wiki wanting an area: they want an item or a mob, and
// the map is where that trail leads rather than where it starts. Most are one hop from a monster's
// "Found in" or an NPC's, and following the portals reaches almost all of them. World is what
// covers the rest: Grand Owl Perch, The Oasis and How_Did_u_get_here host nothing and connect to
// nothing, so they were pages nothing linked to until their world listed them.
// World IS worth browsing where its 163 areas are not. Seven tiles, each the game's own map art,
// and "what is in World 3" is the question somebody asks before they know an area's name.
// Bundles ARE worth browsing, unlike the shops: 34 of them, each a set of things bought together,
// and "what was in that pack" is the question they exist to answer.
// Achievements ARE worth browsing: 420 of them, banded by world, and the question "what is left to
// do in World 3" is a list question rather than a search one.
//
// The game systems ARE worth browsing the same way the bubbles are: a lab chip, a meal, a prayer or
// a building is a bonus somebody wants to compare against the rest of its set. Spices and stations
// are not: a spice page is a name and the chip that costs it, and the stations are reached from their
// items, or from search (the Coral Reef, which consumes no item).
//
// Grouped, because sixteen flat rows stopped reading as a menu: the encyclopedia of things met
// anywhere, then the systems under the world that introduces them, which is how a player already
// files them ("the World 4 lab"). A system added later goes under its world's group, or opens one.
// The encyclopedia is the one group always open; the rest fold in the rail (`collapsible`).
//
// The groups and the order inside them follow the app's own account menu (components/constants.jsx),
// so a player finds a system in the wiki where they already find its page. That is also why the three
// clickers leave their worlds for a group of their own, sitting where the menu puts them: after the
// account and before World 1. Inside a group, an entry is a kind, or a game system holding two or more
// kinds (`{ label, kinds }`) under the name the menu gives it, or the game's where the menu has none.
// A system of one kind stays a plain kind: a heading over a single row folds away nothing. The plain
// kinds come first, so on the home page their tiles sit straight under the world's heading rather than
// trailing a system's tiles as though they were part of it.
const GROUPS = [
  { label: 'Encyclopedia', entries: ['item', 'monster', 'npc', 'world', 'class', 'talent'] },
  // What belongs to the account rather than to a place in the game: progress, companions, purchases,
  // the account-wide vault, the guild, the Task Board's merit shops and the dungeons.
  {
    label: 'Account',
    collapsible: true,
    entries: [
      'pet', 'bundle', 'vault', 'guildbonus',
      { label: 'Task Board', kinds: ['achievement', 'meritshop'] },
      { label: 'Dungeons', kinds: ['dungeonitem', 'dungeonpassive', 'dungeontrait'] }
    ]
  },
  // The Kangaroo is one clicker with two shops, so it is the one system here. The heading already says
  // clicker, so its entries use the app menu's own names (Owl, Bubba) rather than "... Upgrades".
  {
    label: 'Clickers',
    collapsible: true,
    shortLabels: true,
    entries: ['owl', 'bubbaupgrade', { label: 'Kangaroo', kinds: ['poppy', 'tarpit'] }]
  },
  {
    label: 'World 1',
    collapsible: true,
    entries: ['starsign', 'constellation', 'statue', 'bribe']
  },
  // The menu gives bubbles, vials and sigils a page each rather than one Alchemy page, so they stay apart here too.
  { label: 'World 2', collapsible: true, entries: ['bubble', 'vial', 'sigil', 'postbox', 'arcade', 'weeklyboss'] },
  {
    label: 'World 3',
    collapsible: true,
    entries: ['atom', 'building', 'totem', 'prayer', 'armorset', { label: 'Equinox', kinds: ['equinox', 'dream'] }]
  },
  {
    label: 'World 4',
    collapsible: true,
    entries: [
      'meal', 'tome',
      { label: 'Breeding', kinds: ['gene', 'petupgrade'] },
      { label: 'Laboratory', kinds: ['chip', 'jewel', 'labbonus'] },
      { label: 'Rift', kinds: ['rift', 'riftbonus'] }
    ]
  },
  {
    label: 'World 5',
    collapsible: true,
    entries: [
      { label: 'Sailing', kinds: ['artifact', 'sailingisland'] },
      { label: 'Divinity', kinds: ['god', 'divstyle'] },
      { label: 'Gaming', kinds: ['superbit', 'gamingimport', 'palette'] },
      {
        label: 'Hole',
        kinds: ['cavern', 'schematic', 'majik', 'lampwish', 'fountainupgrade', 'jarcollectible', 'coveupgrade']
      }
    ]
  },
  {
    label: 'World 6',
    collapsible: true,
    entries: [
      { label: 'Farming', kinds: ['marketupgrade', 'exoticupgrade', 'seed', 'landrank', 'sticker'] },
      { label: 'Sneaking', kinds: ['jade', 'ninjaupgrade', 'pristinecharm', 'ninjaitem'] },
      { label: 'Summoning', kinds: ['summoningupgrade', 'summoningbattle'] }
    ]
  },
  {
    label: 'World 7',
    collapsible: true,
    entries: [
      'legendtalent', 'zenithupgrade', 'advicefish',
      { label: 'Spelunking', kinds: ['spelunkupgrade', 'spelunktunnel'] },
      // Stickers come out of the Sticker Depot research square, and the game keeps them in the research data.
      { label: 'Research', kinds: ['researchsquare', 'observation'] },
      { label: 'Minehead', kinds: ['mineheadupgrade', 'mineheadopponent'] },
      { label: 'Sushi Station', kinds: ['sushiupgrade', 'sushi'] },
      { label: 'Jelly Operator', kinds: ['jellyupgrade', 'jellyobstruction'] }
    ]
  },
  {
    label: 'Master Classes',
    collapsible: true,
    entries: [
      'grimoireupgrade', 'compassupgrade', 'tesseractupgrade',
      { label: 'Royal Armory', kinds: ['armoryupgrade', 'orbletupgrade'] }
    ]
  }
];

// `kinds` is every kind a group lists, systems flattened in place, for the consumers that only need membership or order.
export const KIND_GROUPS = GROUPS.map((group) => ({
  ...group,
  kinds: group.entries.flatMap((entry) => entry.kinds || entry)
}));

export const LISTED_KINDS = KIND_GROUPS.flatMap((group) => group.kinds);

export const hasListing = (kind) => LISTED_KINDS.includes(kind);

// Whether a page is a row of its kind's listing. `catalog: false` keeps a page out of the listing
// without taking the page away: the 130 chests, souls, critters, Forges, Monuments and resource
// nodes in monsters.json all carry real drop tables, and an item citing "dropped by Bronze Chest(W1)"
// still has somewhere to go. Takes a graph node or a search-index row, so the hub's counts and the
// listing can never disagree about what a row is.
export const inListing = (page) => page.navigable !== false && page.catalog !== false && Boolean(page.slug);
