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
// are not: a spice page is a name and the chip that costs it, and the two stations are reached from
// their items.
//
// Grouped, because sixteen flat rows stopped reading as a menu: the encyclopedia of things met
// anywhere, then the systems under the world that introduces them, which is how a player already
// files them ("the World 4 lab"). A system added later goes under its world's group, or opens one.
// The encyclopedia is the one group always open; the rest fold in the rail (`collapsible`).
export const KIND_GROUPS = [
  { label: 'Encyclopedia', kinds: ['item', 'monster', 'npc', 'world', 'class', 'talent'] },
  // What belongs to the account rather than to a place in the game: progress, companions, purchases
  // and the account-wide vault.
  { label: 'Account', kinds: ['achievement', 'pet', 'bundle', 'vault'], collapsible: true },
  { label: 'World 1', kinds: ['starsign', 'constellation'], collapsible: true },
  { label: 'World 2', kinds: ['bubble', 'vial', 'sigil', 'postbox', 'arcade'], collapsible: true },
  { label: 'World 3', kinds: ['building', 'prayer', 'equinox'], collapsible: true },
  { label: 'World 4', kinds: ['chip', 'jewel', 'meal'], collapsible: true },
  { label: 'World 5', kinds: ['god', 'artifact', 'superbit'], collapsible: true },
  { label: 'World 6', kinds: ['jade'], collapsible: true }
];

export const LISTED_KINDS = KIND_GROUPS.flatMap((group) => group.kinds);

export const hasListing = (kind) => LISTED_KINDS.includes(kind);
