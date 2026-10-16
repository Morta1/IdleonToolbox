import React, { useState } from 'react';
import { Box, Card, CardContent, Chip, Link, Stack, Typography } from '@mui/material';
import CardBonus, { cardBonusShows } from './CardBonus';
import InfoBox, { visibleGroups } from './InfoBox';
import ItemStats, { itemStatsShows } from './ItemStats';
import { monsterGroups } from './MonsterInfo';
import QuestInfo, { questInfoShows } from './QuestInfo';
import StampInfo, { stampInfoShows } from './StampInfo';
import AlchemyInfo, { alchemyInfoShows } from './AlchemyInfo';
import TalentInfo, { talentInfoShows } from './TalentInfo';
import FamilyBonusInfo, { familyBonusShows } from './FamilyBonusInfo';
import RegistryInfo, { registryInfoShows } from './RegistryInfo';
import EntityHistory, { entityHistoryShows } from './EntityHistory';
import { dropOdds, dropQuantityLabel, dropTalentLabel, dropTierGroups, percentLabel } from '@utility/wiki/drops';
import { entityName } from '@utility/wiki/names.mjs';
import { cleanUnderscore } from '@utility/helpers';
import { LISTED_KINDS, wikiCrumbs } from '@utility/wiki/kinds.mjs';
import { FIELD_LINK_SECTIONS, fieldLinkEdge, fieldLinks } from '@utility/wiki/field-links.mjs';
import { KIND_LABELS, KIND_PLURALS } from '@utility/wiki/kind-labels.mjs';
import { categoryLabel } from '@utility/wiki/categories.mjs';
import { formatAmount, starterBundleCapacity } from '@utility/wiki/effects.mjs';
import { collapseRows, tableThreshold } from '@utility/wiki/relations';
import RelationTable from './RelationTable';
import NpcQuestRow from './NpcQuestRow';
import CoinAmount, { isCoin } from './CoinAmount';
import Price from './Price';
import ShopCatalog, { shopCatalogShows } from './ShopCatalog';
import EntityIcon from './EntityIcon';
import GemCount from './GemCount';
import { linkProps, navigateOnPlainClick } from './links';
import WikiBreadcrumbs from './WikiBreadcrumbs';

export { EntityIcon, entityName, KIND_LABELS, KIND_PLURALS };


// Below this a section reads better as one column. Two entries stretched across a wide row leave
// the second one stranded near the right edge, which is what made an NPC's two locations look like
// a broken layout rather than a short list.
const COLUMN_MIN = 6;

// Art that is a banner rather than an icon, and the width the game drew it at: a bundle's shop
// strip is 711px, a world's map 811px. Shown at its own size at most, never blown up.
const WIDE_HEADER = { bundle: 711, world: 811 };

const quantityLabel = (meta) => (meta?.quantity != null ? `x${meta.quantity.toLocaleString('en-US')}` : '');
const amountLabel = (meta) => (meta?.amount != null ? `x${meta.amount.toLocaleString('en-US')}` : '');
const spawnLabel = (meta) => (meta?.count > 0 ? `${meta.count} spawns` : '');
const orderLabel = (meta) => (meta?.order != null ? `#${meta.order}` : '');
// What a container rolls. The pools are weighted and the weights are the game's own, so this is a
// real rate rather than an even split across the list.
const yieldLabel = (meta) => (meta?.chance > 0 ? `${meta.chance}%` : '');
// A skilling node's resource, and for a fishing spot the depths it is caught at.
const gatherLabel = (meta) => [meta?.skill, meta?.depths?.length ? `Depth ${meta.depths.join(', ')}` : null].filter(Boolean).join(' · ');
// What a trap map yields: the plain critter past an efficiency threshold, the shiny one by chance.
const harvestLabel = (meta) => {
  if (meta?.efficiencyReq > 0) return `${meta.efficiencyReq.toLocaleString('en-US')} efficiency for bonus critters`;
  if (meta?.shinyChance > 0) return `${meta.shinyChance.toLocaleString('en-US')}% shiny chance`;
  return '';
};
// A bubble's base cost, which is the level-one price. What it actually costs depends on the
// bubble's level and on half a dozen account bonuses, none of which a save-less page has.
// What a world's row says about one of its areas without opening it. An area has at most one AFK
// enemy, so this is the whole answer rather than the first of several.
const areaLabel = (meta) => [
  meta?.enemy ? cleanUnderscore(meta.enemy) : null,
  meta?.npcs > 0 ? `${meta.npcs} NPC${meta.npcs > 1 ? 's' : ''}` : null
].filter(Boolean).join(' · ');

// The Task Board sells the recipe, not the item. A page listing materials and nothing else reads
// as "go craft it" for the 152 items whose only source is a craft they cannot do yet.
const unlockNote = (unlock) => (unlock
  ? `Recipe unlocked on the World ${unlock.world} Task Board (#${unlock.position})`
  : null);

