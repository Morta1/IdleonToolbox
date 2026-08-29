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

export const itemNodes = (items, monsters, cards, stamps, craftPrices = new Map()) => {
  const cardsByIndex = indexCardsByCardIndex(cards);
  const stampsByRawName = indexStampsByRawName(stamps);
  const nodes = { 'item:COIN': COIN_NODE };
  for (const [rawName, item] of Object.entries(items)) {
    nodes[`item:${rawName}`] = {
      kind: 'item',
      rawName,
      name: item.Type === 'CARD' ? cardName(rawName, item, items, monsters) : item.displayName,
      icon: `/data/${rawName}.png`,
      category: item.Type,
      description: item.Type === 'STAMP' ? stampBonus(rawName, stampsByRawName) : itemDescription(item),
      // In the game's own unit: 6000 is 60 silver, which is the number idleon.wiki prints, and
      // getCoinsArray does that conversion at render time. A craftable item's field is dead data
      // the game never reads, so its recipe price wins: see craft-prices.mjs.
      sellPrice: craftPrices.get(rawName) ?? (item.sellPrice > 1 ? item.sellPrice : null),
      stamp: item.Type === 'STAMP' ? stampInfo(rawName, stampsByRawName) : null,
      stats: itemStats(item),
      card: item.Type === 'CARD' ? cardBonus(rawName, cardsByIndex) : null
    };
  }
  return nodes;
};
