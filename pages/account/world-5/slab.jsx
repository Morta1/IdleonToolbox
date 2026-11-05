import { AppContext } from '@components/common/context/AppProvider';
import React, { useContext, useState } from 'react';
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
import Panel from '@components/common/cards/Panel';
import GameIcon from '@components/common/GameIcon';

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

const Slab = () => {
  const { state } = useContext(AppContext);
  const looty = state?.account?.looty ?? {};
  const sectionFailed = isSectionFailed(state?.account, 'looty');
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('slab', SLAB_TOOLBAR);
  const items = looty?.slabItems ?? [];
  const searchTerm = (toolbar?.search ?? '').trim().toLowerCase();
  const shown = items.filter((item) => shouldDisplayItem(item, toolbar?.show ?? 'missing'))
    .filter((item) => !searchTerm || cleanUnderscore(item?.name)?.toLowerCase().includes(searchTerm));
  // Decision 13 (b): a note per tile took past 500 ms to draw "All items", so one Panel shows the picked item (the
  // first one shown until a tile is picked)
  const [picked, setPicked] = useState(null);
  const item = shown.find(({ rawName }) => rawName === picked) ?? shown[0];
  // The Panel pins under the Toolbar, so a tile picked far down the grid shows its details in view
  const [stickyTop, setStickyTop] = useState(0);

  return <>
    <NextSeo
      title="Slab | Idleon Toolbox"
      description="Track your Slab item collection progress and discover missing items in Legends of Idleon World 5"
    />
    {sectionFailed ? <MissingData name={'the Slab'} failed atZero={!isParseFailed(state?.account)}/> : null}
    <PageSummary failed={sectionFailed}>
      <StatTile label={'Looted items'} value={`${formatNum(looty?.lootedItems ?? 0)} / ${formatNum(looty?.totalItems ?? 0)}`}/>
      <StatTile label={'Missing items'} value={looty?.missingItems ?? 0} kind={'amount'}/>
      <StatTile label={'Greenstacks'}
                value={`${formatNum(looty?.greenstackableStackedCount ?? 0)} / ${formatNum(looty?.greenstackableCount ?? 0)}`}/>
      {SLAB_BONUSES.map(({ name, icon, value }) => <StatTile key={name} label={name} icon={`data/${icon}.png`}
                                                              value={value(state?.account) ?? 0} kind={'pct'}/>)}
    </PageSummary>
    {sectionFailed ? null : <Toolbar state={toolbar} defaults={SLAB_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
             total={items.length} shown={shown.length} noun={'items'} onStickyBottom={setStickyTop}>
      <Toolbar.Search placeholder={'Search items'}/>
      <Toolbar.Show options={SHOWS.map(([value, label]) => [value, label, items.filter((item) => shouldDisplayItem(item, value)).length,
        value === 'unrealistic' ? UNREALISTIC_NOTE : undefined])}/>
    </Toolbar>}
    {item ? <Panel icon={<GameIcon src={`data/${item.rawName}.png`} size={24} alt={''}/>}
                   title={cleanUnderscore(item.name)}
                   sx={{ mb: 2, position: 'sticky', top: stickyTop, zIndex: (theme) => theme.zIndex.appBar - 2 }}>
      <Panel.KV label={'Looted'} value={item.obtained ? 'Yes' : 'No'}/>
      <Panel.KV label={'Greenstacked'} value={item.greenStacked ? 'Yes' : 'No'}/>
      {item.onRotation ? <Panel.KV label={'GemShop rotation'} value={'Yes'}/> : null}
      {item.unobtainable ? <Panel.KV label={'Unobtainable'} value={'Yes'}/> : null}
    </Panel> : null}
    <CardGrid size={'icon'}>
      {/* Where a view holds looted and missing items, a missing one greys as a not-found tile does elsewhere; Missing
          items holds only missing ones, so it keeps their colours */}
      {shown.map(({ name, rawName, greenStacked, obtained }, index) => <IconTile
        key={`${rawName}-${index}`} icon={`data/${rawName}.png`}
        alt={cleanUnderscore(name)}
        status={!obtained && (toolbar?.show ?? 'missing') !== 'missing' ? 'missing' : undefined}
        mark={greenStacked ? 'data/GreenSymbol.png' : undefined}
        markAlt={greenStacked ? 'Greenstacked' : undefined}
        selected={rawName === item?.rawName}
        onSelect={() => setPicked(rawName)}/>)}
    </CardGrid>
  </>;
};

export default Slab;
