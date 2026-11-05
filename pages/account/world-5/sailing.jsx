import React, { useContext } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import Artifacts from '@components/account/Worlds/World5/Sailing/Artifacts';
import LootPile from '@components/account/Worlds/World5/Sailing/LootPile';
import { formatNum, getTabs } from '@utility/helpers';
import Chests from '@components/account/Worlds/World5/Sailing/Chests';
import BoatsAndCaptains from '@components/account/Worlds/World5/Sailing/BoatsAndCaptains';
import { MissingData, isSectionFailed } from '@components/common/styles';
import { NextSeo } from 'next-seo';
import Trades from '@components/account/Worlds/World5/Sailing/Trades';
import Tabber from '../../../components/common/Tabber';
import { PAGES } from '@components/constants';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import Notice from '@components/common/Notice';

const Sailing = () => {
  const { state } = useContext(AppContext);
  const sailing = state?.account?.sailing ?? {};
  const sectionFailed = isSectionFailed(state?.account, 'sailing');

  return <>
    <NextSeo
      title="Sailing | Idleon Toolbox"
      description="Keep track of your artiacts, boats and captains and their bonuses"
    />
    {sectionFailed ? <MissingData name={'Sailing'} failed atZero/>
      : sailing?.unlocked === false ? <Notice tone={'locked'} sx={{ mb: 2 }}>Your account hasn&apos;t reached Sailing yet.</Notice> : null}
    <PageSummary failed={sectionFailed}>
      <StatTile label={'Chests'} icon={'npcs/Chesty.png'}
                value={`${formatNum(sailing?.chests?.length ?? 0)} / ${formatNum(sailing?.maxChests ?? 0)}`}/>
      <StatTile label={'Captains'} icon={'npcs/Captain.gif'} value={sailing?.captains?.length ?? 0} kind={'amount'}/>
      <StatTile label={'Boats'} icon={'npcs/Boat.gif'} value={sailing?.boats?.length ?? 0} kind={'amount'}/>
    </PageSummary>
    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 5'].categories, 'sailing')}>
      <Artifacts artifacts={sailing?.artifacts}/>
      <Trades trades={sailing?.trades} hasBoats={(sailing?.boats?.length ?? 0) > 0} sectionFailed={sectionFailed}/>
      <BoatsAndCaptains boats={sailing?.boats} captains={sailing?.captains}
                        lootPile={sailing?.lootPile}
                        minimumTravelTime={sailing?.minimumTravelTime}
                        minimumTravelTimeBreakdown={sailing?.minimumTravelTimeBreakdown}
                        lootMulti={sailing?.lootMulti}
                        captainsOnBoats={sailing?.captainsOnBoats} shopCaptains={sailing?.shopCaptains}
                        lastUpdated={state?.lastUpdated} sectionFailed={sectionFailed}/>
      <LootPile lootPile={sailing?.lootPile}/>
      <Chests chests={sailing?.chests ?? []} sectionFailed={sectionFailed}/>
    </Tabber>
  </>;
};

export default Sailing;
