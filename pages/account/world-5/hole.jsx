import Tabber from '@components/common/Tabber';
import Explore from '@components/account/Worlds/World5/Hole/Explore';
import Engineer from '@components/account/Worlds/World5/Hole/Engineer';
import Bonuses from '@components/account/Worlds/World5/Hole/Bonuses';
import Measure from '@components/account/Worlds/World5/Hole/Measure';
import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { PAGES } from '@components/constants';
import { formatNum, getTabs } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { NextSeo } from 'next-seo';
import Study from '@components/account/Worlds/World5/Hole/Study';
import PageSummary, { SummaryFailed } from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import Notice from '@components/common/Notice';
import { MissingData, isSectionFailed } from '@components/common/styles';
import { getHoleLeaderboardTotals } from '@parsers/world-5/hole';

const CAVERN_COUNT = getTabs(PAGES.ACCOUNT['world 5'].categories, 'hole', 'Explore').length;

const Hole = () => {
  const { state } = useContext(AppContext);
  const hole = state?.account?.hole;
  const sectionFailed = isSectionFailed(state?.account, 'hole');
  // The Explore villager is level 1 once the Hole opens: a save with the Hole's data and every villager at 0 has not
  // reached it (the fresh fixture)
  const reached = (hole?.villagers?.[0]?.level ?? 0) >= 1;
  const totals = getHoleLeaderboardTotals(hole);
  const afk = hole?.caverns?.bravery?.afkPercent;
  // The tile and its drawer read one text: the parser heads the drawer in MultiplierInfo
  const afkText = formatNum(afk?.effectiveValue ?? 0, 'pct');

  return <SummaryFailed value={sectionFailed}>
    <NextSeo
      title="Hole | Idleon Toolbox"
      description="Keep track of your hole progress, exp, upgrades, bonuses, schemas and more"
    />
    {sectionFailed ? <MissingData name={'the Hole'} failed/>
      : reached ? null : <Notice tone={'locked'} sx={{ mb: 2 }}>Your account hasn&apos;t reached the Hole yet.</Notice>}
    <PageSummary failed={sectionFailed}>
      <StatTile label={'Unlocked caverns'} value={`${formatNum(hole?.unlockedCaverns ?? 0)} / ${formatNum(CAVERN_COUNT)}`}/>
      <StatTile label={'Total opals invested'} icon={'data/Opal.png'} value={totals?.opalsInvested ?? 0} kind={'amount'}/>
      <StatTile label={'Total villager EXP rate'}
                value={`${formatGame(totals?.villagerExpPerHour ?? 0, 'Holes.VillagerExpPerHour')}/hr`}/>
      <StatTile label={'Total layers destroyed'} value={totals?.layersDestroyed ?? 0} kind={'amount'}/>
      <StatTile label={'Monument AFK gain'} value={afkText} breakdownTitle={'Monument AFK gain'}
                breakdown={afk?.breakdown ? { ...afk.breakdown, totalValue: afkText } : undefined}/>
    </PageSummary>
    <Tabber
      clearOnChange={['nt', 'dnt']}
      tabs={getTabs(PAGES.ACCOUNT['world 5'].categories, 'hole')}
      icons={['etc/Villager_0','etc/Villager_1', 'etc/Villager_2', 'etc/Villager_3', 'etc/Villager_4']}
    >
      <Explore hole={hole} sectionFailed={sectionFailed}/>
      <Engineer hole={hole} sectionFailed={sectionFailed}/>
      <Bonuses hole={hole}/>
      <Measure hole={hole}/>
      <Study account={state?.account} sectionFailed={sectionFailed}/>
    </Tabber>
  </SummaryFailed>;
};

export default Hole;
