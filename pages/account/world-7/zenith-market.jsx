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

  // Clusters in inventories are not spent until they are brought to the Zenelith: how many next levels the balance and
  // them pay for together, cheapest first
  const nextCosts = (market ?? []).filter((item) => !(item?.x3 > 0 && (item?.level ?? 0) >= item.x3))
    .map((item) => item?.cost ?? 0).sort((a, b) => a - b);
  let budget = (clusters ?? 0) + totalInventoryClusters;
  let coveredCount = 0;
  for (const cost of nextCosts) {
    if (cost > budget) break;
    budget -= cost;
    coveredCount += 1;
  }
  return <>
    <NextSeo
      title="Zenith Market | Idleon Toolbox"
      description="Keep track of your zenith market upgrades and bonuses"
    />
    {!section || sectionFailed ? <MissingData name={'Zenith Market'} failed={sectionFailed} atZero={!isParseFailed(account)}/>
      : <NotReached name={'the Zenith Market'} reached={clusters > 0 || market?.some(({ level }) => level > 0)}/>}
    <PageSummary failed={sectionFailed}>
      {/* The market's own balance line, in commas with its scales */}
      <StatTile label={'Zenith clusters'} icon={CLUSTER_ICON}
                value={<Num value={clusters ?? 0} game={'Save.ZenithClusters'} whole/>}/>
      <StatTile label={'Clusters in inventories'} value={totalInventoryClusters} kind={'whole'} failed={false}
                breakdown={inventoryBreakdown} breakdownTitle={'Clusters in inventories'}
                sub={totalInventoryClusters > 0 && coveredCount ? `With your balance: ${formatNum(coveredCount)} upgrade${coveredCount > 1 ? 's' : ''}` : undefined}
                info={'Clusters count toward your balance once you bring them to the Zenelith in World 7. The count is how many next levels they and your balance pay for together, cheapest first.'}/>
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
          <ItemCard.Facts rows={[
            item?.nextLevelValue ? ['Next level', item.nextLevelValue] : null,
            item?.costToMax > 0 ? ['Cost to max', formatGame(item.costToMax, 'Thingies.ZenithMarketCost', { whole: true })] : null
          ]}/>
        </ItemCard>;
      })}
    </CardGrid>
  </>;
};

export default ZenithMarket;
