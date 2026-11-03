import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { MissingData, isSectionFailed } from '@components/common/styles';
import { getTabs } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import Num from '@components/common/Num';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import Tabber from '@components/common/Tabber';
import { PAGES } from '@components/constants';
import ReefUpgrades from '@components/account/Worlds/World7/CoralReef/ReefUpgrades';
import DancingCoral from '@components/account/Worlds/World7/CoralReef/DancingCoral';

const CoralReef = () => {
  const { state } = useContext(AppContext);
  const section = state?.account?.coralReef;
  const sectionFailed = isSectionFailed(state?.account, 'coralReef');
  const { dancingCoral, reefUpgrades, reefDayGains, ownedCorals } = section ?? {};
  // The parser's total is a MultiplierInfo string; the drawer reads the tile's own number
  const reefGainsText = formatGame(reefDayGains?.value ?? 0, 'Thingies.ReefDayGains');

  return <>
    <NextSeo
      title="Coral Reef | Idleon Toolbox"
      description="Keep track of your coral reef upgrades, coral kid upgrades, and dancing coral"
    />
    {!section || sectionFailed ? <MissingData name={'Coral Reef'} failed={sectionFailed}/> : null}
    <PageSummary>
      {/* The game prints every reef cost in Big (Decision 13), so the balance beside them does too */}
      <StatTile label={'Coral'} icon={'data/Coral0.png'} value={<Num value={ownedCorals ?? 0} game={'Big'}/>}/>
      <StatTile label={'Reef day gains'} icon={'data/Coral0.png'} value={reefGainsText}
                breakdown={reefDayGains?.breakdown ? { ...reefDayGains.breakdown, totalValue: reefGainsText } : undefined}
                breakdownTitle={'Reef day gains'}/>
    </PageSummary>
    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 7'].categories, 'coralReef')}>
      <ReefUpgrades reefUpgrades={reefUpgrades} ownedCorals={ownedCorals ?? 0}/>
      <DancingCoral dancingCoral={dancingCoral} ownedCorals={ownedCorals ?? 0}/>
    </Tabber>
  </>;
};

export default CoralReef;
