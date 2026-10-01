// The game stores an item's tooltip as up to eight lines padded with the literal string 'Filler',
// with single-character slots standing in for the item's own numbers. `ItemDisplay` fills `[` and
// `]` the same way at render time; `*` and `#` follow the same idea, verified against the upgrade
// stones (Weapon Upgrade Stone I reads 100% success, II reads 80%, E reads 25%).
const DESCRIPTION_SLOTS = [
  [/\[/g, 'Amount'],
  [/]/g, 'Cooldown'],
  [/\*/g, 'Amount'],
  [/#/g, 'Trigger']
];

// Outside stamps, `{` only ever appears in three items, and in all three it reads as a plus:
// "construction LV of 75{", "Dungeon Rank 10{", "give it {1 all stat".
const PLUS_SLOT = /{/g;

const itemDescription = (item) => {
  // A stamp's desc_line1 is its raw config row (`BaseDmg,add,1,0,5,Grasslands1,...`), not prose.
  // Excluded by Type rather than by sniffing for commas, which would eat seven real descriptions.
  // stampBonus reads that row's parsed form out of stamps.json instead.
  if (item?.Type === 'STAMP') return null;
  // A card's desc_line1 holds its source id ('frogBIG'), not prose.
  if (item?.Type === 'CARD') return null;

  let text = [1, 2, 3, 4, 5, 6, 7, 8]
    .map((line) => item?.[`desc_line${line}`])
    .filter((line) => line && line !== 'Filler')
    .join(' ');
  if (!text) return null;

  for (const [slot, field] of DESCRIPTION_SLOTS) {
    // Drop the slot when the item carries no value for it, rather than printing a bare `*`.
    text = text.replace(slot, item[field] ?? '');
  }
  text = text.replace(PLUS_SLOT, '+').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  return text || null;
};


// Raw numbers only. Labelling them needs getPowerType, which lives in parsers/powerTypes.ts and
// cannot be imported from a plain node script, so the panel does the formatting instead. Falsy
// values are dropped so an item carries only the stats it actually has.
const STAT_FIELDS = [
  'lvReqToEquip', 'Class', 'Weapon_Power', 'Speed', 'Reach',
  'STR', 'AGI', 'WIS', 'LUK', 'Defence', 'Upgrade_Slots_Left',
  'UQ1txt', 'UQ1val', 'UQ2txt', 'UQ2val'
];

const itemStats = (item) => {
  const stats = {};
  for (const field of STAT_FIELDS) {
    const value = item?.[field];
    // 'ALL' is the absence of a class restriction, so it says nothing worth a row.
    if (!value || (field === 'Class' && value === 'ALL')) continue;
    stats[field] = value;
  }
  return Object.keys(stats).length > 0 ? stats : null;
};

// Card items ship as placeholders: displayName is 'DONTFILL' (or, for CardsA0 and CardsA1, the
// rawName itself), with desc_line1 naming the source. That is a monster rawName for a monster card
// and an item rawName for the crafting-bar cards. Three cards point at a placeholder and keep the
// name the game gave them.
const cardName = (rawName, item, items, monsters) => {
  const source = item?.desc_line1;
  const sourceName = monsters?.[source]?.Name || items?.[source]?.displayName;
  if (sourceName && sourceName !== 'DONTFILL') return `${sourceName}_Card`;
  // CardsD12, CardsD13 and CardsF51 resolve to nothing. The rawName is ugly but true, and beats
  // printing the game's 'DONTFILL' placeholder at a reader.
  return rawName;
};

// cards.json is keyed by the monster the card drops from, so it has to be re-keyed by cardIndex
// ('A9') to meet the item rawName ('CardsA9'). `effect` keeps its raw '{' slot and underscores so
// the panel can substitute and clean it exactly the way CardTooltip already does.
const cardBonus = (rawName, cardsByIndex) => {
  const card = cardsByIndex?.[rawName.replace(/^Cards/, '')];
  if (!card?.effect) return null;
  // `order` is what the wiki calls the card's slot in its category; visualIndex is the same number
  // counted from zero. perTier drives the tier-requirement ladder the panel derives.
  return {
    effect: card.effect,
    bonus: card.bonus,
    perTier: card.perTier,
    category: card.category,
    order: card.visualIndex != null ? card.visualIndex + 1 : null
  };
};

const indexCardsByCardIndex = (cards) => {
  const byIndex = {};
  for (const card of Object.values(cards || {})) {
    if (card?.cardIndex) byIndex[card.cardIndex] = card;
  }
  return byIndex;
};

// The one thing monsters drop that has no usable item definition. The game does define COIN, but as
// its null-item slot: typeGen "NothingERROR", and ID 0 so it inherits the fisticuff template down to
// Weapon_Power 2. z-processing excludes it for that reason, alongside EXP, Blank and null, which is
// why drop rows for it arrive carrying nothing but the rawName.
//
// "Coins" is the game's own displayName, the only field of this worth taking from it: there is no
// COIN.png and Type is the junk inherited FISTICUFF, so art and category are authored here. Coins5
// is what the site's header uses, so a coin looks the same everywhere. (idleon.wiki says "Coin".)
//
// `navigable: false` renders it as text and keeps it out of the search list. A page for it would be
// 230 monsters long and say nothing useful: the number that matters is the amount on the drop row.
const COIN_NODE = {
  kind: 'item',
  rawName: 'COIN',
  name: 'Coins',
  icon: '/data/Coins5.png',
  category: 'CURRENCY',
  description: null,
  stats: null,
  card: null,
  navigable: false
};

// stamps.json is grouped into combat/skills/misc and holds the parsed form of the config row that
// itemDescription refuses to read, covering all 128 stamps exactly.
const indexStampsByRawName = (stamps) => {
  const byRawName = {};
  for (const [groupName, group] of Object.entries(stamps || {})) {
    for (const [index, stamp] of Object.entries(group || {})) {
      if (stamp?.rawName) byRawName[stamp.rawName] = { ...stamp, group: groupName, index: Number(index) };
    }
  }
  return byRawName;
};

// What the stamp boosts, with no number. This is the tooltip's and the meta description's copy,
// where there is no room to explain which level a figure is for; the page's own Bonus row reads it
// at level one instead, from the effect on stampInfo below.
const stampBonus = (rawName, stampsByRawName) => {
  const effect = stampsByRawName[rawName]?.effect;
  if (!effect) return null;
  return effect.replace(/{/g, '').replace(/_/g, ' ').trim() || null;
};

// The rest of idleon.wiki's Stamp Info box. Its Number is the stamp's position in its own tab, and
// the rawName's digits agree with that for all 128, so either derivation gives the same answer.
//
// effect carries the template with its `{` intact plus the growth the game reads it with, which is
// what lets StampInfo print the level-one figure the way a vial's does. It travels as data rather
// than a finished string because growth lives in utility/helpers, and this builder runs under bare
// node where a .js module cannot be imported at all.
const stampInfo = (rawName, stampsByRawName) => {
  const stamp = stampsByRawName[rawName];
  if (!stamp) return null;
  return {
    number: stamp.index + 1,
    category: `${stamp.group.charAt(0).toUpperCase()}${stamp.group.slice(1)} Stamp`,
    material: stamp.itemReq?.[0]?.rawName ? stamp.itemReq[0].rawName : null,
    ...(stamp.func ? { effect: { template: stamp.effect, func: stamp.func, x1: stamp.x1, x2: stamp.x2 } } : {})
  };
};

// Stand-ins for a count the game keeps outside the inventory, so a bubble can list it as a cost.
// All 22 are one copied template (displayName Strung_Jewels, W6item0 Error_Item, desc
// Sail_Treasure), and the game never shows those fields: its spend and owned-count code reads
// Sailing[1][n], Ninja[102][1], FarmCrop, Summon[2] and Spelunk[19] instead. The name says what
// the count is, and `navigable: false` keeps a page for the copied template from existing.
const PROXY_TYPE = 'SAIL_TREASURE';
const PROXY_CROPS = { W6item1: 4, W6item2: 30, W6item3: 46, W6item4: 72, W6item5: 99 };
const PROXY_ESSENCES = { W6item6: 'White', W6item7: 'Green', W6item8: 'Yellow', W6item9: 'Blue', W6item10: 'Purple' };

const proxyName = (rawName) => {
  const sailing = /^SailTr(\d+)$/.exec(rawName);
  if (sailing) return `Sailing_Treasure_${sailing[1]}`;
  if (rawName === 'W6item0') return 'Jade_Coins';
  if (PROXY_CROPS[rawName] != null) return `Farming_Crop_${PROXY_CROPS[rawName]}`;
  if (PROXY_ESSENCES[rawName]) return `${PROXY_ESSENCES[rawName]}_Essence`;
  const spelunking = /^W7item(\d+)$/.exec(rawName);
  if (spelunking) return `Spelunking_Resource_${spelunking[1]}`;
  return rawName;
};

// RANDOlist 17 is what the game leaves off The Slab: things a player cannot find. It also holds
// real legacy and premium items, so membership alone hides nothing. Inside it, a TestObj rawName
// or a name the developer never filled in marks a placeholder: every one of these has no source
// and no use anywhere in the graph, and most occur in N.js only in their definition and this list.
// TestObj1, 3, 7 and 13 are not in it: they are craftable, in recipes and on The Slab, so they stay.
const NOT_FINDABLE_POOL = 17;
const PLACEHOLDER_NAMES = new Set([
  'Filler', // CraftMat15-17, desc 'Filler_text_lol'
  'FILLER', // NPCtoken8, desc 'eafwef'
  'Filler_bc_I_messed_up', // Quest8
  'REPLACE_ME', // EquipmentShirts8-9
  'Not_Yet', // FillerMaterial: "this material isn't in the game yet", the cost on unreleased bubbles
  'Wooden_Spear_(Dungeon)' // DungWeaponBow1, Wand1, Sword1: the unnumbered template the real I-V tiers were cut from
]);

export const isPlaceholderItem = (rawName, item, notFindable) => notFindable.has(rawName)
  && (/^TestObj\d+$/.test(rawName) || PLACEHOLDER_NAMES.has(item?.displayName));

export const itemNodes = (items, monsters, cards, stamps, craftPrices = new Map(), randomList = []) => {
  const cardsByIndex = indexCardsByCardIndex(cards);
  const stampsByRawName = indexStampsByRawName(stamps);
  const notFindable = new Set((randomList?.[NOT_FINDABLE_POOL] || []).filter((value) => typeof value === 'string'));
  const nodes = { 'item:COIN': COIN_NODE };
  for (const [rawName, item] of Object.entries(items)) {
    const proxy = item.Type === PROXY_TYPE;
    nodes[`item:${rawName}`] = {
      kind: 'item',
      rawName,
      name: proxy ? proxyName(rawName) : item.Type === 'CARD' ? cardName(rawName, item, items, monsters) : item.displayName,
      // The proxies have no plain art; the _x1 sprite is the one the game draws on the bubble.
      icon: proxy ? `/data/${rawName}_x1.png` : `/data/${rawName}.png`,
      category: item.Type,
      description: proxy ? null : item.Type === 'STAMP' ? stampBonus(rawName, stampsByRawName) : itemDescription(item),
      // In the game's own unit: 6000 is 60 silver, which is the number idleon.wiki prints, and
      // getCoinsArray does that conversion at render time. A craftable item's field is dead data
      // the game never reads, so its recipe price wins: see craft-prices.mjs.
      sellPrice: craftPrices.get(rawName) ?? (item.sellPrice > 1 ? item.sellPrice : null),
      stamp: item.Type === 'STAMP' ? stampInfo(rawName, stampsByRawName) : null,
      stats: itemStats(item),
      card: item.Type === 'CARD' ? cardBonus(rawName, cardsByIndex) : null,
      // Same treatment as COIN: no page, no search entry, no listing row, and a row that names it
      // elsewhere renders as text instead of a link.
      ...(proxy || isPlaceholderItem(rawName, item, notFindable) ? { navigable: false } : {})
    };
  }
  return nodes;
};
