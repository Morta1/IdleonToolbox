import React, { useState } from 'react';
import { Box, Card, CardContent, Chip, Link, Stack, Typography } from '@mui/material';
import CardBonus from './CardBonus';
import InfoBox from './InfoBox';
import ItemStats from './ItemStats';
import MonsterInfo from './MonsterInfo';
import QuestInfo from './QuestInfo';
import StampInfo from './StampInfo';
import AlchemyInfo from './AlchemyInfo';
import TalentInfo from './TalentInfo';
import { dropOdds, dropQuantityLabel, dropTalentLabel, dropTierGroups, percentLabel } from '@utility/wiki/drops';
import { entityName } from '@utility/wiki/names';
import { cleanUnderscore, prefix } from '@utility/helpers';
import { hasListing } from '@utility/wiki/kinds.mjs';
import { collapseRows, tableThreshold } from '@utility/wiki/relations';
import RelationTable from './RelationTable';
import NpcQuestRow from './NpcQuestRow';
import CoinAmount, { isCoin } from './CoinAmount';
import Price from './Price';

export { entityName };

export const KIND_LABELS = {
  item: 'Item',
  monster: 'Monster',
  npc: 'NPC',
  quest: 'Quest',
  achievement: 'Achievement',
  world: 'World',
  class: 'Class',
  talent: 'Talent',
  pet: 'Pet',
  bundle: 'Bundle',
  shop: 'Shop',
  map: 'Map',
  vial: 'Vial',
  bubble: 'Bubble'
};

// NPC pluralises without an s on the label itself, so this cannot be derived from KIND_LABELS.
export const KIND_PLURALS = {
  item: 'Items',
  monster: 'Monsters',
  npc: 'NPCs',
  quest: 'Quests',
  achievement: 'Achievements',
  world: 'Worlds',
  class: 'Classes',
  talent: 'Talents',
  pet: 'Pets',
  bundle: 'Bundles',
  shop: 'Shops',
  map: 'Maps',
  vial: 'Vials',
  bubble: 'Bubbles'
};


// The panel is reached from search, from a category listing, or from another entity's row, so it
// carries its own way back up rather than leaving browser history as the only route. A kind with
// no listing of its own (quests) shows only the first crumb: the second would be a dead link.
const Breadcrumb = ({ kind, onBack, onBrowseKind }) => <Stack
  direction={'row'} gap={0.75} alignItems={'baseline'} flexWrap={'wrap'}
>
  <Link component={'button'} type={'button'} variant={'body2'} underline={'hover'}
        onClick={() => onBack?.()}>
    All categories
  </Link>
  {hasListing(kind) ? <>
    <Typography variant={'caption'} color={'text.disabled'}>/</Typography>
    <Link component={'button'} type={'button'} variant={'body2'} underline={'hover'}
          onClick={() => onBrowseKind?.(kind)}>
      {KIND_PLURALS[kind] || kind}
    </Link>
  </> : null}
</Stack>;

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
// The trapping efficiency a map wants before it yields anything.
const harvestLabel = (meta) => (meta?.efficiencyReq > 0 ? `${meta.efficiencyReq.toLocaleString('en-US')} efficiency` : '');
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

// Every section is one relation read in one direction: `from` follows the edges leaving this
// entity, `to` follows the edges arriving at it. The same rel therefore appears twice under two
// different titles (an item is crafted from things, and is itself used in crafting).
// The odds read as "1 in N" with the percentage a hover away, matching the wiki. The dotted
// underline is the affordance saying there is something to hover.
const DropChance = ({ meta, node }) => {
  const odds = dropOdds(meta);
  if (!odds) return null;
  // Coins carry their amount in the smallest denomination, so the raw quantity is not the number
  // to print; CoinAmount already rendered it beside the name.
  const quantity = isCoin(node) ? '' : dropQuantityLabel(meta);
  const talent = dropTalentLabel(meta);
  const percentage = percentLabel(meta?.effectiveChance ?? meta?.chance);
  return <>
    {/* A chip rather than another caption: it qualifies what the row IS, and would otherwise be
        read as part of the run of numbers beside it. */}
    {meta?.recipe ? <Chip size={'small'} variant={'outlined'} label={'Recipe'}/> : null}
    {talent ? <Typography variant={'caption'} color={'text.secondary'}>{talent}</Typography> : null}
    {quantity ? <Typography variant={'caption'} color={'text.secondary'}>{quantity}</Typography> : null}
    <Typography variant={'caption'} color={'text.secondary'}>{odds}</Typography>
    {/* Both numbers on the row rather than one of them behind a hover. "1 in 618" is what a player
        quotes and a percentage is what the game's drop tables are written in, and neither converts
        in the head. Which table a tiered drop sits in is already the band heading above the row. */}
    {percentage ? <Typography variant={'caption'} color={'text.disabled'}>{percentage}</Typography> : null}
  </>;
};

