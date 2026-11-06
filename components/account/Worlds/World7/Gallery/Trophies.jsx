import React from 'react';
import { Box, Divider, Stack, Typography } from '@mui/material';
import { formatNum } from '@utility/helpers';
import ItemDisplay, { ItemLine } from '@components/common/ItemDisplay';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import ItemCard from '@components/common/cards/ItemCard';
import Panel from '@components/common/cards/Panel';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
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

// One catalog item (Decision 1): its sprite, its name opening its wiki page. An acquired one has the done state in the
// words given (acquired null: a list where all are, nothing to tell apart), and meta is its other facts; a not acquired
// one takes the card's own dim, with its words outside the dim, in text.secondary. failed: the catalog at zero, no state.
export const catalogCard = (item, { meta, acquired = 'Acquired', notAcquired = 'Not acquired', failed } = {}) => {
  const lines = statLines(item);
  const state = item?.isAcquired ? { status: acquired ? 'done' : undefined, statusLabel: acquired, meta } : { meta: notAcquired };
  return <ItemCard key={item?.rawName} icon={`data/${item?.rawName}.png`} dimmed={!item?.isAcquired} keepMeta
                   title={<ItemCard.TitleLink text={itemName(item)} onClick={() => openItemWikiPage(item?.rawName)}/>}
                   {...(failed ? {} : state)}>
    {lines.length ? <ItemCard.Desc text={lines}/> : null}
  </ItemCard>;
};

const CATALOG_TOOLBAR = { search: '', show: 'all' };

// A catalog under its filter, Slab's Search and Show. The default shows everything, so a guest sees the whole catalog.
// The bar pins within this box and leaves with its cards. A failed section has no bar and shows every card: nothing on
// the page could take back a filter it remembers. meta: an acquired item's other facts.
export const CatalogList = ({ page, title, noun, items, meta, acquired = 'Acquired', notAcquired = 'Not acquired', failed }) => {
  const [toolbar, setToolbar, resetToolbar] = useToolbarState(page, CATALOG_TOOLBAR);
  if (!items?.length) return null;
  const searchTerm = (toolbar?.search ?? '').trim().toLowerCase();
  const inShow = (item) => toolbar?.show === 'all' || (toolbar?.show === 'acquired') === Boolean(item?.isAcquired);
  const shown = failed ? items : items.filter(inShow).filter((item) => !searchTerm || itemName(item)?.toLowerCase().includes(searchTerm));
  const acquiredCount = items.filter((item) => item?.isAcquired).length;
  return <Box sx={{ mb: 3 }}>
    {failed ? null : <Toolbar state={toolbar} defaults={CATALOG_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
                              total={items.length} shown={shown.length} noun={noun}>
      <Toolbar.Search placeholder={`Search ${noun}`}/>
      <Toolbar.Show options={[['all', 'All', items.length], ['acquired', acquired, acquiredCount], ['missing', notAcquired, items.length - acquiredCount]]}/>
    </Toolbar>}
    {shown.length ? <Stack gap={1.5}>
      <Typography variant={'sectionTitle'} component={'h2'}>{title}</Typography>
      <CardGrid size={'s'}>
        {shown.map((item) => catalogCard(item, { meta: meta?.(item), acquired, notAcquired, failed }))}
      </CardGrid>
    </Stack> : null}
  </Box>;
};

const trophyMeta = (trophy) => {
  if (!trophy?.isAcquired) return null;
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
  <CatalogList page={'gallery-trophies'} title={'All trophies'} noun={'trophies'} items={allTrophies} meta={trophyMeta} failed={sectionFailed}/>
  {/* A guest has no bonus: no Panel, no heading */}
  {bonusRows?.length ? <Panel title={'Bonuses'} sx={{ my: 3 }}>
    {bonusRows.map(([label, value], index) => <Panel.KV key={`${label}-${index}`} label={label} value={value}/>)}
  </Panel> : null}
</>;

export default Trophies;
