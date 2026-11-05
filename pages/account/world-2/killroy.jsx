import { NextSeo } from 'next-seo';
import { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { MissingData, isSectionFailed } from '@components/common/styles';
import { formatNum, getTabs } from '@utility/helpers';
import { getKillRoy, getKillroySchedule } from '@parsers/misc';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import Tabber from '@components/common/Tabber';
import Monsters from '@components/account/Worlds/World2/Killroy/Monsters';
import Schedule from '@components/account/Worlds/World2/Killroy/Schedule';
import Upgrades from '@components/account/Worlds/World2/Killroy/Upgrades';
import PermanentUpgrades from '@components/account/Worlds/World2/Killroy/PermanentUpgrades';
import { PAGES } from '@components/constants';

const Killroy = () => {
  const { state } = useContext(AppContext);
  const killroyFailed = isSectionFailed(state?.account, 'killroy');
  // A failed section's {} default: the upgrades, the shop and the monsters at zero, the parser's own with no save
  const killroy = (killroyFailed ? getKillRoy({}, [], {}, {}) : state?.account?.killroy) ?? {};
  const schedule = getKillroySchedule(state?.account, state?.characters, state?.account?.serverVars);
  const tile = (text) => (killroyFailed ? '-' : text);

  return <>
    <NextSeo
      title="Killroy | Idleon Toolbox"
      description="Track your Killroy skull kills, progression tiers, and bonus rewards in Legends of Idleon"
    />
    {killroyFailed ? <MissingData name={'Killroy'} failed atZero/> : null}
    <PageSummary>
      <StatTile label={'Skulls'} icon={'etc/Killroy_Skull.png'} value={tile(formatNum(killroy?.skulls ?? 0, 'whole'))}/>
      <StatTile label={'Total kills'} value={tile(formatNum(killroy?.totalKills ?? 0, 'whole'))}/>
      <StatTile label={'Total damage multi'} value={tile(formatNum(killroy?.totalDamageMulti ?? 1, 'mult'))}/>
    </PageSummary>
    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 2'].categories, 'killroy')}>
      <Schedule killroy={killroy} schedule={schedule} guest={state?.emptyAccount}
                sectionFailed={killroyFailed}/>
      <Upgrades killroy={killroy} sectionFailed={killroyFailed}/>
      <PermanentUpgrades killroy={killroy} sectionFailed={killroyFailed}/>
      <Monsters killroy={killroy} sectionFailed={killroyFailed}/>
    </Tabber>
  </>;
};

export default Killroy;
