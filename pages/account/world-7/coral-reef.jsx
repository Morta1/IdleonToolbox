import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { MissingData, NotReached, isParseFailed, isSectionFailed } from '@components/common/styles';
import { getTabs } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { calcTotalItemOwned } from '@parsers/storage';
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
  // Each dance's balance: the reef's own coral for the first, the coral item owned for the others
  const coralBalances = dancingCoral?.map((_, index) => (index === 0
    ? ownedCorals ?? 0
    : calcTotalItemOwned(state?.account?.storage, state?.characters, `Coral${index}`)));
  // The parser's total is a MultiplierInfo string; the drawer reads the tile's own number
  const reefGainsText = formatGame(reefDayGains?.value ?? 0, 'Thingies.ReefDayGains');

  return <>
    <NextSeo
      title="Coral Reef | Idleon Toolbox"
      description="Keep track of your coral reef upgrades, coral kid upgrades, and dancing coral"
    />
    {!section || sectionFailed ? <MissingData name={'Coral Reef'} failed={sectionFailed} atZero={!isParseFailed(state?.account)}/>
      : <NotReached name={'the Coral Reef'} reached={ownedCorals > 0 || reefUpgrades?.some(({ level }) => level > 0)}/>}
    <PageSummary failed={sectionFailed}>
      {/* The game prints every reef cost in Big (Decision 13), so the balance beside them does too */}
      <StatTile label={'Coral'} icon={'data/Coral0.png'} value={<Num value={ownedCorals ?? 0} game={'Big'} whole/>}/>
      <StatTile label={'Reef day gains'} icon={'data/Coral0.png'} value={reefGainsText}
                breakdown={reefDayGains?.breakdown ? { ...reefDayGains.breakdown, totalValue: reefGainsText } : undefined}
                breakdownTitle={'Reef day gains'}/>
    </PageSummary>
    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 7'].categories, 'coralReef')}>
      <ReefUpgrades reefUpgrades={reefUpgrades} ownedCorals={ownedCorals ?? 0}/>
      <DancingCoral dancingCoral={dancingCoral} balances={coralBalances}/>
    </Tabber>
  </>;
};

export default CoralReef;
