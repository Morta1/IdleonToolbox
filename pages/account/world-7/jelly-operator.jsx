import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { formatNum, getTabs } from '@utility/helpers';
import Notice from '@components/common/Notice';
import { isParseFailed, isSectionFailed, MissingData, NotReached } from '@components/common/styles';
import Num from '@components/common/Num';
import PageSummary, { SummaryFailed } from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import Tabber from '@components/common/Tabber';
import { PAGES } from '@components/constants';
import Obstructions from '@components/account/Worlds/World7/JellyOperator/Obstructions';
import Upgrades from '@components/account/Worlds/World7/JellyOperator/Upgrades';
import Cells from '@components/account/Worlds/World7/JellyOperator/Cells';
import Layout from '@components/account/Worlds/World7/JellyOperator/Layout';
import UpgradeOptimizer from '@components/account/Worlds/World7/JellyOperator/UpgradeOptimizer';
import { DOUBLER_ICONS, DoublerUsageCard } from '@components/account/Worlds/World7/Menagerie/menagerie.utils';
import useTabIndex from '@hooks/useTabIndex';

const JellyOperator = () => {
  const { state } = useContext(AppContext);
  const tabs = getTabs(PAGES.ACCOUNT['world 7'].categories, 'jellyOperator');
  const [tabIndex] = useTabIndex(tabs);
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
  const sectionFailed = isSectionFailed(state?.account, 'jellyOperator');
  // A guest has nothing to reach yet, and a failed section says nothing about where the account is
  const locked = !unlocked && !state?.emptyAccount && !sectionFailed;

  return <SummaryFailed value={sectionFailed}>
    <NextSeo
      title="Jelly Operator | Idleon Toolbox"
      description="Track your Jelly Operator obstructions, cell upgrades, bloodcells and bonuses in Legends of Idleon World 7 Research"
    />

    {/* Decision 13: the parser knows whether the account has reached it; a guest or a new account sees why it's zero */}
    {sectionFailed ? <MissingData name={'Jelly Operator'} failed atZero={!isParseFailed(state?.account) && tabs[tabIndex] !== 'Upgrade Optimizer'}/> : null}
    {state?.emptyAccount ? <Notice tone={'signin'} sx={{ mb: 2 }}>Your Jelly Operator shows here once you sign in.</Notice> : null}
    {sectionFailed ? null : <NotReached name={'the Jelly Operator'} reached={unlocked}/>}
    <PageSummary failed={sectionFailed}>
      <StatTile label={'Obstructions removed'}
                value={`${formatNum(obstructionsDefeated ?? 0)} / ${formatNum(maxObstructionsDefeated ?? 0)}`}/>
      <StatTile label={'Operations left'} value={operationsLeft ?? 0} kind={'amount'}
                sub={`${formatNum(dailyOperations ?? 2)} a day`}/>
      {/* The costs' rule, so the balance and every upgrade cost read alike */}
      <StatTile label={'Bloodcells'} icon={'etc/Bloodcell.png'}
                value={<Num value={Math.floor(bloodcells ?? 0)} game={'JellyOperation.UpgCost'} whole/>}/>
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
    <Tabber tabs={tabs}>
      <Layout layout={layout} cells={cells}/>
      <Obstructions obstructions={obstructions}/>
      <Upgrades upgrades={upgrades} characters={state?.characters} bloodcells={bloodcells}
                doublersOwned={state?.account?.menagerie?.doublers?.jellyOperator?.owned}/>
      <UpgradeOptimizer account={state?.account} characters={state?.characters} sectionFailed={sectionFailed} locked={locked}/>
      <Cells cells={cells}/>
    </Tabber>
  </SummaryFailed>;
};

export default JellyOperator;
