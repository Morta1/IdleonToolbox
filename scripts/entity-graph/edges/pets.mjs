// Which bundle hands over which pet.
//
// This is the one part of a bundle that cannot be read out of the game at all. A bundle branch in
// the SERVER_ITEM_BUNDLE handler calls GiveItem and nothing else - the Ocean Raider branch grants
// EquipmentGown5 and stops - because the companion is added by the server, the same way the gems
// are. Checked the desktop build too: its FirebaseMMO.js is empty, steam.js is IPC glue, and its
// N.js is the same code we already parse.
//
// So this is read off the banners, like the names and the prices in nodes/bundles.mjs, and it is
// hand-maintained for the same reason. The banner labels the pet in shorthand, so each one below is
// the companion the art actually shows: the Autumn Breeze Pack says "NACHO PET" and the pet is
// Chippy, whose sprite is a taco with a face.
const BUNDLE_PETS = {
  bun_c: 'sheep',        // Starter Pack: Sheepie
  ban_a: 'w6b2b',        // 5th Birthday Bundle: Wickerlight Spirit
  ban_b: 'w5b5b',        // Time Traveler Pack: Smoke Devil
  ban_c: 'w6d1',         // Yolkmaster Pack: Royal Egg
  ban_d: 'rift1',        // The Spooky Pack: Rift Spooker
  ban_e: 'caveD',        // Crystalline Glunko Pack: Crystal Glunko
  ban_f: 'Pet2',         // Paradise Pack: Wild Boar
  ban_g: 'r0b',          // Armadillius Superius Pack: Armadillo
  ban_h: 'w7a12',        // Coral Guardian: Coralcave Guardian
  bon_a: 'ram',          // Storage Ram Pack: Dedotated Ram
  bon_c: 'Pet10',        // Blazing Star Anniversary Pack: Cool Bird
  bon_d: 'Pet12',        // Midnight Tide Anniversary Pack: Axolotl
  bon_e: 'Pet3',         // Lush Emerald Anniversary Pack: Mallay
  bon_f: 'reindeer',     // Eternal Hunter Pack: Spirit Reindeer
  bon_h: 'Pet0',         // Lil' Squirrel Pack: Squirrel
  bon_i: 'Pet4',         // Ocean Raider Pack: Whale
  bon_j: 'Pet1',         // Piggy Pal Pack: Mr Pig
  bon_k: 'Pet5',         // Autumn Breeze Pack: Chippy
  bon_l: 'bubba',        // Best Friend Bubba Pack: Bubba the Seal
  bon_m: 'Pet6',         // Snowy Splendor Pack: Bunny
  bon_n: 'Pet11',        // Northern Lights Pack: Hedgehog
  bon_o: 'Pet8',         // Blizzard Bliss Pack: Panda
  bon_p: 'w6c2b',        // Santas Little Helper Pack: Santas Little Helper
  bon_r: 'w7b3b',        // Pirate Glimbo Pack: Glimbo
  bon_s: 'w7b2',         // Heavy Metals Pack: Boomy Mine
  bon_t: 'w4b4b',        // Sweet & Lovely Pack: Vanillie
  bon_u: 'PotG',         // Pot Of Gold Pack: Potluck
  bon_v: 'w7b4'          // Kelp N' Roll Pack: Eggroll
};

export const bundlePets = () => BUNDLE_PETS;

// `yields`, the same relation a bundle uses for its items: from a reader's side the question is the
// same one, what comes in the box.
export const petEdges = (petNodesByRawName) => Object.entries(BUNDLE_PETS)
  .filter(([, rawName]) => petNodesByRawName?.[`pet:${rawName}`])
  .map(([key, rawName]) => ({
    from: `bundle:${key}`,
    to: `pet:${rawName}`,
    rel: 'yields',
    meta: {},
    source: 'pets'
  }));
