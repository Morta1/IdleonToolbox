import { AppContext } from '@components/common/context/AppProvider';
import React, { useContext, useState } from 'react';
import { Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import { NextSeo } from 'next-seo';
import { getSlabBonus } from '@parsers/world-5/sailing';
import { isMissingGreenstack } from '@parsers/misc';
import { MissingData, isParseFailed, isSectionFailed } from '@components/common/styles';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import ItemCard from '@components/common/cards/ItemCard';
import { SharedNote } from '@components/common/InfoButton';

const SLAB_TOOLBAR = { search: '', show: 'missing' };
const UNREALISTIC_NOTE = 'Items you can loot but not reasonably greenstack: one-off quest rewards, shop items with a daily stock of 1 to 30, gem shop only items and event boxes. They stay out of Missing greenstacks and the greenstack total, unless you have greenstacked one.';
const SHOWS = [['missing', 'Missing items'], ['looted', 'Looted items'], ['all', 'All items'], ['rotation', 'GemShop rotation'],
  ['unobtainable', 'Unobtainable'], ['greenstacked', 'Greenstacks'], ['greenstackable', 'Missing greenstacks'],
  ['unrealistic', 'Unrealistic greenstacks']];

// The bonuses the Slab's item count feeds, named by the stat each changes (the phone list drops the sprites)
const SLAB_BONUSES = [
  { name: 'Total damage', icon: 'Arti2', value: (account) => account?.sailing?.artifacts?.[2]?.bonus },
  { name: 'Sailing speed', icon: 'Arti10', value: (account) => account?.sailing?.artifacts?.[10]?.bonus },
  { name: 'Divinity', icon: 'Arti18', value: (account) => account?.sailing?.artifacts?.[18]?.bonus },
  { name: 'Bits', icon: 'Arti20', value: (account) => account?.sailing?.artifacts?.[20]?.bonus },
  { name: 'Jade coins', icon: 'Slab4', value: (account) => getSlabBonus(account, 4) },
  { name: 'Essence', icon: 'Slab5', value: (account) => getSlabBonus(account, 5) },
  { name: 'POW', icon: 'CaveShopUpg17', value: (account) => getSlabBonus(account, 6) },
  { name: 'Research EXP', icon: 'ClassIcons61', value: (account) => getSlabBonus(account, 7) }
];

const shouldDisplayItem = (item, itemDisplay) => {
  if (itemDisplay === 'all') return true;
  else if (itemDisplay === 'looted' && item?.obtained) return true;
  else if (itemDisplay === 'missing' && !item?.obtained && !item?.unobtainable) return true;
  else if (itemDisplay === 'rotation' && item?.onRotation) return true;
  else if (itemDisplay === 'unobtainable' && item?.unobtainable) return true;
  else if (itemDisplay === 'greenstacked' && item?.greenStacked) return true;
  else if (itemDisplay === 'greenstackable' && isMissingGreenstack(item)) return true;
  else if (itemDisplay === 'unrealistic' && item?.unrealisticGreenstack) return true;
}

// The items as the old page drew them, a field of sprites 22 to a row at 1920: 48 px tiles round the usual 40 px sprite,
// 8 px apart, where 72 px tiles fit 17 (20 rows for the 326 missing items, now 15). A 32 px sprite in a 40 px tile fit
// 28 but read too small beside the old page's 50 px sprites.
const SLAB_TILE = 48;

// Its own component so the compiler keeps each tile's markup: opening the note redraws the tile it opens on and the one
// it leaves, not all 1,938.
const SlabTile = ({ item: { name, rawName, greenStacked, obtained }, dimMissing, open, onToggle }) => <IconTile
  icon={`data/${rawName}.png`}
  alt={cleanUnderscore(name)}
  height={SLAB_TILE}
  markSize={20}
  status={!obtained && dimMissing ? 'missing' : undefined}
  mark={greenStacked ? 'data/GreenSymbol.png' : undefined}
  markAlt={greenStacked ? 'Greenstacked' : undefined}
  selected={open}
  sharedNote={rawName}
  onSelect={(event) => onToggle(rawName, event.currentTarget)}/>;

const SlabNote = ({ item }) => <Stack gap={1}>
  <Typography variant={'cardTitle'} component={'div'}>{cleanUnderscore(item.name)}</Typography>
  <ItemCard.Section>
    <ItemCard.Facts rows={[
      ['Looted', item.obtained ? 'Yes' : 'No'],
      ['Greenstacked', item.greenStacked ? 'Yes' : 'No'],
      item.onRotation ? ['GemShop rotation', 'Yes'] : null,
      item.unobtainable ? ['Unobtainable', 'Yes'] : null
    ]}/>
  </ItemCard.Section>
</Stack>;

const Slab = () => {
  const { state } = useContext(AppContext);
  const looty = state?.account?.looty ?? {};
  const sectionFailed = isSectionFailed(state?.account, 'looty');
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('slab', SLAB_TOOLBAR);
  const items = looty?.slabItems ?? [];
  const offList = (looty?.lootedItems ?? 0) - items.filter(({ obtained }) => obtained).length;
  const searchTerm = (toolbar?.search ?? '').trim().toLowerCase();
  const shown = items.filter((item) => shouldDisplayItem(item, toolbar?.show ?? 'missing'))
    .filter((item) => !searchTerm || cleanUnderscore(item?.name)?.toLowerCase().includes(searchTerm));
  // Decision 13 (b): a note per tile took past 500 ms to draw "All items", so the grid shares one note, opened on the
  // hovered or clicked tile so the eye stays on it. note is the one a click keeps. A filter redraws the tiles, so it closes.
  const [note, setNote] = useState(null);
  const toggleNote = (rawName, anchor) => setNote((open) => (open?.rawName === rawName ? null : { rawName, anchor }));
  const closeNote = () => setNote(null);
  const changeToolbar = (patch) => {
    closeNote();
    setToolbar(patch);
  };
  const clearToolbar = () => {
    closeNote();
    resetToolbar();
  };
  const item = note ? shown.find(({ rawName }) => rawName === note.rawName) : null;

  return <>
    <NextSeo
      title="Slab | Idleon Toolbox"
      description="Track your Slab item collection progress and discover missing items in Legends of Idleon World 5"
    />
    {sectionFailed ? <MissingData name={'the Slab'} failed atZero={!isParseFailed(state?.account)}/> : null}
    <PageSummary failed={sectionFailed}>
      <StatTile label={'Looted items'} value={`${formatNum(looty?.lootedItems ?? 0)} / ${formatNum(looty?.totalItems ?? 0)}`}
                sub={offList > 0 ? `${formatNum(offList)} the list doesn't name` : undefined}/>
      <StatTile label={'Missing items'} value={looty?.missingItems ?? 0} kind={'amount'}/>
      <StatTile label={'Greenstacks'}
                value={`${formatNum(looty?.greenstackableStackedCount ?? 0)} / ${formatNum(looty?.greenstackableCount ?? 0)}`}/>
      {SLAB_BONUSES.map(({ name, icon, value }) => <StatTile key={name} label={name} icon={`data/${icon}.png`}
                                                              value={value(state?.account) ?? 0} kind={'pct'}/>)}
    </PageSummary>
    {sectionFailed ? null : <Toolbar state={toolbar} defaults={SLAB_TOOLBAR} onChange={changeToolbar} onReset={clearToolbar}
             total={items.length} shown={shown.length} noun={'items'}>
      <Toolbar.Search placeholder={'Search items'}/>
      <Toolbar.Show options={SHOWS.map(([value, label]) => [value, label, items.filter((item) => shouldDisplayItem(item, value)).length,
        value === 'unrealistic' ? UNREALISTIC_NOTE : undefined])}/>
    </Toolbar>}
    <SharedNote key={`${toolbar?.show}-${searchTerm}`} anchor={item ? note.anchor : null} onClose={closeNote}>
      {(rawName) => {
        const entry = shown.find((candidate) => candidate.rawName === rawName);
        return entry ? <SlabNote item={entry}/> : null;
      }}
    </SharedNote>
    <CardGrid size={'icon'} fill={SLAB_TILE}>
      {/* Where a view holds looted and missing items, a missing one greys as a not-found tile does elsewhere; Missing
          items holds only missing ones, so it keeps their colours */}
      {shown.map((entry, index) => <SlabTile key={`${entry.rawName}-${index}`} item={entry}
                                             dimMissing={(toolbar?.show ?? 'missing') !== 'missing'}
                                             open={entry.rawName === item?.rawName} onToggle={toggleNote}/>)}
    </CardGrid>
  </>;
};

export default Slab;