const costLabel = (meta) => (meta?.baseCost > 0 ? `x${meta.baseCost.toLocaleString('en-US')}` : '');
// What a Glimbo trade pays out: never an item, always a higher cap on one Upgrade Vault upgrade.
const vaultUpgradeLabel = (meta) => (meta?.upgrade ? `+Max LV: ${cleanUnderscore(meta.upgrade)}` : '');
const cycleLabel = (meta) => (meta?.quantity != null ? `x${meta.quantity.toLocaleString('en-US')} / cycle` : '');
const REFINERY_NOTE = 'Cost at salt rank 1; it grows with every rank.';
const smithingLabel = (meta) => (meta?.levelReq > 0 ? `Smithing LV ${meta.levelReq}` : '');
// A Worship Totem prayer unlocks once a wave is reached.
const waveLabel = (meta) => (meta?.wave > 0 ? `Wave ${meta.wave}` : '');
// An Armor Set counts its armor, then any of a tool pool, then any one weapon.
const SLOT_LABELS = { armor: 'Armor', tool: 'Tool', weapon: 'Weapon' };
const slotLabel = (meta) => SLOT_LABELS[meta?.slot] ?? '';
// Level-one costs: every level after it costs more.
const LEVEL_ONE_NOTE = 'Cost of the first level; each level after it costs more.';

// Every section is one relation read in one direction: `from` follows the edges leaving this
// entity, `to` follows the edges arriving at it. The same rel therefore appears twice under two
// different titles (an item is crafted from things, and is itself used in crafting).
// The odds read as "1 in N" beside the percentage. A chance that would round to "1 in 1" without being
// certain (Dungeon Credits at 80%) reads as the percentage alone.
const DropChance = ({ meta, node }) => {
  const chance = meta?.effectiveChance ?? meta?.chance;
  // A drop the game splices in at runtime carries no odds, but its gate is still worth showing.
  if (!(chance > 0)) {
    if (meta?.randomEvent) return <Chip size={'small'} variant={'outlined'} label={'Random event'}/>;
    if (meta?.jadeUnlock) return <Chip size={'small'} variant={'outlined'} label={cleanUnderscore(meta.jadeUnlock)}/>;
    return null;
  }
  // Coins carry their amount in the smallest denomination, so the raw quantity is not the number
  // to print; CoinAmount already rendered it beside the name.
  const quantity = isCoin(node) ? '' : dropQuantityLabel(meta);
  const talent = dropTalentLabel(meta);
  const odds = dropOdds(meta);
  const percentage = percentLabel(chance);
  return <>
    {/* A chip rather than another caption: it qualifies what the row IS, and would otherwise be
        read as part of the run of numbers beside it. */}
    {meta?.recipe ? <Chip size={'small'} variant={'outlined'} label={'Recipe'}/> : null}
    {/* Drops the game splices in at runtime: only during a random event, or once a Jade upgrade is bought. */}
    {meta?.randomEvent ? <Chip size={'small'} variant={'outlined'} label={'Random event'}/> : null}
    {meta?.jadeUnlock ? <Chip size={'small'} variant={'outlined'} label={cleanUnderscore(meta.jadeUnlock)}/> : null}
    {talent ? <Typography variant={'caption'} color={'text.secondary'}>{talent}</Typography> : null}
    {quantity ? <Typography variant={'caption'} color={'text.secondary'}>{quantity}</Typography> : null}
    {odds ? <Typography variant={'caption'} color={'text.secondary'}>{odds}</Typography> : null}
    {/* Both numbers on the row rather than one of them behind a hover. "1 in 618" is what a player
        quotes and a percentage is what the game's drop tables are written in, and neither converts
        in the head. Which table a tiered drop sits in is already the band heading above the row. */}
    {percentage ? <Typography variant={'caption'} color={'text.disabled'}>{percentage}</Typography> : null}
  </>;
};

// Every registry kind reads its upgrade materials the same way.
const REGISTRY_SECTIONS = [
  { title: 'Material', dir: 'from', rel: 'upgradedWith', show: costLabel }
];

