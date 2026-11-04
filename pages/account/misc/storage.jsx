import { AppContext } from 'components/common/context/AppProvider';
import React, { useContext } from 'react';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum, getCoinsArray, getTabs, groupByKey } from 'utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { NextSeo } from 'next-seo';
import Image from 'next/image';
import { prefix } from 'utility/helpers';
import ItemDisplay from '@components/common/ItemDisplay';
import Tabber from '@components/common/Tabber';
import { PAGES } from '@components/constants';
import { CardWithBreakdown } from '@components/common/Breakdown/CardWithBreakdown';
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

// The exact digits only while a double holds them (2^53); past that the coins already say it, and under 100 (one coin
// tier) they repeat it
const exactCoins = (coins) => (Number.isFinite(coins) && coins >= 100 && coins < Number.MAX_SAFE_INTEGER
  ? formatNum(Math.floor(coins), 'exact') : undefined);
const moneyValue = (coins) => (Number.isFinite(coins) ? <CoinDisplay dense money={getCoinsArray(coins)}/> : '-');

const ITEMS_TOOLBAR = { search: '', sort: null, view: 'all' };

const Looty = () => {
  const { state } = useContext(AppContext);
  const storageFailed = isSectionFailed(state?.account, 'storage');
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
                                              value={formatGame(item?.amount ?? 0, 'Big')}
                                              mark={greenStacks.has(item?.rawName) ? 'data/GreenSymbol.png' : undefined}
                                              markAlt={'Greenstacked'}
                                              details={<ItemDisplay {...item} showAmount/>}/>;
  const groups = view.view === 'type' ? Object.entries(groupByKey(sorted, ({ Type }) => Type)) : [];

  return (
    <>
      <NextSeo
        title="Storage | Idleon Toolbox"
        description="Browse your full storage inventory with item counts, chest slots, and capacity in Legends of Idleon"
      />
      {storageFailed ? <MissingData name={'Storage'} failed/> : null}
      <PageSummary>
        <StatTile label={'Storage money'} value={moneyValue(bankMoney)} sub={exactCoins(bankMoney)}/>
        <StatTile label={'Total money'} value={moneyValue(rawMoney)} sub={exactCoins(rawMoney)}
                  info={'Your storage and every character\'s coins together.'}/>
      </PageSummary>
      <Tabber tabs={getTabs(PAGES.ACCOUNT.misc.categories, 'storage')}>
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
          <CardWithBreakdown title={'Slots Owned'} value={`${state?.account?.storage?.slots?.value}`}
                             icon={'data/InvStorage1.png'}
                             breakdown={state?.account?.storage?.slots?.breakdown}
                             skipNotation/>
          <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
            {state?.account?.storage?.storageChests?.map(({
                                                            rawName,
                                                            displayName,
                                                            amount,
                                                            capacity,
                                                            unlocked
                                                          }, index) => {
              return <Card key={rawName} sx={{ width: 200, opacity: unlocked ? 1 : .5, cursor: 'pointer' }}
                           onClick={() => window.open(`https://idleon.wiki/wiki/${displayName}`, '_blank')}>
                <CardContent>
                  <Typography>{(cleanUnderscore(displayName)).toLowerCase().capitalize()}</Typography>
                  <Stack direction={'row'} flexWrap={'wrap'} gap={1} data-index={index} alignItems={'center'}>
                    <Image loading="lazy" data-index={index} width={30} height={30} style={{ objectFit: 'contain' }}
                           src={`${prefix}data/${rawName}.png`} alt={rawName}/>
                    <Typography>+{amount || capacity}</Typography>
                  </Stack>
                </CardContent>
              </Card>
            })}
          </Stack>
        </Stack>
      </Tabber>
    </>
  );
};

export default Looty;
