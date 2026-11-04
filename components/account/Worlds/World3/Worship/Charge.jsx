import React, { useContext } from 'react';
import { Stack } from '@mui/material';
import { AppContext } from '@components/common/context/AppProvider';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import Timer from '../../../../common/Timer';
import { getChargeWithSyphon, getClosestWorshiper } from '@parsers/world-3/worship';
import StatTile from '@components/common/cards/StatTile';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import Notice from '@components/common/Notice';
import StatusText from '@components/common/StatusText';

const Charge = () => {
  const { state } = useContext(AppContext);
  const characters = state?.characters ?? [];
  if (!characters.length) return <Notice tone={'signin'}>Each character&apos;s charge shows here once you sign in.</Notice>;

  // The Timer dates read the clock once, as a data page's do
  const now = new Date().getTime();
  const closestToFull = getClosestWorshiper(characters);
  const { bestWizard, totalCharge, bestChargeSyphon, totalChargeRate, timeToOverCharge } = getChargeWithSyphon(characters);
  const maxChargeWithSyphon = (bestWizard?.worship?.maxCharge || 0) + (bestChargeSyphon ?? 0);
  const someoneFills = Number.isFinite(closestToFull?.timeLeft);
  const full = <StatusText status={'ready'}>Full</StatusText>;

  return (
    <>
      <Stack direction={'row'} gap={1} flexWrap={'wrap'} sx={{ mb: 3 }}>
        <StatTile label={'Total charge'} value={Math.round(totalCharge ?? 0)} kind={'amount'}/>
        <StatTile label={'Daily charge'} value={formatNum(24 * (totalChargeRate ?? 0), 'pct')}/>
        <StatTile label={'First to full'} value={someoneFills ? closestToFull?.character : '-'}
                  sub={someoneFills ? <Timer type={'countdown'} placeholder={full} lastUpdated={state?.lastUpdated}
                                             date={now + closestToFull.timeLeft}/> : undefined}/>
        <StatTile label={'Charge with syphon'} value={`${formatNum(totalCharge ?? 0)} / ${formatNum(maxChargeWithSyphon)}`}
                  info={'Log in to every character before you use the syphon: the game applies a character\'s charge only when it logs in.'}
                  sub={bestWizard?.name ? <>{bestWizard.name}{' · '}<Timer type={'countdown'} placeholder={full}
                                                                       date={timeToOverCharge}
                                                                       lastUpdated={state?.lastUpdated}/></> : undefined}/>
      </Stack>
      <CardGrid size={'m'}>
        {characters.map(({ worship, tools, name, classIndex, skillsInfo }, index) => {
          const skull = tools?.find(({ name }) => name?.includes('Skull'));
          const timeLeft = ((worship?.maxCharge ?? 0) - (worship?.currentCharge ?? 0)) / worship?.chargeRate * 1000 * 3600;
          return <ItemCard key={`${name}-${index}`} icon={`data/ClassIcons${classIndex}.png`} title={name}
                           meta={[`Worship Lv ${formatNum(skillsInfo?.worship?.level ?? 0)}`, skull ? cleanUnderscore(skull.name) : null]
                             .filter(Boolean).join(' · ')}>
            <ItemCard.Progress label={'Charge'} value={Math.floor(worship?.currentCharge ?? 0)} max={worship?.maxCharge ?? 0}/>
            <ItemCard.Facts rows={[
              ['Charge rate', `${formatNum((worship?.chargeRate ?? 0) * 24, 'pct')} per day`],
              ['Full in', Number.isFinite(timeLeft)
                ? <Timer key={'full'} type={'countdown'} component={'span'} placeholder={full} date={now + timeLeft}
                         lastUpdated={state?.lastUpdated}/>
                : '-']
            ]}/>
          </ItemCard>;
        })}
      </CardGrid>
    </>
  );
};

export default Charge;
