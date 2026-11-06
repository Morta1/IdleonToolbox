import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { cleanUnderscore, formatNum, titleCaseName } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { MissingData, NotReached, isParseFailed, isSectionFailed } from '@components/common/styles';
import { getAllItems } from '@parsers/items';
import { createBreakdown, flatLines } from '@parsers/breakdown';
import Num from '@components/common/Num';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

const CLUSTER_ICON = 'etc/Cluster.png';

const ZenithMarket = () => {
  const { state } = useContext(AppContext);
  const { characters, account } = state || {};
  const section = account?.zenith;
  const sectionFailed = isSectionFailed(account, 'statues');
  const { market, clusters } = section ?? {};

  // The clusters still sitting in storage and the inventories (the balance is the account's, OPT.zenithClusters).
  // Storage is the account's chest, named like a place; characters keep their own spelling.
  const clusterInventoryData = characters && account
    ? getAllItems(characters, account)
      .filter((item) => item?.rawName === 'Quest110')
      .map((item) => ({ owner: item?.owner === 'storage' ? 'Storage' : item?.owner, amount: item?.amount || 0 }))
      .filter((item) => item.amount > 0)
    : [];
  const totalInventoryClusters = clusterInventoryData.reduce((sum, item) => sum + (item.amount || 0), 0);
  const inventoryBreakdown = clusterInventoryData.length
    ? createBreakdown('Clusters in inventories', formatNum(totalInventoryClusters, 'whole'),
      flatLines(clusterInventoryData.map(({ owner, amount }) => ({ name: owner, value: amount, formatted: formatNum(amount, 'whole') }))),
      { combine: 'list' })
    : undefined;

  return <>
    <NextSeo
      title="Zenith Market | Idleon Toolbox"
      description="Keep track of your zenith market upgrades and bonuses"
    />
    {!section || sectionFailed ? <MissingData name={'Zenith Market'} failed={sectionFailed} atZero={!isParseFailed(account)}/>
      : <NotReached name={'the Zenith Market'} reached={clusters > 0 || market?.some(({ level }) => level > 0)}/>}
    <PageSummary failed={sectionFailed}>
      {/* The market's own print, so the balance reads as its costs do */}
      <StatTile label={'Zenith clusters'} icon={CLUSTER_ICON}
                value={<Num value={clusters ?? 0} game={'Thingies.ZenithMarketCost'} whole/>}/>
      <StatTile label={'Clusters in inventories'} value={totalInventoryClusters} kind={'whole'} failed={false}
                breakdown={inventoryBreakdown} breakdownTitle={'Clusters in inventories'}/>
      <StatTile label={'Total upgrade LV'} value={account?.spelunking?.saveTotals?.zenithMarketUpgradeLevels ?? 0}
                kind={'amount'} failed={false}/>
    </PageSummary>
    <CardGrid size={'m'}>
      {market?.map((item, index) => {
        const maxed = item?.x3 > 0 && (item?.level ?? 0) >= item.x3;
        return <ItemCard key={item?.name || index} title={titleCaseName(cleanUnderscore(item?.name))}
                         level={{ value: item?.level ?? 0, max: item?.x3 || null }}
                         status={maxed ? 'maxed' : undefined}
                         dimmed={!(item?.level > 0)}
                         footer={<ItemCard.Cost icon={CLUSTER_ICON} iconAlt={'Zenith Clusters'} need={item?.cost ?? 0}
                                                have={clusters ?? 0} game={'Thingies.ZenithMarketCost'}/>}>
          {item?.description ? <ItemCard.Desc text={item.description}/> : null}
          {item?.costToMax > 0
            ? <ItemCard.Facts rows={[['Cost to max', formatGame(item.costToMax, 'Thingies.ZenithMarketCost', { whole: true })]]}/>
            : null}
        </ItemCard>;
      })}
    </CardGrid>
  </>;
};

export default ZenithMarket;
