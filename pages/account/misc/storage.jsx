import { AppContext } from 'components/common/context/AppProvider';
import React, { useContext } from 'react';
import { Box, Link, Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum, getCoinsArray, getTabs, groupByKey } from 'utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { NextSeo } from 'next-seo';
import { openWikiEntity } from '@utility/wiki/item-page';
import StatusText from '@components/common/StatusText';
import ItemDisplay from '@components/common/ItemDisplay';
import Tabber from '@components/common/Tabber';
import { PAGES } from '@components/constants';
import CoinDisplay from '@components/common/CoinDisplay';
import Notice from '@components/common/Notice';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import Panel from '@components/common/cards/Panel';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';
import { MissingData, isSectionFailed } from '@components/common/styles';
import useTabIndex from '@hooks/useTabIndex';

// The exact digits only while a double holds them (2^53); past that the coins already say it, and under 100 (one coin
// tier) they repeat it
const exactCoins = (coins) => (Number.isFinite(coins) && coins >= 100 && coins < Number.MAX_SAFE_INTEGER
  ? formatNum(Math.floor(coins), 'exact') : undefined);
// The tiers wrap between coins in a narrow tile (the phone Summary's column), never inside a coin's number
const moneyValue = (coins) => (Number.isFinite(coins) ? <Box component={'span'} sx={{ overflowWrap: 'normal' }}>
  <CoinDisplay dense money={getCoinsArray(coins)} style={{ flexWrap: 'wrap', rowGap: 2 }}/>
</Box> : '-');

const ITEMS_TOOLBAR = { search: '', sort: null, view: 'all' };

// A chest: its slots, whether it is found, and its page on the toolbox's own wiki (5i's stamps precedent)
const chestDetails = (chest) => <Stack gap={0.5} alignItems={'flex-start'}>
  <Typography variant={'cardTitle'} component={'div'}>{cleanUnderscore(chest?.displayName)}</Typography>
  <Typography variant={'body2'}>{`${formatNum((chest?.amount || chest?.capacity) ?? 0)} slots`}</Typography>
  {chest?.unlocked ? <StatusText status={'done'}>Found</StatusText> : <StatusText status={'needs'}>Not found yet</StatusText>}
  <Link component={'button'} variant={'body2'} onClick={() => openWikiEntity(`item:${chest?.rawName}`)}>Wiki page ›</Link>
</Stack>;

const Looty = () => {
  const { state } = useContext(AppContext);
  const tabs = getTabs(PAGES.ACCOUNT.misc.categories, 'storage');
  const [tabIndex] = useTabIndex(tabs);
  const storageFailed = isSectionFailed(state?.account, 'storage');
  // The money tiles read the currencies section: a failed one dashes them, named in the page's one note
  const currenciesFailed = isSectionFailed(state?.account, 'currencies');
  const failedNames = [storageFailed && 'Storage', currenciesFailed && 'Currencies'].filter(Boolean);
  const list = state?.account?.storage?.list ?? [];
  const greenStacks = new Set(state?.account?.storage?.greenStacks ?? []);
  const { bankMoney, rawMoney } = state?.account?.currencies ?? {};
  const [view, setView, resetView] = useToolbarState('storage-items', ITEMS_TOOLBAR);
  const search = view.search?.trim().toLowerCase();
  const shown = search
    ? list.filter((item) => cleanUnderscore(item?.name ?? item?.rawName ?? '').toLowerCase().includes(search))
    : list;
  const sorted = view.sort?.key === 'amount'
    ? shown.toSorted((a, b) => (view.sort.order === 'asc' ? 1 : -1) * ((a?.amount ?? 0) - (b?.amount ?? 0)))
    : shown;
  // The greenstack symbol is the game's own mark for a stack of 10M or more
  const itemTile = (item, index) => <IconTile key={`${item?.rawName}-${index}`} icon={`data/${item?.rawName}.png`}
                                              alt={cleanUnderscore(item?.name ?? item?.rawName)}
                                              value={formatGame(item?.amount ?? 0, 'Big', { whole: true })}
                                              mark={greenStacks.has(item?.rawName) ? 'data/GreenSymbol.png' : undefined}
                                              markAlt={'Greenstacked'}
                                              details={<ItemDisplay {...item} account={state?.account} showAmount/>}/>;
  const slots = state?.account?.storage?.slots;
  const slotsText = storageFailed ? '-' : formatNum(slots?.value ?? 0);
  const groups = view.view === 'type' ? Object.entries(groupByKey(sorted, ({ Type }) => Type)) : [];

  return (
    <>
      <NextSeo
        title="Storage | Idleon Toolbox"
        description="Browse your full storage inventory with item counts, chest slots, and capacity in Legends of Idleon"
      />
      {failedNames.length ? <MissingData name={failedNames.join(' and ')} failed atZero={storageFailed && tabs[tabIndex] === 'Slots'}/> : null}
      <PageSummary>
        <StatTile label={'Storage money'} value={currenciesFailed ? '-' : moneyValue(bankMoney)}
                  sub={currenciesFailed ? undefined : exactCoins(bankMoney)}/>
        <StatTile label={'Total money'} value={currenciesFailed ? '-' : moneyValue(rawMoney)}
                  sub={currenciesFailed ? undefined : exactCoins(rawMoney)}
                  info={'Your storage and every character\'s coins together.'}/>
      </PageSummary>
      <Tabber tabs={tabs}>
        <Box>
          {list.length ? <Toolbar state={view} defaults={ITEMS_TOOLBAR} onChange={setView} onReset={resetView}
                                  total={list.length} shown={shown.length} noun={'items'}>
            <Toolbar.Search placeholder={'Search items'}/>
            <Toolbar.Sort options={[['amount', 'Stack size', 'desc']]}/>
            <Toolbar.View options={[['all', 'All items'], ['type', 'By type']]}/>
          </Toolbar> : null}
          {!list.length
            ? storageFailed ? null : <Notice tone={state?.emptyAccount ? 'signin' : 'info'}>{state?.emptyAccount
              ? 'Your storage items show here once you sign in.' : 'Your storage chest is empty.'}</Notice>
            : view.view === 'type'
              ? <Stack gap={2}>{groups.map(([type, items]) => <Panel key={type}
                                                                     title={cleanUnderscore(type).toLowerCase().capitalize()}
                                                                     meta={`${formatNum(items.length)} ${items.length === 1 ? 'item' : 'items'}`}>
                <Box sx={{ p: 1.5 }}><CardGrid size={'icon'}>{items.map(itemTile)}</CardGrid></Box>
              </Panel>)}</Stack>
              : <CardGrid size={'icon'}>{sorted.map(itemTile)}</CardGrid>}
        </Box>
        <Stack gap={2}>
          <StatTile label={'Slots owned'} icon={'data/InvStorage1.png'} value={slotsText} breakdownTitle={'Slots owned'}
                    breakdown={!storageFailed && slots?.breakdown ? { ...slots.breakdown, totalValue: slotsText } : undefined}/>
          <CardGrid size={'icon'}>
            {(state?.account?.storage?.storageChests ?? []).map((chest) => <IconTile key={chest?.rawName}
                                                                                   icon={`data/${chest?.rawName}.png`}
                                                                                   alt={cleanUnderscore(chest?.displayName)}
                                                                                   value={`+${formatNum((chest?.amount || chest?.capacity) ?? 0)}`}
                                                                                   status={chest?.unlocked ? undefined : 'missing'}
                                                                                   details={chestDetails(chest)}/>)}
          </CardGrid>
        </Stack>
      </Tabber>
    </>
  );
};

export default Looty;
