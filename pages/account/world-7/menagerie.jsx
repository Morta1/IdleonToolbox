import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { formatNum, getTabs } from '@utility/helpers';
import Notice from '@components/common/Notice';
import { formatGame } from '@utility/gameNotation';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import Tabber from '@components/common/Tabber';
import { PAGES } from '@components/constants';
import { calcTotalItemOwned } from '@parsers/storage';
import Missions from '@components/account/Worlds/World7/Menagerie/Missions';
import Unlocks from '@components/account/Worlds/World7/Menagerie/Unlocks';
import Boosts, { BOOSTS_SETTINGS, BoostsSettings } from '@components/account/Worlds/World7/Menagerie/Boosts';
import PageSettings, { usePageSettings } from '@components/common/PageSettings';
import Jellies from '@components/account/Worlds/World7/Menagerie/Jellies';
import { formatLumi, LUMI_ICON, SHELL_ICON } from '@components/account/Worlds/World7/Menagerie/menagerie.utils';

// The Yellow Jellyfish builds in the 8th construction slot while no building sits there
const EIGHTH_BUILD_SLOT = 7;

const Menagerie = () => {
  const { state } = useContext(AppContext);
  const menagerie = state?.account?.menagerie;
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

  return <>
    <NextSeo
      title="Luminous Menagerie | Idleon Toolbox"
      description="Track your Luminous Menagerie missions, unlocks, boosts, jellyfish and Lumi gains in Legends of Idleon World 7"
    />
    {/* Only a boost that shows its cost is priced ahead: with none, the setting would change nothing */}
    {boosts?.some(({ visible }) => visible) ? <PageSettings state={settings} defaults={BOOSTS_SETTINGS} onChange={setSettings} onReset={resetSettings}>
      <BoostsSettings/>
    </PageSettings> : null}
    {!unlocked ? <Notice tone={'locked'} sx={{ mb: 2 }}>
      Your account hasn't reached the Luminous Menagerie yet. It's in the Molten Edge map in World 7.
    </Notice> : null}
    <PageSummary>
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
      <Unlocks unlocks={unlocks} menagerie={menagerie}/>
      <Boosts account={state?.account} boosts={boosts} doublers={menagerie?.doublers} lumi={lumi}
              levelsAhead={settings?.levelsAhead ?? 1}/>
      <Jellies jellies={menagerie?.jellies}
               ladlesOwned={calcTotalItemOwned(state?.account?.storage, state?.characters, 'Ladle')}
               buildSlotOpen={!state?.account?.towers?.data?.some(({ slot }) => slot === EIGHTH_BUILD_SLOT)}/>
    </Tabber>
  </>;
};

export default Menagerie;
