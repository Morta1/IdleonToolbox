import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { formatNum, getTabs } from '@utility/helpers';
import { MissingData, NotReached, isParseFailed, isSectionFailed } from '@components/common/styles';
import { formatGame } from '@utility/gameNotation';
import PageSummary, { SummaryFailed } from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import Tabber from '@components/common/Tabber';
import { PAGES } from '@components/constants';
import { calcTotalItemOwned } from '@parsers/storage';
import { getYellowJellyBuild } from '@parsers/world-3/construction';
import Missions from '@components/account/Worlds/World7/Menagerie/Missions';
import Unlocks from '@components/account/Worlds/World7/Menagerie/Unlocks';
import Boosts, { BOOSTS_SETTINGS, BoostsSettings } from '@components/account/Worlds/World7/Menagerie/Boosts';
import PageSettings, { usePageSettings } from '@components/common/PageSettings';
import Jellies from '@components/account/Worlds/World7/Menagerie/Jellies';
import { formatLumi, LUMI_ICON, SHELL_ICON } from '@components/account/Worlds/World7/Menagerie/menagerie.utils';

const Menagerie = () => {
  const { state } = useContext(AppContext);
  const menagerie = state?.account?.menagerie;
  const sectionFailed = isSectionFailed(state?.account, 'menagerie');
  const parseFailed = isParseFailed(state?.account);
  const {
    unlocked,
    rank,
    shells,
    shellReq,
    lumi,
    lumiRate,
    lumiRateBreakdown,
    missions,
    unlocks,
    boosts
  } = menagerie || {};
  // The Boosts tab's setting (not remembered before it moved here)
  const [settings, setSettings, resetSettings] = usePageSettings('menagerie', BOOSTS_SETTINGS);
  const unlocksOwned = unlocks?.filter(({ owned }) => owned)?.length ?? 0;
  const boostLevels = boosts?.reduce((sum, { level }) => sum + (level ?? 0), 0) ?? 0;
  const claimableMissions = unlocked ? missions?.filter(({ canClaim, visible }) => canClaim && visible)?.length ?? 0 : 0;
  // Lumi per hour is an amount the game prints in Big; its tree is all multipliers, so the drawer takes the tile's text
  const lumiRateText = formatGame(lumiRate ?? 0, 'MenagerieStuff.LumiGainRate');
  const lumiRateDrawer = lumiRateBreakdown ? { ...lumiRateBreakdown, totalValue: lumiRateText } : undefined;

  return <SummaryFailed value={sectionFailed}>
    <NextSeo
      title="Luminous Menagerie | Idleon Toolbox"
      description="Track your Luminous Menagerie missions, unlocks, boosts, jellyfish and Lumi gains in Legends of Idleon World 7"
    />
    {/* Only a boost that shows its cost is priced ahead: with none, the setting would change nothing */}
    {boosts?.some(({ visible }) => visible) ? <PageSettings state={settings} defaults={BOOSTS_SETTINGS} onChange={setSettings} onReset={resetSettings}>
      <BoostsSettings/>
    </PageSettings> : null}
    {sectionFailed ? <MissingData name={'the Luminous Menagerie'} failed atZero={!parseFailed}/>
      : <NotReached name={'the Luminous Menagerie'} reached={unlocked}>It&apos;s in the Molten Edge map in World 7.</NotReached>}
    <PageSummary failed={sectionFailed}>
      <StatTile label={'Menagerie rank'} value={rank ?? 0} kind={'amount'}/>
      <StatTile label={'Shells'} icon={SHELL_ICON} value={`${formatNum(shells ?? 0)} / ${formatNum(shellReq ?? 0)}`}/>
      {/* Decision 9: Lumi in the game's cost rule, as every cost card reads it */}
      <StatTile label={'Lumi'} icon={LUMI_ICON} value={formatLumi(lumi)}/>
      <StatTile label={'Lumi per hour'} value={lumiRateText} breakdown={lumiRateDrawer}/>
      <StatTile label={'Claimable missions'} value={claimableMissions} kind={'amount'}/>
      <StatTile label={'Unlocks owned'} value={`${formatNum(unlocksOwned)} / ${formatNum(unlocks?.length ?? 0)}`}/>
      <StatTile label={'Total boost LV'} value={boostLevels} kind={'amount'}/>
    </PageSummary>
    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 7'].categories, 'menagerie')}>
      <Missions missions={missions} unlocked={unlocked}/>
      {parseFailed ? null : <Unlocks unlocks={unlocks} menagerie={menagerie}/>}
      <Boosts account={state?.account} boosts={boosts} doublers={menagerie?.doublers} lumi={lumi}
              levelsAhead={settings?.levelsAhead ?? 1}/>
      <Jellies jellies={menagerie?.jellies}
               ladlesOwned={calcTotalItemOwned(state?.account?.storage, state?.characters, 'Ladle')}
               yellowBuild={getYellowJellyBuild(state?.account)}
               lastUpdated={state?.lastUpdated}/>
    </Tabber>
  </SummaryFailed>;
};

export default Menagerie;
