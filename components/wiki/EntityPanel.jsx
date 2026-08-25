import React, { useState } from 'react';
import { Box, Card, CardContent, Chip, Link, Stack, Typography } from '@mui/material';
import Tooltip from '@components/Tooltip';
import CardBonus from './CardBonus';
import ItemStats from './ItemStats';
import MonsterInfo from './MonsterInfo';
import QuestInfo from './QuestInfo';
import StampInfo from './StampInfo';
import AlchemyInfo from './AlchemyInfo';
import { dropChanceLabel, dropOdds, dropQuantityLabel, dropTalentLabel, dropTierGroups } from '@utility/wiki/drops';
import { entityName } from '@utility/wiki/names';
import { hasListing } from '@utility/wiki/kinds.mjs';
import { collapseRows, TABLE_THRESHOLD } from '@utility/wiki/relations';
import RelationTable from './RelationTable';
import NpcQuestRow from './NpcQuestRow';
import CoinAmount, { isCoin } from './CoinAmount';

export { entityName };

export const KIND_LABELS = {
  item: 'Item',
  monster: 'Monster',
  npc: 'NPC',
  quest: 'Quest',
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

const quantityLabel = (meta) => (meta?.quantity != null ? `x${meta.quantity.toLocaleString('en-US')}` : '');
const amountLabel = (meta) => (meta?.amount != null ? `x${meta.amount.toLocaleString('en-US')}` : '');
const spawnLabel = (meta) => (meta?.count > 0 ? `${meta.count} spawns` : '');
const orderLabel = (meta) => (meta?.order != null ? `#${meta.order}` : '');
// A bubble's base cost, which is the level-one price. What it actually costs depends on the
// bubble's level and on half a dozen account bonuses, none of which a save-less page has.
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
  return <>
    {/* A chip rather than another caption: it qualifies what the row IS, and would otherwise be
        read as part of the run of numbers beside it. */}
    {meta?.recipe ? <Chip size={'small'} variant={'outlined'} label={'Recipe'}/> : null}
    {talent ? <Typography variant={'caption'} color={'text.secondary'}>{talent}</Typography> : null}
    {quantity ? <Typography variant={'caption'} color={'text.secondary'}>{quantity}</Typography> : null}
    <Tooltip title={dropChanceLabel(meta)}>
      <Typography
        variant={'caption'}
        color={'text.secondary'}
        sx={{ borderBottom: '1px dotted', borderColor: 'text.disabled', cursor: 'help' }}
      >
        {odds}
      </Typography>
    </Tooltip>
  </>;
};

const REL_SECTIONS = {
  item: [
    { title: 'Dropped by', dir: 'to', rel: 'drops', Detail: DropChance },
    { title: 'Crafted from', dir: 'from', rel: 'craftedFrom', show: quantityLabel },
    { title: 'Used in crafting', dir: 'to', rel: 'craftedFrom', show: quantityLabel },
    { title: 'Reward from quest', dir: 'to', rel: 'rewards', show: amountLabel },
    { title: 'Required by quest', dir: 'to', rel: 'requires', show: amountLabel },
    // Vials, bubbles and stamps are all "upgraded with" an item, so one relation covers all three
    // and the section reads for whichever of them points here.
    { title: 'Material', dir: 'from', rel: 'upgradedWith' },
    { title: 'Used in upgrades', dir: 'to', rel: 'upgradedWith', show: costLabel },
    { title: 'Sold by', dir: 'to', rel: 'sells' }
  ],
  monster: [
    { title: 'Drops', dir: 'from', rel: 'drops', Detail: DropChance, tiered: true },
    { title: 'Found in', dir: 'to', rel: 'spawns', show: spawnLabel }
  ],
  npc: [
    { title: 'Found in', dir: 'to', rel: 'hosts' },
    // A chain of quests is not a list of names: each step has a brief, a difficulty, objectives and
    // rewards, so it renders as a block of its own rather than through the generic row.
    { title: 'Quests', dir: 'from', rel: 'gives', Row: NpcQuestRow }
  ],
  shop: [
    { title: 'Located in', dir: 'to', rel: 'hasShop' },
    { title: 'Sells', dir: 'from', rel: 'sells' }
  ],
  map: [
    { title: 'Enemy', dir: 'from', rel: 'spawns', show: spawnLabel },
    { title: 'NPCs', dir: 'from', rel: 'hosts' },
    { title: 'Shop', dir: 'from', rel: 'hasShop' },
    { title: 'Connects to', dir: 'from', rel: 'connectsTo' },
    { title: 'Reachable from', dir: 'to', rel: 'connectsTo' }
  ],
  vial: [
    { title: 'Material', dir: 'from', rel: 'upgradedWith' }
  ],
  bubble: [
    { title: 'Material', dir: 'from', rel: 'upgradedWith', show: costLabel }
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
    style={{ objectFit: 'contain', flexShrink: 0, imageRendering: 'pixelated' }}
    onError={() => setBroken(true)}
  />;
};

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
      return { ...section, groups, size, tabular: size > TABLE_THRESHOLD && !section.Row };
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
      <Stack direction={'row'} gap={1.5} alignItems={'center'} flexWrap={'wrap'}>
        {node.icon ? <EntityIcon key={id} node={node} size={72}/> : null}
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
          {node.description && !node.stamp && !node.effect
            ? <Typography variant={'body2'} color={'text.secondary'}>{node.description}</Typography>
            : null}
      {sections.length === 0 ? <Typography sx={{ mt: 2 }} color={'text.secondary'}>
        Nothing is linked to this entity yet.
      </Typography> : null}
      {sections.map(({ title, dir, groups, size, show, Detail, Row, tabular }) => <Stack key={title} sx={{ mt: 3 }} gap={0.5}>
        <Typography variant={'subtitle2'} color={'text.secondary'} textTransform={'uppercase'}
                    letterSpacing={0.5}>
          {title}
        </Typography>
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
          {/* The upgrade-cost columns are two bare numbers; the material's name lives on the edge
              rather than the node, so it is read here where the index is. */}
          <AlchemyInfo node={node} materialName={materialName}/>
          <CardBonus card={node.card} dropChance={cardDropChance}/>
          {node.kind === 'monster' ? <MonsterInfo
            node={node}
            index={index}
            card={cardDrop ? index.byId[cardDrop.to].card : null}
            cardId={cardDrop?.to}
            cardDropChance={cardDrop?.meta?.effectiveChance}
            onNavigate={onNavigate}
          /> : null}
        </Box>
      </Stack>
    </CardContent>
    </Card>
  </Stack>;
};

export default EntityPanel;