const REL_SECTIONS = {
  item: [
    { title: 'Dropped by', dir: 'to', rel: 'drops', Detail: DropChance },
    { title: 'Gathered from', dir: 'to', rel: 'gathers', show: gatherLabel },
    { title: 'Crafted from', dir: 'from', rel: 'craftedFrom', show: quantityLabel },
    { title: 'Used in crafting', dir: 'to', rel: 'craftedFrom', show: quantityLabel },
    { title: 'Refined from', dir: 'from', rel: 'refinedFrom', show: cycleLabel, note: REFINERY_NOTE },
    { title: 'Used in refinery', dir: 'to', rel: 'refinedFrom', show: cycleLabel, note: REFINERY_NOTE },
    // Quests and achievements both pay out through `rewards`, so this heading names neither.
    { title: 'Reward from', dir: 'to', rel: 'rewards', show: amountLabel },
    { title: 'Required by quest', dir: 'to', rel: 'requires', show: amountLabel },
    // Vials, bubbles and stamps are all "upgraded with" an item, so one relation covers all three
    // and the section reads for whichever of them points here.
    { title: 'Material', dir: 'from', rel: 'upgradedWith' },
    { title: 'Used in upgrades', dir: 'to', rel: 'upgradedWith', show: costLabel },
    { title: 'Sold by', dir: 'to', rel: 'sells', show: quantityLabel },
    { title: 'Produced at', dir: 'to', rel: 'produces', show: smithingLabel },
    { title: 'Traded to', dir: 'to', rel: 'buys' },
    { title: 'Raises max level of', dir: 'to', rel: 'maxRaisedBy' },
    // Both ends of a container: the box lists what it can roll, and each obol lists the box it
    // comes out of, which for every obol in the game is its only source.
    { title: 'Opens into', dir: 'from', rel: 'yields', show: yieldLabel },
    // Both a container and a bundle yield an item, so this reads for either rather than saying
    // "opened from" of a thing that was bought.
    { title: 'Obtained from', dir: 'to', rel: 'yields', show: yieldLabel },
    // Trapping: the map is where the critter is caught, and no drop table mentions a critter.
    { title: 'Caught in', dir: 'to', rel: 'harvests', show: harvestLabel },
    { title: 'Part of set', dir: 'to', rel: 'setPiece', show: slotLabel },
    { title: 'Achievements', dir: 'to', rel: 'about' }
  ],
  monster: [
    { title: 'Drops', dir: 'from', rel: 'drops', Detail: DropChance, tiered: true },
    { title: 'Gives', dir: 'from', rel: 'gathers', show: gatherLabel },
    { title: 'Found in', dir: 'to', rel: 'spawns', show: spawnLabel },
    { title: 'Achievements', dir: 'to', rel: 'about' }
  ],
  npc: [
    { title: 'Found in', dir: 'to', rel: 'hosts' },
    // A chain of quests is not a list of names: each step has a brief, a difficulty, objectives and
    // rewards, so it renders as a block of its own rather than through the generic row.
    { title: 'Quests', dir: 'from', rel: 'gives', Row: NpcQuestRow },
    // Glimbo's Swap Meet. Flat: the table has no column for the upgrade, which is the one thing
    // each row is there to say.
    { title: 'Takes in trade', dir: 'from', rel: 'buys', show: vaultUpgradeLabel, flat: true },
    { title: 'Achievements', dir: 'to', rel: 'about' }
  ],
  shop: [
    { title: 'Located in', dir: 'to', rel: 'hasShop' },
    { title: 'Sells', dir: 'from', rel: 'sells', show: quantityLabel }
  ],
  station: [
    { title: 'Produces', dir: 'from', rel: 'produces', show: smithingLabel },
    // Flat: the table has no cost column. Only the Beanstalk uses this today, and all 17 foods
    // share one first-rank cost, which the row still prints.
    { title: 'Material', dir: 'from', rel: 'upgradedWith', show: costLabel, note: 'Cost of the first rank.', flat: true }
  ],
  chip: [
    { title: 'Crafted from', dir: 'from', rel: 'craftedFrom', show: quantityLabel }
  ],
  jewel: [
    { title: 'Crafted from', dir: 'from', rel: 'craftedFrom', show: quantityLabel }
  ],
  meal: [
    { title: 'Used in crafting', dir: 'to', rel: 'craftedFrom', show: quantityLabel },
    { title: 'Used in upgrades', dir: 'to', rel: 'upgradedWith', show: costLabel }
  ],
  spice: [
    { title: 'Used in crafting', dir: 'to', rel: 'craftedFrom', show: quantityLabel }
  ],
  constellation: [
    { title: 'Located in', dir: 'from', rel: 'locatedIn' }
  ],
  // The items Glimbo takes read as the upgrade's max-level inputs.
  vault: [
    { title: 'Max level raised by', dir: 'from', rel: 'maxRaisedBy', note: 'Trade these to Glimbo at his Swap Meet.' }
  ],
  prayer: [
    { title: 'Material', dir: 'from', rel: 'upgradedWith', show: costLabel, note: LEVEL_ONE_NOTE },
    { title: 'Unlocked at', dir: 'to', rel: 'unlocks', show: waveLabel }
  ],
  armorset: [
    ...REGISTRY_SECTIONS,
    { title: 'Pieces', dir: 'from', rel: 'setPiece', show: slotLabel }
  ],
  totem: [
    ...REGISTRY_SECTIONS,
    { title: 'Unlocks prayers', dir: 'from', rel: 'unlocks', show: waveLabel }
  ],
  building: [
    { title: 'Material', dir: 'from', rel: 'upgradedWith', show: costLabel, note: LEVEL_ONE_NOTE },
    // The Talent Book Library hands out talent books.
    { title: 'Gives', dir: 'from', rel: 'yields' }
  ],
  map: [
    { title: 'World', dir: 'to', rel: 'contains' },
    { title: 'Enemy', dir: 'from', rel: 'spawns', show: spawnLabel },
    { title: 'Critters', dir: 'from', rel: 'harvests', show: harvestLabel },
    { title: 'NPCs', dir: 'from', rel: 'hosts' },
    { title: 'Shop', dir: 'from', rel: 'hasShop' },
    // Constellations, observations and totems: banded by kind, since all three sit on a map.
    { title: 'Found here', dir: 'to', rel: 'locatedIn', groupByKind: true },
    { title: 'Connects to', dir: 'from', rel: 'connectsTo' },
    { title: 'Reachable from', dir: 'to', rel: 'connectsTo' }
  ],
  // Never a table, however many areas a world has. The table's columns are quantities and drop
  // rates, none of which an area row carries, so tabulating World 1's 42 would trade the one thing
  // the row does say - its enemy - for five empty columns.
  world: [
    { title: 'Areas', dir: 'from', rel: 'contains', show: areaLabel, flat: true }
  ],
  vial: [
    { title: 'Material', dir: 'from', rel: 'upgradedWith' }
  ],
  bubble: [
    { title: 'Material', dir: 'from', rel: 'upgradedWith', show: costLabel }
  ],
  bundle: [
    { title: 'Includes', dir: 'from', rel: 'yields', show: quantityLabel }
  ],
  // A class reads down the tree: what it came from, what it becomes, and the talents that are its
  // own. Inherited talents are not repeated; they sit one promotion up.
  class: [
    { title: 'Promotes from', dir: 'to', rel: 'promotesTo' },
    { title: 'Promotes to', dir: 'from', rel: 'promotesTo' },
    { title: 'Talents', dir: 'from', rel: 'teaches' }
  ],
  talent: [
    { title: 'Classes', dir: 'to', rel: 'teaches' }
  ],
  // A pet's only link is the bundle that sold it: it drops nothing and spawns nowhere, which is
  // exactly why it is not a monster page.
  pet: [
    { title: 'Comes from', dir: 'to', rel: 'yields' }
  ],
  // Gems and time candy, and nothing else: no achievement in the game grants a third item.
  achievement: [
    { title: 'Rewards', dir: 'from', rel: 'rewards', show: amountLabel },
    // What the description names. 208 of the 268 pages had nothing to click before this.
    { title: 'About', dir: 'from', rel: 'about' }
  ],
  quest: [
    { title: 'Given by', dir: 'to', rel: 'gives', show: orderLabel },
    { title: 'Rewards', dir: 'from', rel: 'rewards', show: amountLabel },
    { title: 'Requires', dir: 'from', rel: 'requires', show: amountLabel }
  ]
};

