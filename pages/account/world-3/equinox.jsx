import React, { useContext } from 'react';
import { AppContext } from '../../../components/common/context/AppProvider';
import Timer from '../../../components/common/Timer';
import { formatDuration, formatNum, getTabs } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import { NextSeo } from 'next-seo';
import { PAGES } from '@components/constants';
import Tabber from '@components/common/Tabber';
import Upgrades from '@components/account/Worlds/World3/Equinox/Upgrades';
import Challenges from '@components/account/Worlds/World3/Equinox/Challenges';
import { MissingData, isParseFailed, isSectionFailed } from '@components/common/styles';
import Notice from '@components/common/Notice';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import StatusText from '@components/common/StatusText';
import PageSettings, { usePageSettings } from '@components/common/PageSettings';
import { LevelsAheadSetting } from '@components/common/LevelsAhead';
import { getEquinoxBarFillReq } from '@parsers/world-3/equinox';

const BAR_SETTINGS = { levelsAhead: null };

const Equinox = () => {
  const { state } = useContext(AppContext);
  const equinox = state?.account?.equinox;
  const sectionFailed = isSectionFailed(state?.account, 'equinox');
  const fillText = `${formatGame(equinox?.chargeRate ?? 0, 'Dreamstuff.BarFillRate')}/hr`;
  const bar = (value) => formatGame(value ?? 0, 'Dreamstuff.BarFillReq', { whole: true });
  const [settings, setSettings, resetSettings] = usePageSettings('equinox', BAR_SETTINGS);
  const levelsAhead = Math.max(1, settings?.levelsAhead ?? 1);
  // Every upgrade level raises the next bar: this many levels from now, the bar needs this much, filled from empty
  const futureLevels = (equinox?.totalUpgradeLevels ?? 0) + levelsAhead;
  const futureRequired = getEquinoxBarFillReq(futureLevels);
  const futureFill = equinox?.chargeRate > 0 ? formatDuration(3600 * futureRequired / equinox.chargeRate) : null;
  return (
    <>
      <NextSeo
        title="Equinox | Idleon Toolbox"
        description="Track your Equinox upgrades, dream bonuses, and unlockable perks for all your Legends of Idleon characters"
      />
      {equinox?.unlocked && !sectionFailed ? <PageSettings state={settings} defaults={BAR_SETTINGS} onChange={setSettings} onReset={resetSettings}>
        <PageSettings.Group title={'Equinox bar'}>
          <LevelsAheadSetting help={'Also shows the bar the Equinox asks for after this many more upgrade levels, and how long it takes to fill from empty.'}/>
        </PageSettings.Group>
      </PageSettings> : null}
      {sectionFailed ? <MissingData name={'Equinox'} failed atZero={!isParseFailed(state?.account)}/> : !equinox?.unlocked
        ? <Notice tone={'locked'} sx={{ mb: 2 }}>Equinox isn&apos;t unlocked in this save yet: its upgrades and challenges show at zero.</Notice>
        : null}
      {equinox?.unlocked && !sectionFailed ? <PageSummary>
        <StatTile label={'Fill rate'} value={fillText} breakdownTitle={'Fill rate'}
                  breakdown={equinox?.breakdown ? { ...equinox.breakdown, totalValue: fillText } : undefined}/>
        <StatTile label={'Equinox bar'} value={`${bar(equinox?.currentCharge)} / ${bar(equinox?.chargeRequired)}`}/>
        <StatTile label={'Time to full'} value={<Timer type={'countdown'} placeholder={<StatusText status={'ready'}/>} date={equinox?.timeToFull}
                                                       lastUpdated={state?.lastUpdated}/>}/>
        {levelsAhead > 1 ? <StatTile label={`Bar at upgrade LV ${formatNum(futureLevels)}`} value={bar(futureRequired)}
                                     sub={futureFill ? `fills in ${futureFill}` : undefined}/> : null}
      </PageSummary> : null}
      <Tabber tabs={getTabs(PAGES.ACCOUNT['world 3'].categories, 'Equinox')}>
        <Upgrades upgrades={equinox?.upgrades} challenges={equinox?.challenges} sectionFailed={sectionFailed}/>
        <Challenges challenges={equinox?.challenges} sectionFailed={sectionFailed}/>
      </Tabber>
    </>
  );
};

export default Equinox;
