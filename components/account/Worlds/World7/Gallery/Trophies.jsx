import React from 'react';
import { Divider, Link, Stack, Typography } from '@mui/material';
import { formatNum } from '@utility/helpers';
import ItemDisplay, { ItemLine } from '@components/common/ItemDisplay';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import ItemCard from '@components/common/cards/ItemCard';
import Panel from '@components/common/cards/Panel';
import { openItemWikiPage } from '@utility/wiki/item-page';

const PODIUM_ICONS = { 1: 'GalleryPod0.png', 2: 'GalleryPod1.png', 3: 'GalleryPod2.png', 4: 'GalleryPod3.png' };
// The flat stats an item tooltip lists before its misc lines
const FLAT_STATS = [['Weapon_Power', 'Weapon Power'], ['STR', 'STR'], ['AGI', 'AGI'], ['WIS', 'WIS'], ['LUK', 'LUK'],
  ['Defence', 'Defence']];

export const itemName = (item) => (item?.displayName || item?.rawName)?.replace(/_/g, ' ');

const multiLine = (label, value) => (value ? <>
  <Divider sx={{ my: 1 }}/>
  <ItemLine title={label} value={formatNum(value, 'mult')}/>
</> : null);

// The item's stat lines, one each, as the gallery applies them: the parser fills the podium, inventory or nametag
// multi into the misc lines, and the flat stats take the same multi, so the cards add up to the Bonuses panel. One not
// acquired has no multi: its base stats. Hat Rack hands its helmets in at base, as the game's rack draws them.
const statLines = (item) => {
  const multi = item?.podiumMultiplier ?? item?.inventoryMultiplier ?? item?.nametagMultiplier ?? 1;
  return [
    ...FLAT_STATS.map(([key, label]) => (Number(item?.[key])
      ? `${formatNum(Number(item[key]) * multi, 'amount', { signed: true })} ${label}`
      : null)),
    item?.UQ1txt && item?.UQ1txt !== '0' && item?.UQ1val ? `+${item.UQ1val}${item.UQ1txt}` : null,
    item?.UQ2txt && item?.UQ2txt !== '0' && item?.UQ2val ? `+${item.UQ2val}${item.UQ2txt}` : null
  ].filter(Boolean);
};

// One catalog item (Decision 1): its sprite, its name opening its wiki page, its state in the meta line; a not
// acquired one takes the card's own dim, with its words outside the dim, in text.secondary
export const catalogCard = (item, meta) => {
  const lines = statLines(item);
  return <ItemCard key={item?.rawName} icon={`data/${item?.rawName}.png`} dimmed={!item?.isAcquired} keepMeta
                   title={<Link component={'button'} color={'inherit'}
                                onClick={() => openItemWikiPage(item?.rawName)}
                                sx={{ font: 'inherit', textAlign: 'left', verticalAlign: 'baseline' }}>{itemName(item)}</Link>}
                   meta={meta}>
    {lines.length ? <ItemCard.Desc text={lines}/> : null}
  </ItemCard>;
};

const trophyMeta = (trophy) => {
  if (!trophy?.isAcquired) return 'Not acquired';
  return trophy?.podiumLevel
    ? `Podium LV ${formatNum(trophy.podiumLevel)} · ${formatNum(trophy?.podiumMultiplier, 'mult')}`
    : `Inventory · ${formatNum(trophy?.inventoryMultiplier, 'mult')}`;
};

const Trophies = ({ trophiesUsed, bonusRows, inventoryTrophies, allTrophies, sectionFailed }) => <>
  {inventoryTrophies?.length ? <Stack gap={1} sx={{ my: 3 }}>
    <Typography variant={'sectionTitle'} component={'h2'}>Inventory trophies</Typography>
    <CardGrid size={'icon'}>
      {inventoryTrophies.map((trophy, index) => <IconTile key={`${trophy?.rawName}-${trophy?.inventoryIndex}-${index}`}
                                                          icon={`data/${trophy?.rawName}.png`} alt={itemName(trophy)}
                                                          details={<ItemDisplay {...trophy}
                                                                                additionalInfo={multiLine('Inventory multi', trophy?.inventoryMultiplier)}/>}/>)}
    </CardGrid>
  </Stack> : null}
  {trophiesUsed?.length ? <Stack gap={1} sx={{ my: 3 }}>
    <Typography variant={'sectionTitle'} component={'h2'}>Podium trophies</Typography>
    <CardGrid size={'icon'}>
      {trophiesUsed.map((trophy, index) => {
        // The podium drawn under the trophy is the tile's frame, the game's look
        const podium = `data/${PODIUM_ICONS[trophy?.podiumLevel] ?? PODIUM_ICONS[1]}`;
        return trophy?.isEmpty
          ? <IconTile key={`empty-${trophy?.trophyIndex}-${index}`} icon={podium}
                      alt={`Empty level ${trophy?.podiumLevel} podium`} value={'Empty'}/>
          : <IconTile key={`${trophy?.rawName}-${index}`} icon={`data/${trophy?.rawName}.png`} frame={podium}
                      alt={itemName(trophy)}
                      details={<ItemDisplay {...trophy} additionalInfo={multiLine('Podium multi', trophy?.podiumMultiplier)}/>}/>;
      })}
    </CardGrid>
  </Stack> : null}
  {allTrophies?.length ? <Stack gap={1} sx={{ my: 3 }}>
    <Typography variant={'sectionTitle'} component={'h2'}>All trophies</Typography>
    <CardGrid size={'s'}>{allTrophies.map((trophy) => catalogCard(trophy, sectionFailed ? undefined : trophyMeta(trophy)))}</CardGrid>
  </Stack> : null}
  {/* A guest has no bonus: no Panel, no heading */}
  {bonusRows?.length ? <Panel title={'Bonuses'} sx={{ my: 3 }}>
    {bonusRows.map(([label, value], index) => <Panel.KV key={`${label}-${index}`} label={label} value={value}/>)}
  </Panel> : null}
</>;

export default Trophies;