// A relation many systems reach a page through reads as one section, banded by the kind at the other
// end in nav order; a kind with no listing (a quest) comes last.
const kindRank = (kind) => {
  const at = LISTED_KINDS.indexOf(kind);
  return at < 0 ? LISTED_KINDS.length : at;
};
const kindGroups = (edges, dir, index) => {
  const byKind = new Map();
  for (const edge of edges) {
    const kind = index.byId[dir === 'from' ? edge.to : edge.from]?.kind;
    if (!byKind.has(kind)) byKind.set(kind, []);
    byKind.get(kind).push(edge);
  }
  return [...byKind].sort(([a], [b]) => kindRank(a) - kindRank(b))
    .map(([kind, list]) => ({ key: kind, label: KIND_PLURALS[kind], edges: list }));
};

// One animated state tile. Drops itself when the gif fails to load, so a state that vanishes
// between graph builds leaves no broken image behind.
//
// Lazy, unlike the header icon: this box is the last thing in the right rail and is off-screen on a
// laptop, so its gifs were competing with the hydration paint for bandwidth they did not need. The
// header icon stays eager because it IS the paint. Deliberately not tabs, which would have saved a
// median 9KB and cost the side-by-side comparison the box exists for, since a gif restarts from
// frame 0 every time it mounts.
const AnimationTile = ({ src, alt }) => {
  const [broken, setBroken] = useState(false);
  if (broken) return null;
  return <Stack alignItems={'center'} gap={0.5}>
    <img src={src} alt={alt} width={72} height={72} loading={'lazy'} style={{ objectFit: 'contain' }}
         onError={() => setBroken(true)}/>
    <Typography variant={'caption'} color={'text.secondary'}>{alt}</Typography>
  </Stack>;
};

// The game's animation states for a monster or NPC, the way idleon.wiki's entity pages show
// them. `animations` is stamped at graph build time from the gifs that exist on disk; the header
// icon stays static and the movement lives here.
const ANIMATION_LABELS = { idle: 'Idle', walk: 'Walking', death: 'Death' };
// A pet's frames live under the monster it is, not under a directory of its own: same sprite, same
// rawName. Kept as a map so a kind with no entry renders nothing rather than guessing a path.
const ANIMATION_DIRS = { monster: 'monsters', pet: 'monsters', npc: 'npcs' };