const REL_SECTIONS = {
  item: [
    { title: 'Dropped by', dir: 'to', rel: 'drops', Detail: DropChance },
    { title: 'Crafted from', dir: 'from', rel: 'craftedFrom', show: quantityLabel },
    { title: 'Used in crafting', dir: 'to', rel: 'craftedFrom', show: quantityLabel },
    // Quests and achievements both pay out through `rewards`, so this heading names neither.
    { title: 'Reward from', dir: 'to', rel: 'rewards', show: amountLabel },
    { title: 'Required by quest', dir: 'to', rel: 'requires', show: amountLabel },
    // Vials, bubbles and stamps are all "upgraded with" an item, so one relation covers all three
    // and the section reads for whichever of them points here.
    { title: 'Material', dir: 'from', rel: 'upgradedWith' },
    { title: 'Used in upgrades', dir: 'to', rel: 'upgradedWith', show: costLabel },
    { title: 'Sold by', dir: 'to', rel: 'sells' },
    // Both ends of a container: the box lists what it can roll, and each obol lists the box it
    // comes out of, which for every obol in the game is its only source.
    { title: 'Opens into', dir: 'from', rel: 'yields', show: yieldLabel },
    // Both a container and a bundle yield an item, so this reads for either rather than saying
    // "opened from" of a thing that was bought.
    { title: 'Obtained from', dir: 'to', rel: 'yields', show: yieldLabel },
    // Trapping: the map is where the critter is caught, and no drop table mentions a critter.
    { title: 'Caught in', dir: 'to', rel: 'harvests', show: harvestLabel },
    { title: 'Achievements', dir: 'to', rel: 'about' }
  ],
  monster: [
    { title: 'Drops', dir: 'from', rel: 'drops', Detail: DropChance, tiered: true },
    { title: 'Found in', dir: 'to', rel: 'spawns', show: spawnLabel },
    { title: 'Achievements', dir: 'to', rel: 'about' }
  ],
  npc: [
    { title: 'Found in', dir: 'to', rel: 'hosts' },
    // A chain of quests is not a list of names: each step has a brief, a difficulty, objectives and
    // rewards, so it renders as a block of its own rather than through the generic row.
    { title: 'Quests', dir: 'from', rel: 'gives', Row: NpcQuestRow },
    { title: 'Achievements', dir: 'to', rel: 'about' }
  ],
  shop: [
    { title: 'Located in', dir: 'to', rel: 'hasShop' },
    { title: 'Sells', dir: 'from', rel: 'sells' }
  ],
  map: [
    { title: 'World', dir: 'to', rel: 'contains' },
    { title: 'Enemy', dir: 'from', rel: 'spawns', show: spawnLabel },
    { title: 'Critters', dir: 'from', rel: 'harvests', show: harvestLabel },
    { title: 'NPCs', dir: 'from', rel: 'hosts' },
    { title: 'Shop', dir: 'from', rel: 'hasShop' },
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

// NPCs and quests carry no icon, and the build nulls the 135 paths whose art the game never
// shipped. Both cases collapse to an empty box of the same size so the rows stay aligned. The
// onError fallback still matters for art that disappears between graph builds.
// Remount this on the entity it belongs to, or `broken` outlives the icon that set it.
export const EntityIcon = ({ node, size }) => {
  const [broken, setBroken] = useState(false);
  if (!node?.icon || broken) return <Box sx={{ width: size, height: size, flexShrink: 0 }}/>;
  return <img
    src={node.icon}
    alt=""
    width={size}
    height={size}
    style={{ objectFit: 'contain', flexShrink: 0 }}
    onError={() => setBroken(true)}
  />;
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

const AnimationsBox = ({ node }) => {
  if (!node?.animations?.length) return null;
  const dir = ANIMATION_DIRS[node.kind];
  if (!dir) return null;
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

// Gems are not an item and have no node, so they cannot be a row like everything else on the page.
const GemCount = ({ amount, isGreen }) => <Stack direction={'row'} gap={0.5} alignItems={'center'}>
  <img
    src={`${prefix}data/PremiumGem.png`}
    alt={''}
    width={16}
    height={16}
    style={{ objectFit: 'contain', filter: isGreen ? 'hue-rotate(280deg)' : 'unset' }}
  />
  <span>{amount.toLocaleString('en-US')}</span>
</Stack>;

const EntityPanel = ({ index, id, onNavigate, onBack, onBrowseKind, hrefFor }) => {
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

  // .filter() copies, so nothing here touches the arrays the index holds. A tiered section is
  // split into the game's drop-table tiers; every other section is one unlabelled group.
  const sections = (REL_SECTIONS[node.kind] || [])
    .map((section) => {
      const edges = ((section.dir === 'from' ? index.edgesFrom.get(id) : index.edgesTo.get(id)) || [])
        .filter((edge) => edge.rel === section.rel);
      const groups = (section.tiered ? dropTierGroups(edges) : [{ key: section.rel, edges }])
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
        note: section.rel === 'craftedFrom' && section.dir === 'from' ? unlockNote(node.recipeUnlock) : null
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

  return <Stack gap={1.5}>
    <Breadcrumb kind={node.kind} onBack={onBack} onBrowseKind={onBrowseKind}/>
    <Card variant={'outlined'}>
    <CardContent>
      {/* A bundle's banner is the shop art the game sells it with: wide, and carrying its name and
          contents. A world's is the island map the game draws when you pick where to travel, which
          is the same shape and the same job. Both read as a header rather than as an avatar, so
          they span the card and the title sits under them. */}
      {WIDE_HEADER[node.kind] && node.icon ? <Box
        component={'img'}
        src={node.icon}
        alt={''}
        sx={{ width: '100%', maxWidth: WIDE_HEADER[node.kind], height: 'auto', borderRadius: 1, mb: 1.5 }}
      /> : null}
      <Stack direction={'row'} gap={1.5} alignItems={'center'} flexWrap={'wrap'}>
        {node.icon && !WIDE_HEADER[node.kind] ? <EntityIcon key={id} node={node} size={72}/> : null}
        <Typography variant={'h5'} component={'h2'}>{entityName(node)}</Typography>
        <Chip size={'small'} variant={'outlined'} label={kindChip}/>
        {showCategory ? <Chip size={'small'} variant={'outlined'} label={node.category}/> : null}
      </Stack>
      {/* Relations read as the main column; the stat infobox sits beside them on a wide
          screen and drops underneath once there is no room, the way a wiki page does. */}
      <Stack direction={{ xs: 'column', md: 'row' }} gap={3} alignItems={'flex-start'} sx={{ mt: 1.5 }}>
        <Box sx={{ flexGrow: 1, minWidth: 0, width: '100%' }}>
          {/* A vial or bubble's description is a template with a `{` in it, and AlchemyInfo is
              what fills that in; printing the raw form here would show the brace. */}
          {/* A talent's description is a template too, and TalentInfo is what fills it in at
              each level, so the raw form with its braces never reaches the page. */}
          {node.description && !node.stamp && !node.effect && node.kind !== 'talent'
            ? <Typography variant={'body2'} color={'text.secondary'}>
              {cleanUnderscore(node.description)}
            </Typography>
            : null}
      {sections.length === 0 ? <Typography sx={{ mt: 2 }} color={'text.secondary'}>
        Nothing is linked to this entity yet.
      </Typography> : null}
      {sections.map(({ title, dir, groups, size, show, note, Detail, Row, tabular }) => <Stack key={title} sx={{ mt: 3 }} gap={0.5}>
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
        {tabular ? null : groups.map(({ key, label, odds, table, edges }) => <Stack key={key} gap={0.5}>
          {label ? <Stack direction={'row'} gap={1} alignItems={'baseline'} flexWrap={'wrap'} sx={{ mt: 1 }}>
            <Typography variant={'body2'} fontWeight={600}>{label}</Typography>
            {odds ? <Typography variant={'caption'} color={'text.secondary'}>{odds}</Typography> : null}
            {table ? <Typography variant={'caption'} color={'text.disabled'}>{table}</Typography> : null}
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
                    {...(hrefFor?.(otherId) ? { href: hrefFor(otherId) } : { component: 'button', type: 'button' })}
                    variant={'body2'}
                    underline={'hover'}
                    textAlign={'left'}
                    onClick={(event) => {
                      if (!onNavigate) return;
                      event.preventDefault();
                      onNavigate(otherId);
                    }}
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
          {node.kind === 'bundle' ? <InfoBox groups={[{
            title: 'Bundle',
            rows: [
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
              }] : [])
            ]
          }]}/> : null}
          {/* Tournament power is the number that decides whether a pet is worth using, and the
              upgraded row is the same pet after its second copy: a different pet in play, the same
              page to a reader. */}
          {node.kind === 'pet' ? <InfoBox groups={[{
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
                : [])
            ]
          }]}/> : null}
          {/* The two things about an achievement that are not in its description. Steam-only ones
              cannot be earned in the browser or mobile client at all, and a secret one hides its
              objective in game, which is why its description here reads short. */}
          {node.kind === 'achievement' ? <InfoBox groups={[{
            title: 'Achievement',
            rows: [
              ...(node.quantity > 1
                ? [{ label: 'Target', value: node.quantity.toLocaleString('en-US') }]
                : []),
              ...(node.steamExclusive ? [{ label: 'Steam only', value: 'Yes' }] : []),
              ...(node.secret ? [{ label: 'Secret', value: 'Yes' }] : [])
            ]
          }]}/> : null}
          {/* The upgrade-cost columns are two bare numbers; the material's name lives on the edge
              rather than the node, so it is read here where the index is. */}
          <AlchemyInfo node={node} materialName={materialName}/>
          <TalentInfo node={node}/>
          <CardBonus card={node.card} dropChance={cardDropChance}/>
          {node.kind === 'monster' ? <MonsterInfo
            node={node}
            index={index}
            card={cardDrop ? index.byId[cardDrop.to].card : null}
            cardId={cardDrop?.to}
            cardDropChance={cardDrop?.meta?.effectiveChance}
            onNavigate={onNavigate}
          /> : null}
          <AnimationsBox node={node}/>
        </Box>
      </Stack>
    </CardContent>
    </Card>
  </Stack>;
};

export default EntityPanel;
