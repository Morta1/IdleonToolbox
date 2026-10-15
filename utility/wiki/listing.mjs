// A kind's listing: its rows and the columns a reader compares them by. Data-free and importable
// from plain node, so the page builds it at export time and the tests read the same function.
import { inListing } from './kinds.mjs';

const listingRows = (graph, kind) => Object.entries(graph.nodes)
  .filter(([, node]) => node.kind === kind && inListing(node))
  .map(([id, node]) => ({
    id,
    label: (node.name || node.rawName).replace(/_/g, ' '),
    // What tells this row from another of the same name; a unique page carries none.
    ...(node.disambig ? { disambig: node.disambig } : {}),
    // category rides along so the listing can offer a facet the data actually has: seven worlds
    // for maps, five kinds for monsters, 112 item types behind a select.
    node: {
      kind: node.kind,
      rawName: node.rawName,
      name: node.name,
      icon: node.icon ?? null,
      slug: node.slug,
      category: node.category ?? null,
      // A bundle's art is a wide shop banner carrying its name, price and contents, and the card
      // is built around that. A Pet Mart pack has none: just its pet's sprite. So the four things
      // the banner would have shown travel with it and the card draws them itself.
      // A Starter Pack offer card is portrait art, which the wide banner card would blow up, so
      // it takes the Pet Mart treatment too.
      ...(node.petMart || node.starterOffer ? {
        ...(node.petMart ? { petMart: true } : { starterOffer: true }),
        petName: node.petName ?? null,
        price: node.price ?? null,
        gems: node.gems ?? null,
        petCrystals: node.petCrystals ?? null
      } : {}),
      // Vials and bubbles unlock in a fixed sequence, and that sequence is how they are read.
      order: node.order ?? null,
      // Monsters and NPCs band by world, which is a different axis from their category.
      world: node.world ?? null,
      // Which bestiary section a monster reads under, which is a world for most of them and
      // Bosses, Events, Dungeon or The Rift for the ones the game places nowhere.
      section: node.section ?? null
    }
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

// The rows are filtered with inListing, the predicate the hub counts with, so a listing always
// holds the number of rows its tile promises.
export const listingEntries = (graph, kind) => {
  const columns = [];
  const entries = listingRows(graph, kind).map((entry) => ({ ...entry, cells: [] }));
  return { columns, entries };
};
