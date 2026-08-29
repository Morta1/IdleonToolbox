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
export const LISTED_KINDS = ['item', 'monster', 'npc', 'world', 'class', 'talent', 'achievement', 'pet', 'bundle', 'bubble', 'vial'];

export const hasListing = (kind) => LISTED_KINDS.includes(kind);
