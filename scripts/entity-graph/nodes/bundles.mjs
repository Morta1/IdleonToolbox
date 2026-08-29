// A bundle is a real-money purchase that hands over a fixed set of items. It gets a node of its own
// rather than one shared shop, because what a reader wants is the opposite of what a shop answers:
// not "where do I buy this cape" but "what else comes with it".
//
// The game never stores a bundle's name. It has a key (bun_j), a sales message, a price, and a
// banner image - and the NAME is drawn into that banner as pixels: bun_j.png reads "OUTTA THIS
// WORLD PACK". Nothing can parse that, so the names below were read off the 33 banners the game
// ships and written down.
//
// Deriving a name from the contents instead was tried and is not close enough to keep: it called
// the Lava Supporter Pack a "Trailblazer Bundle" after the trophy inside it, and the Easter Bundle
// a "Big Bunny Bundle". The derivation stays as the fallback for a bundle added after this list,
// which will read acceptably until someone adds its real name here.
//
// The prices and the gem counts come off the same banners. z-processing keeps a hand-written price
// table too, and it had stopped at bon_o, so the seven newest bundles had no price at all.
//
// The gems have to be written down for a different reason than the name: they are not an item and
// never reach the item extraction at all. N.js hands them over in a separate server message,
// GemsOwned += max(message - ServerGemsReceived, 0), so the amount lives on the message and the
// client never learns which bundle carried how many.
//
// Two figures, not one. `gems` is the chest, the headline count. `bonusGems` is the smaller
// "BUY NOW BONUS!" figure beside the price, which 16 bundles carry. Both are the same currency -
// PremiumGem is the only gem item in the game - and the banner just draws the bonus in green on
// most bundles and blue on Sacred Methods. Two bundles put something else entirely in that slot,
// +16 storage space on the Starter Pack and 10 Prisma Bubbles on Gilded Treasure, and those are
// left out rather than counted as gems.
//
// Read off each bundle's banner. Update when the game ships a new one.
const BUNDLES = {
  bun_a: { name: 'Lava Supporter Pack', price: 19.99, gems: 4200 },
  bun_b: { name: 'New Year Pack', price: 9.99, gems: 2021 },
  bun_c: { name: 'Starter Pack', price: 4.99, gems: 1750 },
  bun_d: { name: 'Easter Bundle', price: 9.99, gems: 2500 },
  bun_e: { name: 'Totally Chill Pack', price: 19.99, gems: 4500 },
  bun_f: { name: 'Summer Bundle', price: 9.99, gems: 2000 },
  bun_g: { name: 'Dungeon Bundle', price: 19.99, gems: 4000 },
  bun_h: { name: 'Giftmas Bundle', price: 9.99, gems: 2021 },
  bun_j: { name: 'Outta This World Pack', price: 19.99, gems: 4300 },
  bun_k: { name: 'Eggscellent Pack', price: 9.99, gems: 2500 },
  bun_l: { name: 'Super Hot Fire Pack', price: 19.99, gems: 4300 },
  bun_m: { name: 'Gem Motherlode Pack', price: 14.99, gems: 4200 },
  bun_n: { name: 'Riftwalker Pack', price: 29.99, gems: 6400 },
  bun_o: { name: "Bloomin' Pet Pack", price: 24.99, gems: 4500 },
  bun_p: { name: 'Island Explorer Pack', price: 19.99, gems: 4400, bonusGems: 1000 },
  bun_q: { name: 'Equinox Dreamer Pack', price: 19.99, gems: 4500 },
  bun_r: { name: 'Calm Serenity Pack', price: 19.99, gems: 4600, bonusGems: 1000 },
  bun_s: { name: 'Sacred Methods Pack', price: 19.99, gems: 4500, bonusGems: 1000 },
  bun_t: { name: 'Timeless Pack', price: 29.99, gems: 6400, bonusGems: 2000 },
  bun_u: { name: 'Ancient Echoes Pack', price: 19.99, gems: 4500, bonusGems: 1250 },
  bun_v: { name: 'Deathbringer Pack', price: 19.99, gems: 4400, bonusGems: 1350 },
  bun_w: { name: 'Windwalker Pack', price: 24.99, gems: 5700, bonusGems: 2250 },
  bun_x: { name: 'Arcane Cultist Pack', price: 19.99, gems: 4500, bonusGems: 1200 },
  bun_z: { name: 'Fallen Spirits Pet Pack', price: 19.99, gems: 4500 },
  bon_g: { name: 'Gilded Treasure Pack', price: 19.99, gems: 4500 },
  bon_i: { name: 'Ocean Raider Pack', price: 19.99, gems: 4500, bonusGems: 2000 },
  bon_l: { name: 'Best Friend Bubba Pack', price: 29.99, gems: 7000, bonusGems: 3000 },
  bon_s: { name: 'Heavy Metals Pack', price: 29.99, gems: 6300, bonusGems: 3000 },
  bon_v: { name: "Kelp N' Roll Pack", price: 24.99, gems: 5700, bonusGems: 2100 },
  ban_b: { name: 'Time Traveler Pack', price: 29.99, gems: 7000, bonusGems: 3000 },
  ban_c: { name: 'Yolkmaster Pack', price: 34.99, gems: 8000, bonusGems: 3700 },
  ban_g: { name: 'Armadillius Superius Pack', price: 24.99, gems: 5200, bonusGems: 2500 },
  ban_h: { name: 'Coral Guardian', price: 34.99, gems: 8100, bonusGems: 4100 },
  // The pet packs. Every one of these grants a companion and nothing else, so none of them appears
  // in the item extraction at all and none had a page here until pets got one. Read off the same
  // banners as the rest.
  ban_a: { name: '5th Birthday Bundle', price: 19.99, gems: 5555, bonusGems: 1555 },
  ban_d: { name: 'The Spooky Pack', price: 19.99, gems: 4600, bonusGems: 900 },
  ban_e: { name: 'Crystalline Glunko Pack', price: 29.99, gems: 7000, bonusGems: 3100 },
  ban_f: { name: 'Paradise Pack', price: 24.99, gems: 5700, bonusGems: 2000 },
  bon_a: { name: 'Storage Ram Pack', price: 8.99, gems: 2100, bonusGems: 1000 },
  bon_c: { name: 'Blazing Star Anniversary Pack', price: 19.99, gems: 4600, bonusGems: 2000 },
  bon_d: { name: 'Midnight Tide Anniversary Pack', price: 19.99, gems: 5000, bonusGems: 1400 },
  bon_e: { name: 'Lush Emerald Anniversary Pack', price: 19.99, gems: 4200, bonusGems: 2600 },
  bon_f: { name: 'Eternal Hunter Pack', price: 19.99, gems: 4500, bonusGems: 1500 },
  bon_h: { name: "Lil' Squirrel Pack", price: 9.99, gems: 2500, bonusGems: 600 },
  bon_j: { name: 'Piggy Pal Pack', price: 29.99, gems: 6500, bonusGems: 2200 },
  bon_k: { name: 'Autumn Breeze Pack', price: 24.99, gems: 5700, bonusGems: 2000 },
  bon_m: { name: 'Snowy Splendor Pack', price: 19.99, gems: 4400, bonusGems: 2000 },
  bon_n: { name: 'Northern Lights Pack', price: 19.99, gems: 4500, bonusGems: 1900 },
  bon_o: { name: 'Blizzard Bliss Pack', price: 19.99, gems: 4700, bonusGems: 1700 },
  bon_p: { name: 'Santas Little Helper Pack', price: 24.99, gems: 5600, bonusGems: 2500 },
  bon_r: { name: 'Pirate Glimbo Pack', price: 16.99, gems: 4100, bonusGems: 700 },
  bon_t: { name: 'Sweet & Lovely Pack', price: 24.99, gems: 5300, bonusGems: 2000 },
  bon_u: { name: 'Pot Of Gold Pack', price: 12.99, gems: 3200, bonusGems: 1500 }
};