// The panel asks the same question the box answers, so it cannot draw while the empty state shows.
const animationsShow = (node) => node?.animations?.length > 0 && Boolean(ANIMATION_DIRS[node.kind]);

const AnimationsBox = ({ node }) => {
  if (!animationsShow(node)) return null;
  const dir = ANIMATION_DIRS[node.kind];
  return <InfoBox groups={[{
    title: 'Animations',
    content: <Stack direction={'row'} gap={2} justifyContent={'center'} flexWrap={'wrap'}>
      {node.animations.map((variant) => <AnimationTile
        key={variant}
        src={`/${dir}/${node.rawName}/${variant}.gif`}
        alt={ANIMATION_LABELS[variant] || variant}/>)}
    </Stack>
  }]}/>;
};

// The base carry capacity a starter offer adds, as a row; none when the game data lacks it.
const carryCapacityRows = () => {
  const capacity = starterBundleCapacity();
  return capacity === null ? [] : [{ label: 'Carry capacity', value: `+${formatAmount(capacity)} base, all item types` }];
};

// The boxes below are inline rather than components, so each one's rows live in a builder: the
// render and the empty-state check read the same array.
const bundleGroups = (node) => [{
  title: 'Bundle',
  rows: [
    // Sold from its own popup, not the gem shop: one card per account, and the base carry capacity it adds
    // (MaxCapacity "AllCapBASE", carryCapacityBase in game-constants.mjs) is printed nowhere in the game.
    ...(node.starterOffer ? [
      { label: 'Limit', value: 'One per account' },
      ...carryCapacityRows()
    ] : []),
    ...(node.price > 0 ? [{ label: 'Price', value: `$${node.price.toFixed(2)}` }] : []),
    // Gems are not an item and cannot be an edge: the game hands them over in a separate
    // server message. Without this row the page would list a cape and omit the 4,200 gems
    // bought alongside it.
    ...(node.gems > 0 ? [{
      label: 'Gems',
      value: <GemCount amount={node.gems}/>
    }] : []),
    // The smaller figure the banner shows beside the price under "BUY NOW BONUS!". Same
    // currency, listed apart because it is conditional on buying during the promotion.
    ...(node.bonusGems > 0 ? [{
      label: 'Buy now bonus',
      value: <GemCount amount={node.bonusGems} isGreen />
    }] : []),
    // Only the Pet Mart packs pay a second currency, and it is the reason to buy one:
    // pet crystals are what the pet shop itself runs on.
    ...(node.petCrystals > 0 ? [{
      label: 'Pet crystals',
      value: <GemCount amount={node.petCrystals} isCrystal />
    }] : [])
  ]
}];

// Tournament power is the number that decides whether a pet is worth using, and the upgraded row
// is the same pet after its second copy: a different pet in play, the same page to a reader.
const petGroups = (node) => [{
  title: 'Pet',
  rows: [
    ...(node.tourPower > 0
      ? [{ label: 'Power', value: node.tourPower.toLocaleString('en-US') }]
      : []),
    ...(node.upgradedTourPower > 0
      ? [{ label: 'Upgraded power', value: node.upgradedTourPower.toLocaleString('en-US') }]
      : []),
    ...(node.upgradedEffect
      ? [{ label: 'Upgraded', value: cleanUnderscore(node.upgradedEffect) }]
      : []),
    ...(node.upgradeCost > 0
      ? [{ label: 'Pet Mart+ cost', value: <GemCount amount={node.upgradeCost} isCrystal /> }]
      : [])
  ]
}];

// The two things about an achievement that are not in its description. Steam-only ones cannot be
// earned in the browser or mobile client at all, and a secret one hides its objective in game,
// which is why its description here reads short.
const achievementGroups = (node) => [{
  title: 'Achievement',
  rows: [
    ...(node.quantity > 1
      ? [{ label: 'Target', value: node.quantity.toLocaleString('en-US') }]
      : []),
    ...(node.steamExclusive ? [{ label: 'Steam only', value: 'Yes' }] : []),
    ...(node.secret ? [{ label: 'Secret', value: 'Yes' }] : [])
  ]
}];

const KIND_BOXES = { bundle: bundleGroups, pet: petGroups, achievement: achievementGroups };

