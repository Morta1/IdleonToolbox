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
import PageSettings, { usePageSettings } from '@components/common/PageSettings';
import { DOUBLER_ICONS, DoublerUsageCard } from '@components/account/Worlds/World7/Menagerie/menagerie.utils';
import useTabIndex from '@hooks/useTabIndex';
import { UPGRADES_AHEAD_SETTINGS, UpgradesAheadSettings } from '@components/common/LevelsAhead';

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
  const [settings, setSettings, resetSettings] = usePageSettings('jelly-operator', UPGRADES_AHEAD_SETTINGS);
  // A guest has nothing to reach yet, and a failed section says nothing about where the account is
  const locked = !unlocked && !state?.emptyAccount && !sectionFailed;

  const nextObstruction = obstructions?.find(({ index, defeated }) => !defeated && index < (maxObstructionsDefeated ?? Infinity));
  return <SummaryFailed value={sectionFailed}>
    <NextSeo
      title="Jelly Operator | Idleon Toolbox"
      description="Track your Jelly Operator obstructions, cell upgrades, bloodcells and bonuses in Legends of Idleon World 7 Research"
    />

    {/* Only an upgrade with levels left to buy is priced ahead */}
    {upgrades?.some(({ level, maxLevel }) => maxLevel === null || level < maxLevel)
      ? <PageSettings state={settings} defaults={UPGRADES_AHEAD_SETTINGS} onChange={setSettings} onReset={resetSettings}>
        <UpgradesAheadSettings/>
      </PageSettings> : null}
    {/* Decision 13: the parser knows whether the account has reached it; a guest or a new account sees why it's zero */}
    {sectionFailed ? <MissingData name={'Jelly Operator'} failed atZero={!isParseFailed(state?.account) && tabs[tabIndex] !== 'Upgrade Optimizer'}/> : null}
    {state?.emptyAccount ? <Notice tone={'signin'} sx={{ mb: 2 }}>Your Jelly Operator shows here once you sign in.</Notice> : null}
    {sectionFailed ? null : <NotReached name={'the Jelly Operator'} reached={unlocked}/>}
    <PageSummary failed={sectionFailed}>
      <StatTile label={'Obstructions removed'} icon={'data/JellyOp0.png'}
                value={`${formatNum(obstructionsDefeated ?? 0)} / ${formatNum(maxObstructionsDefeated ?? 0)}`}
                sub={nextObstruction ? `Next: ${nextObstruction.name}, ${formatNum(nextObstruction.hp ?? 0)} HP` : undefined}/>
      <StatTile label={'Operations left'} icon={'etc/JellyOperation.png'} value={operationsLeft ?? 0} kind={'amount'}
                sub={`${formatNum(dailyOperations ?? 2)} a day`}/>
      {/* The game's balance line: commas under 1e9, where the upgrade costs print Big */}
      <StatTile label={'Bloodcells'} icon={'etc/Bloodcell.png'}
                value={<Num value={Math.floor(bloodcells ?? 0)} game={'Save.JellyCurrency'} whole/>}/>
      <StatTile label={'Bloodcell multi'} icon={'etc/Bloodcell.png'} value={<Num value={bloodcellMulti ?? 1} game={'JellyOperation.CurrencyMulti'} unit={'x'}/>}
                breakdown={bloodcellMultiBreakdown} breakdownTitle={'Bloodcell multi'}/>
      <StatTile label={'Cell types unlocked'} icon={'data/JellyUnit0.png'} value={`${formatNum(unitsOwned ?? 0)} / ${formatNum(cells?.length ?? 0)}`}/>
      <StatTile label={'Total cell LV'} value={cellLevelTotal ?? 0} kind={'amount'}/>
      <StatTile label={'Total upgrade LV'} value={upgradeLevelTotal ?? 0} kind={'amount'}/>
      <StatTile label={'Jelly slots'} icon={'data/JellyUpg9.png'} value={slotsOwned ?? 0} kind={'amount'}
                sub={slotPurchasesLeft > 0 ? `+${formatNum(slotPurchasesLeft)} to buy` : undefined}/>
      <DoublerUsageCard title={'Doublers'} doubler={state?.account?.menagerie?.doublers?.jellyOperator}
                        icon={DOUBLER_ICONS.jellyOperator}/>
    </PageSummary>
    <Tabber tabs={tabs}>
      <Layout layout={layout} cells={cells}/>
      <Obstructions obstructions={obstructions} max={maxObstructionsDefeated}/>
      <Upgrades upgrades={upgrades} characters={state?.characters} bloodcells={bloodcells}
                doublersOwned={state?.account?.menagerie?.doublers?.jellyOperator?.owned} levelsAhead={settings?.levelsAhead ?? 1}/>
      <UpgradeOptimizer account={state?.account} characters={state?.characters} sectionFailed={sectionFailed} locked={locked}/>
      <Cells cells={cells}/>
    </Tabber>
  </SummaryFailed>;
};

export default JellyOperator;