// Two bundles ship art, grant no item and grant no pet: the Auto-Loot Pack (bun_i, auto-looting and
// inventory space) and the Valenslime Day Pack (bun_y, event plays and a coin bonus). Everything
// they hand over is an account flag, which the graph has nothing to point at, so they would be
// pages with an empty body. They stay out until there is something to put on them.

// The marquee item is the cosmetic: a bundle pads itself out with card packs and time candies, and
// the thing people call it by is the cape or the hat.
const MARQUEE = [/^EquipmentCape/, /^EquipmentGown/, /^EquipmentHats/, /^EquipmentNametag/, /^Trophy/, /^EquipmentRings/];

const marqueeItem = (contents, items) => {
  const rawNames = Object.keys(contents || {});
  for (const pattern of MARQUEE) {
    const found = rawNames.find((rawName) => pattern.test(rawName));
    if (found && items?.[found]?.displayName) return items[found].displayName;
  }
  const first = rawNames.find((rawName) => items?.[rawName]?.displayName);
  return first ? items[first].displayName : null;
};

// A bundle earns a node if it hands over anything the graph can point at: an item, or a pet. The
// pet packs are the reason for the second half - 19 bundles grant a companion and no item, so
// reading the item extraction alone left them out of the wiki entirely.
export const bundleNodes = (itemSources, bundleInfo, items, bundlePets = {}) => {
  const nodes = {};
  const keys = new Set([...Object.keys(itemSources?.bundles || {}), ...Object.keys(bundlePets)]);
  for (const key of keys) {
    const contents = itemSources?.bundles?.[key] || {};
    const known = BUNDLES[key];
    const marquee = marqueeItem(contents, items);
    nodes[`bundle:${key}`] = {
      kind: 'bundle',
      rawName: key,
      name: known?.name || (marquee ? `${marquee}_Bundle` : `Bundle_${key}`),
      // The banner the game shows in its own shop, which carries the bundle's real name and the
      // gems it comes with. One bundle has no art shipped.
      icon: `/data/${key}.png`,
      category: null,
      ...(known?.price || bundleInfo?.[key]?.price > 0
        ? { price: known?.price ?? bundleInfo[key].price }
        : {}),
      ...(known?.gems > 0 ? { gems: known.gems } : {}),
      ...(known?.bonusGems > 0 ? { bonusGems: known.bonusGems } : {}),
      // No description. The only text the game keeps is the nag it shows when you are short of
      // gems - "Hey {, you've only got } gems, that's exactly 4200 less than what a cool dude would
      // have!" - addressed to the player, with its placeholders unfilled. It is advertising copy,
      // not a description of what the bundle is.
    };
  }
  return nodes;
};
