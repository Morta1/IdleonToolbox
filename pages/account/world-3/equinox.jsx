import React, { useContext } from 'react';
import { AppContext } from '../../../components/common/context/AppProvider';
import Timer from '../../../components/common/Timer';
import { getTabs } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { NextSeo } from 'next-seo';
import { PAGES } from '@components/constants';
import Tabber from '@components/common/Tabber';
import Upgrades from '@components/account/Worlds/World3/Equinox/Upgrades';
import Challenges from '@components/account/Worlds/World3/Equinox/Challenges';
import { MissingData, isSectionFailed } from '@components/common/styles';
import Notice from '@components/common/Notice';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import StatusText from '@components/common/StatusText';

const Equinox = () => {
  const { state } = useContext(AppContext);
  const equinox = state?.account?.equinox;
  const sectionFailed = isSectionFailed(state?.account, 'equinox');
  const fillText = `${formatGame(equinox?.chargeRate ?? 0, 'Dreamstuff.BarFillRate')}/hr`;
  const bar = (value) => formatGame(value ?? 0, 'Dreamstuff.BarFillReq');
  return (
    <>
      <NextSeo
        title="Equinox | Idleon Toolbox"
        description="Track your Equinox upgrades, dream bonuses, and unlockable perks for all your Legends of Idleon characters"
      />
      {sectionFailed ? <MissingData name={'Equinox'} failed/> : !equinox?.unlocked
        ? <Notice tone={'locked'} sx={{ mb: 2 }}>Equinox isn&apos;t unlocked in this save yet: its upgrades and challenges show at zero.</Notice>
        : null}
      {equinox?.unlocked && !sectionFailed ? <PageSummary>
        <StatTile label={'Fill rate'} value={fillText} breakdownTitle={'Fill rate'}
                  breakdown={equinox?.breakdown ? { ...equinox.breakdown, totalValue: fillText } : undefined}/>
        <StatTile label={'Equinox bar'} value={`${bar(equinox?.currentCharge)} / ${bar(equinox?.chargeRequired)}`}/>
        <StatTile label={'Time to full'} value={<Timer type={'countdown'} placeholder={<StatusText status={'ready'}/>} date={equinox?.timeToFull}
                                                       lastUpdated={state?.lastUpdated}/>}/>
      </PageSummary> : null}
      <Tabber tabs={getTabs(PAGES.ACCOUNT['world 3'].categories, 'Equinox')}>
        <Upgrades upgrades={equinox?.upgrades} sectionFailed={sectionFailed}/>
        <Challenges challenges={equinox?.challenges} sectionFailed={sectionFailed}/>
      </Tabber>
    </>
  );
};

export default Equinox;