const EntityPanel = ({ index, id, onNavigate, onGo, hrefFor }) => {
  // byId is a plain object, so ?e=__proto__ would otherwise resolve to Object.prototype and render
  // a blank card instead of the empty state.
  const node = index?.byId && Object.hasOwn(index.byId, id) ? index.byId[id] : null;
  if (!node) {
    return <Typography color={'text.secondary'}>
      No entity matches this link. Use the search above to find one.
    </Typography>;
  }

  // Every monster's category is literally "Monster", which would print the kind chip twice.
  const kindChip = KIND_LABELS[node.kind] || node.kind;
  const showCategory = node.category && node.category.toLowerCase() !== kindChip.toLowerCase();
  // One rule for every kind, and the one a category disambiguator is written with, so the two compare as equals.
  const categoryChip = showCategory ? categoryLabel(node.category) : null;
  // A same-name page's label, less whatever the category chip beside it already says: a category
  // label is dropped, and "Replica Trophy #24" keeps only its "#24".
  const extendsCategory = Boolean(categoryChip) && Boolean(node.disambig?.startsWith(`${categoryChip} `));
  const disambigRest = extendsCategory ? node.disambig.slice(categoryChip.length + 1) : node.disambig;
  const disambigChip = node.disambig === categoryChip ? null : disambigRest;

  // A monster's card is whichever thing it drops that carries card data.
  const cardDrop = node.kind === 'monster'
    ? (index.edgesFrom.get(id) || []).find((edge) => edge.rel === 'drops' && index.byId[edge.to]?.card)
    : null;

  const materialEdge = (index.edgesFrom.get(id) || []).find((edge) => edge.rel === 'upgradedWith');
  const materialName = materialEdge ? entityName(index.byId[materialEdge.to]) : null;

  // A card's dropchance is the odds on the edge that drops it, the same number the Dropped by
  // section shows.
  const cardDropChance = node.card
    ? (index.edgesTo.get(id) || []).find((edge) => edge.rel === 'drops')?.meta?.effectiveChance
    : null;

  // The one section whose edges are not the focal node's own: an NPC stands in a town, and the
  // town is what has the shop. Reading it here rather than storing an npc -> shop edge keeps the
  // shop's own "Located in" to the one place it actually sits.
  const townShopEdges = node.kind === 'npc'
    ? (index.edgesTo.get(id) || [])
      .filter((edge) => edge.rel === 'hosts')
      .flatMap((edge) => (index.edgesFrom.get(edge.from) || []).filter((mapEdge) => mapEdge.rel === 'hasShop'))
    : [];

  // A field-link relation the kind has no section of its own for reads under its generic title.
  const ownSections = REL_SECTIONS[node.kind] || (node.registry ? REGISTRY_SECTIONS : []);
  const linkSections = FIELD_LINK_SECTIONS
    .filter((generic) => !ownSections.some((section) => section.rel === generic.rel && section.dir === generic.dir));
  // The page's own fields already draw these edges as anchors, so no section repeats them. Matched on
  // the exact edge, so another edge to the same page still lists.
  const drawnByFields = new Set(fieldLinks(node).map((link) => {
    const { from, to, rel } = fieldLinkEdge(id, link);
    return `${from}|${to}|${rel}`;
  }));

  // .filter() copies, so nothing here touches the arrays the index holds. A tiered section is
  // split into the game's drop-table tiers; every other section is one unlabelled group.
  const sections = [...ownSections, ...linkSections]
    .map((section) => {
      const edges = ((section.dir === 'from' ? index.edgesFrom.get(id) : index.edgesTo.get(id)) || [])
        .filter((edge) => edge.rel === section.rel && !drawnByFields.has(`${edge.from}|${edge.to}|${edge.rel}`));
      const groups = (section.tiered
        ? dropTierGroups(edges)
        : section.groupByKind ? kindGroups(edges, section.dir, index) : [{ key: section.rel, edges }])
        .filter((group) => group.edges.length > 0);
      // The threshold counts the SECTION, not each group. A monster's 16 drops arrive pre-split
      // into three drop tables of 4, 7 and 5, and per-group every one of them stays under the line
      // while the section as a whole is plainly a table.
      const size = groups.reduce((sum, group) => sum + group.edges.length, 0);
      return {
        ...section,
        groups,
        size,
        tabular: size > tableThreshold(section) && !section.Row && !section.flat,
        // The gate belongs under the recipe it gates rather than beside the item's own stats.
        note: section.rel === 'craftedFrom' && section.dir === 'from' ? unlockNote(node.recipeUnlock) : section.note ?? null
      };
    })
    .filter((section) => section.groups.length > 0);

  if (townShopEdges.length > 0) {
    sections.push({
      title: 'Shop in town',
      dir: 'from',
      groups: [{ key: 'hasShop', edges: townShopEdges }],
      size: townShopEdges.length,
      tabular: false
    });
  }

  const monsterProps = node.kind === 'monster' ? {
    node,
    index,
    card: cardDrop ? index.byId[cardDrop.to].card : null,
    cardId: cardDrop?.to,
    cardDropChance: cardDrop?.meta?.effectiveChance,
    hrefFor,
    onNavigate
  } : null;

  // The kind's own inline box, and a monster's, built once for the empty-state check and the rail alike.
  const boxGroups = KIND_BOXES[node.kind]?.(node) ?? null;
  const monsterBox = monsterProps ? monsterGroups(monsterProps) : null;

  const showsDescription = Boolean(node.description) && !node.stamp && !node.effect && node.kind !== 'talent';

  // A page is blank only when nothing on it draws. This asks each rail panel the question it
  // answers itself, so a panel cannot render while the empty state also shows. A page that is only
  // its description (a sigil, an arcade upgrade) counts through `showsDescription`, a shop's catalog
  // through `shopCatalogShows`, and a field link counts as a link.
  const hasContent = sections.length > 0
    || drawnByFields.size > 0
    || showsDescription
    || (node.stamp ? stampInfoShows(node) : itemStatsShows(node))
    || (node.kind === 'quest' && questInfoShows(node))
    || (boxGroups !== null && visibleGroups(boxGroups).length > 0)
    || alchemyInfoShows(node)
    || talentInfoShows(node)
    || familyBonusShows(node)
    || cardBonusShows(node.card)
    || (monsterBox !== null && visibleGroups(monsterBox).length > 0)
    || registryInfoShows(node)
    || animationsShow(node)
    || shopCatalogShows(node)
    || entityHistoryShows(node);

  return <Stack gap={1.5}>
    {/* The panel is reached from search, from a category listing, or from another entity's row, so it
        carries its own way back up rather than leaving browser history as the only route. */}
    <WikiBreadcrumbs crumbs={wikiCrumbs({ kind: node.kind, page: entityName(node) })} onGo={onGo}/>
    <Card variant={'outlined'}>
    <CardContent>
      {/* A bundle's banner is the shop art the game sells it with: wide, and carrying its name and
          contents. A world's is the island map the game draws when you pick where to travel, which
          is the same shape and the same job. Both read as a header rather than as an avatar, so
          they span the card and the title sits under them. */}
      {WIDE_HEADER[node.kind] && node.icon && !node.petMart && !node.starterOffer ? <Box
        component={'img'}
        src={node.icon}
        alt={''}
        sx={{ width: '100%', maxWidth: WIDE_HEADER[node.kind], height: 'auto', borderRadius: 1, mb: 1.5 }}
      /> : null}
      <Stack direction={'row'} gap={1.5} alignItems={'center'} flexWrap={'wrap'}>
        {/* A Pet Mart pack is a bundle with no banner: its art is the pet's own sprite, which the
            banner treatment would blow up to 711px. It takes the avatar every other kind uses. A
            Starter Pack offer's portrait card sits in the rail instead, see below. */}
        {node.icon && (!WIDE_HEADER[node.kind] || node.petMart)
          ? <EntityIcon key={id} node={node} size={72}/> : null}
        <Typography variant={'h5'} component={'h2'}>{entityName(node)}</Typography>
        <Chip size={'small'} variant={'outlined'} label={kindChip}/>
        {categoryChip ? <Chip size={'small'} variant={'outlined'} label={categoryChip}/> : null}
        {disambigChip ? <Chip size={'small'} variant={'outlined'} label={disambigChip}/> : null}
      </Stack>
      {/* Relations read as the main column; the stat infobox sits beside them on a wide
          screen and drops underneath once there is no room, the way a wiki page does. */}
      <Stack direction={{ xs: 'column', md: 'row' }} gap={3} alignItems={'flex-start'} sx={{ mt: 1.5 }}>
        <Box sx={{ flexGrow: 1, minWidth: 0, width: '100%' }}>
          {/* A vial or bubble's description is a template with a `{` in it, and AlchemyInfo is
              what fills that in; printing the raw form here would show the brace. */}
          {/* A talent's description is a template too, and TalentInfo is what fills it in at
              each level, so the raw form with its braces never reaches the page. */}
          {showsDescription
            ? <Typography variant={'body2'} color={'text.secondary'}>
              {cleanUnderscore(node.description)}
            </Typography>
            : null}
      {/* Only a blank page says this: no relation, no field link, no description, and no panel in
          the rail or below (stats, price, objectives, history, animations, a shop's catalog). */}
      {!hasContent ? <Typography sx={{ mt: 2 }} color={'text.secondary'}>
        Nothing is linked to this entity yet.
      </Typography> : null}
      {sections.map(({ title, dir, rel, groups, size, show, note, Detail, Row, tabular }) => <Stack key={`${title}|${dir}|${rel}`} sx={{ mt: 3 }} gap={0.5}>
        <Typography variant={'subtitle2'} color={'text.secondary'} textTransform={'uppercase'}
                    letterSpacing={0.5}>
          {title}
        </Typography>
        {note ? <Typography variant={'caption'} color={'text.secondary'}>{note}</Typography> : null}
        {tabular ? <RelationTable
          groups={groups.map((group) => ({ ...group, rows: collapseRows(group.edges, dir) }))}
          index={index}
          onNavigate={onNavigate}
          hrefFor={hrefFor}
          showChance={Boolean(Detail)}
        /> : null}
        {tabular ? null : groups.map(({ key, label, odds, edges }) => <Stack key={key} gap={0.5}>
          {label ? <Stack direction={'row'} gap={1} alignItems={'baseline'} flexWrap={'wrap'} sx={{ mt: 1 }}>
            <Typography variant={'body2'} fontWeight={600}>{label}</Typography>
            {odds ? <Typography variant={'caption'} color={'text.secondary'}>{odds}</Typography> : null}
          </Stack> : null}
          {/* Two columns once there is room, which halves the scrolling on the long sections. A
              short section stays in one: two entries spread across a 1200px row put the second one
              half a screen from its own heading, which reads as a layout fault rather than density.
              A section rendering its own Row is a block per entry and never columnar. */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: Row || size < COLUMN_MIN
              ? '1fr'
              : { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
            columnGap: 3,
            rowGap: 0.5
          }}>
          {edges.map((edge, edgeIndex) => {
            const otherId = dir === 'from' ? edge.to : edge.from;
            const other = index.byId[otherId];
            if (!other) return null;
            if (Row) return <Row
              key={`${otherId}-${edgeIndex}`}
              index={index}
              edge={edge}
              other={other}
              otherId={otherId}
              onNavigate={onNavigate}
              hrefFor={hrefFor}
            />;
            const detail = show ? show(edge.meta || {}) : null;
            return <Stack key={`${otherId}-${edgeIndex}`}>
              <Stack direction={'row'} gap={1} alignItems={'center'}>
                <EntityIcon node={other} size={24}/>
                {/* A currency has no page worth opening, so it reads as a plain label. */}
                {other.navigable === false
                  ? <Typography variant={'body2'}>{entityName(other)}</Typography>
                  : <Link
                    // A real href when the caller can address the row, so middle-click, copy-link
                    // and a crawler's rendered DOM all behave. onClick still routes it in-app.
                    {...linkProps(hrefFor, otherId)}
                    variant={'body2'}
                    underline={'hover'}
                    textAlign={'left'}
                    onClick={navigateOnPlainClick(onNavigate, otherId, Boolean(hrefFor?.(otherId)))}
                  >
                    {entityName(other)}
                  </Link>}
                {isCoin(other)
                  ? <CoinAmount amount={edge.meta?.amount ?? edge.meta?.quantity}/>
                  : detail ? <Typography variant={'caption'} color={'text.secondary'}>{detail}</Typography> : null}
                {/* A town shop's price is coins, so it is drawn as coins: 700 is 7 silver, and
                    printing the raw figure would be the wrong number rather than a big one. The
                    currency shops price in their own currency and say so with its icon. */}
                <Price price={edge.meta?.price} currency={edge.meta?.currency} size={16}/>
                {/* Quantity belongs to the item side of the edge, whichever end of it that is. */}
                {Detail ? <Detail meta={edge.meta || {}} node={dir === 'from' ? other : node}/> : null}
              </Stack>
            </Stack>;
          })}
          </Box>
        </Stack>)}
      </Stack>)}
        <ShopCatalog node={node}/>
        <EntityHistory node={node}/>
        </Box>
        {/* One rail, not a row of siblings. Every infobox used to be a flex child of the same row
            as the relations, so an entity with two of them asked for 680px of boxes beside a
            full-width column. Each InfoBox returns null when it has no rows, so the rail can end
            up with no children at all: :empty drops it rather than leaving the row's gap behind. */}
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          flexShrink: 0,
          width: { xs: '100%', md: 'auto' },
          position: { md: 'sticky' },
          top: 16,
          '&:empty': { display: 'none' }
        }}>
          {node.stamp
            ? <StampInfo node={node}/>
            : <ItemStats node={node}/>}
          {node.kind === 'quest' ? <QuestInfo node={node}/> : null}
          {/* The price belongs on the bundle rather than on its items: it buys all of them at once.
              7 of the 34 have none, because z-processing keeps the prices by hand. */}
          {node.kind === 'bundle' ? <InfoBox groups={boxGroups}/> : null}
          {/* A Starter Pack offer card is portrait art full of small text (pet, gems, crystals,
              contents), unreadable as an avatar. At its native 268px it is as wide as the infobox,
              so it sits in the rail, under the infobox that holds the facts it does not show. */}
          {node.starterOffer && node.icon ? <Box
            component={'img'}
            src={node.icon}
            alt={''}
            sx={{ width: 268, maxWidth: '100%', height: 'auto', alignSelf: 'center', borderRadius: 1 }}
          /> : null}
          {node.kind === 'pet' || node.kind === 'achievement' ? <InfoBox groups={boxGroups}/> : null}
          {/* The upgrade-cost columns are two bare numbers; the material's name lives on the edge
              rather than the node, so it is read here where the index is. */}
          <AlchemyInfo node={node} materialName={materialName}/>
          <TalentInfo node={node}/>
          <FamilyBonusInfo node={node}/>
          <CardBonus card={node.card} dropChance={cardDropChance}/>
          {monsterBox ? <InfoBox groups={monsterBox}/> : null}
          {/* After the stats box: only monsters have one, and it stays the first thing in the rail. */}
          <RegistryInfo node={node} index={index} hrefFor={hrefFor} onNavigate={onNavigate}/>
          <AnimationsBox node={node}/>
        </Box>
      </Stack>
    </CardContent>
    </Card>
  </Stack>;
};

export default EntityPanel;
