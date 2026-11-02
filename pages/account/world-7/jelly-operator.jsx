import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { formatNum, getTabs } from '@utility/helpers';
import Notice from '@components/common/Notice';
import Num from '@components/common/Num';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import Tabber from '@components/common/Tabber';
import { PAGES } from '@components/constants';
import Obstructions from '@components/account/Worlds/World7/JellyOperator/Obstructions';
import Upgrades from '@components/account/Worlds/World7/JellyOperator/Upgrades';
import Cells from '@components/account/Worlds/World7/JellyOperator/Cells';
import Layout from '@components/account/Worlds/World7/JellyOperator/Layout';
import UpgradeOptimizer from '@components/account/Worlds/World7/JellyOperator/UpgradeOptimizer';
import { DOUBLER_ICONS, DoublerUsageCard } from '@components/account/Worlds/World7/Menagerie/menagerie.utils';

const JellyOperator = () => {
  const { state } = useContext(AppContext);
  const {
    unlocked,
    obstructionsDefeated,
    maxObstructionsDefeated,
    operationsLeft,
    dailyOperations,
    bloodcells,
    bloodcellMulti,
    bloodcellMultiBreakdown,
    slotsOwned,
    slotPurchasesLeft,
    unitsOwned,
    cellLevelTotal,
    upgradeLevelTotal,
    obstructions,
    upgrades,
    cells,
    layout
  } = state?.account?.jellyOperator || {};

  return <>
    <NextSeo
      title="Jelly Operator | Idleon Toolbox"
      description="Track your Jelly Operator obstructions, cell upgrades, bloodcells and bonuses in Legends of Idleon World 7 Research"
    />

    {/* Decision 13: the parser knows whether the account has reached it; a guest or a new account sees why it's zero */}
    {unlocked ? null : <Notice tone={'locked'} sx={{ mb: 2 }}>Your account hasn&apos;t reached the Jelly Operator yet.</Notice>}
    <PageSummary>
      <StatTile label={'Obstructions removed'}
                value={`${formatNum(obstructionsDefeated ?? 0)} / ${formatNum(maxObstructionsDefeated ?? 0)}`}/>
      <StatTile label={'Operations left'} value={operationsLeft ?? 0} kind={'amount'}
                sub={`${formatNum(dailyOperations ?? 2)} a day`}/>
      {/* The costs' rule, so the balance and every upgrade cost read alike */}
      <StatTile label={'Bloodcells'} icon={'etc/Bloodcell.png'}
                value={<Num value={Math.floor(bloodcells ?? 0)} game={'JellyOperation.UpgCost'}/>}/>
      <StatTile label={'Bloodcell multi'} value={<Num value={bloodcellMulti ?? 1} game={'JellyOperation.CurrencyMulti'} unit={'x'}/>}
                breakdown={bloodcellMultiBreakdown} breakdownTitle={'Bloodcell multi'}/>
      <StatTile label={'Cell types unlocked'} value={`${formatNum(unitsOwned ?? 0)} / ${formatNum(cells?.length ?? 0)}`}/>
      <StatTile label={'Total cell LV'} value={cellLevelTotal ?? 0} kind={'amount'}/>
      <StatTile label={'Total upgrade LV'} value={upgradeLevelTotal ?? 0} kind={'amount'}/>
      <StatTile label={'Jelly slots'} value={slotsOwned ?? 0} kind={'amount'}
                sub={slotPurchasesLeft > 0 ? `+${formatNum(slotPurchasesLeft)} to buy` : undefined}/>
      <DoublerUsageCard title={'Doublers'} doubler={state?.account?.menagerie?.doublers?.jellyOperator}
                        icon={DOUBLER_ICONS.jellyOperator}/>
    </PageSummary>
    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 7'].categories, 'jellyOperator')}>
      <Layout layout={layout} cells={cells}/>
      <Obstructions obstructions={obstructions}/>
      <Upgrades upgrades={upgrades} characters={state?.characters} bloodcells={bloodcells}
                doublersOwned={state?.account?.menagerie?.doublers?.jellyOperator?.owned}/>
      <UpgradeOptimizer account={state?.account} characters={state?.characters}/>
      <Cells cells={cells}/>
    </Tabber>
  </>;
};

export default JellyOperator;
