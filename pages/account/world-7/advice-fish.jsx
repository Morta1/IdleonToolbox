import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { MissingData, NotReached, isParseFailed, isSectionFailed } from '@components/common/styles';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import Upgrades from '@components/account/Worlds/World7/AdviceFish/Upgrades';

const AdviceFish = () => {
  const { state } = useContext(AppContext);
  const section = state?.account?.adviceFish;
  const sectionFailed = isSectionFailed(state?.account, 'adviceFish');
  const { upgrades } = section ?? {};

  return <>
    <NextSeo
      title="Advice Fish | Idleon Toolbox"
      description="Track your Advice Fish upgrade levels, bonuses, and unlock progression in Legends of Idleon World 7"
    />
    {!section || sectionFailed ? <MissingData name={'Advice Fish'} failed={sectionFailed} atZero={!isParseFailed(state?.account)}/>
      : <NotReached name={'Advice Fish'} reached={upgrades?.some(({ level }) => level > 0)}/>}
    <PageSummary failed={sectionFailed}>
      <StatTile label={'Total upgrade LV'} value={state?.account?.spelunking?.saveTotals?.adviceFishUpgradeLevels ?? 0}
                kind={'amount'} failed={false}/>
    </PageSummary>
    <Upgrades upgrades={upgrades}/>
  </>;
};

export default AdviceFish;
