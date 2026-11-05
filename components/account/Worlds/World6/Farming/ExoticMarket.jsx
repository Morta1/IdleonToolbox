import { Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum, titleCaseName } from '@utility/helpers';
import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import {
  findExoticCappedThresholdLevel,
  getExoticMarketReturnWeeks,
  getExoticMarketRotations
} from '@parsers/world-6/farming';
import ExoticReturnsIn from './ExoticReturnsIn';
import HiddenCapLine from '@components/common/HiddenCapLine';
import { DOUBLER_ICONS, DoublerUsageCard } from '@components/account/Worlds/World7/Menagerie/menagerie.utils';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import StatTile from '@components/common/cards/StatTile';
import GameIcon from '@components/common/GameIcon';
import StatusText from '@components/common/StatusText';
import Timer from '@components/common/Timer';

// The card text's own fill (parsers/world-6/farming.ts, `{`): Math.round(100 * x) / 100, so the bar and the line
// under it read 0.67 alike
const effectText = (value) => String(Math.round((value ?? 0) * 100) / 100);

const Market = ({ market }) => {
  const { state } = useContext(AppContext);

  const rotations = getExoticMarketRotations(state?.account, 2);
  const nextRotationDate = rotations?.[1]?.date;

  const organicLabels = state?.account?.menagerie?.doublers?.organicLabels;
  const returnsIn = getExoticMarketReturnWeeks(state?.account);
  const withReturnWeeks = market?.map((upgrade) => ({ ...upgrade, returnWeeks: returnsIn(upgrade.index) }));
  const currentRotation = withReturnWeeks?.filter(u => u.isAvailableThisWeek);
  // Soonest return first; upgrades outside the lookahead window sink to the bottom
  const offRotation = withReturnWeeks
    ?.filter(u => !u.isAvailableThisWeek)
    ?.sort((a, b) => (a.returnWeeks ?? Infinity) - (b.returnWeeks ?? Infinity));

  const breakpoints = [50, 75, 90, 95, 99].map(pct => ({
    pct,
    lvlNeeded: Math.ceil(findExoticCappedThresholdLevel(pct))
  }));

  const renderCards = (list) =>
    list?.map((
      {
        name,
        level,
        value,
        maxValue,
        percentOfCap,
        isCapped,
        isOrganic,
        displayText,
        x2,
        returnWeeks,
        index
      },
      marketIndex
    ) => {
      const title = titleCaseName(cleanUnderscore(name));
      return <ItemCard key={'upgrade' + marketIndex} icon={`data/FarmCrop${x2}.png`} title={title}
                       level={{ value: level }}
                       aside={isOrganic ? <Stack direction={'row'} alignItems={'center'} gap={0.5}>
                         <GameIcon src={DOUBLER_ICONS.organicLabels} size={16} alt={''}/>
                         <Typography variant={'caption'} color={'text.success'}>Organic label: x2</Typography>
                       </Stack> : null}
                       footer={<ExoticReturnsIn weeks={returnWeeks}/>}>
        {isCapped
          // The share of the hard cap gets its own line, so it never reads as the cap's
          ? <Stack gap={0.5}>
            <ItemCard.Progress label={'Effect'} value={effectText(value)} max={effectText(maxValue)}
                               percent={Math.min(100, percentOfCap ?? 0)}/>
            <Typography variant={'caption'} color={'text.secondary'}>
              {`${formatNum(percentOfCap ?? 0, 'pct')} of the hard cap`}
            </Typography>
          </Stack>
          : <ItemCard.Facts rows={[['Effect', `${effectText(value)}, no cap`]]}/>}
        <ItemCard.Desc text={displayText}/>
        <HiddenCapLine system={'exotic'} index={index} name={title}/>
      </ItemCard>;
    });

  return (
    <Stack gap={4}>
      {organicLabels?.owned > 0 ? <Stack direction="row" gap={2} flexWrap="wrap">
        <DoublerUsageCard title={'Organic Labels'} doubler={organicLabels} icon={DOUBLER_ICONS.organicLabels}/>
      </Stack> : null}
      <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
        {breakpoints.map(({ pct, lvlNeeded }) => <StatTile key={pct} label={`${pct}% of cap`}
                                                           value={formatNum(lvlNeeded, 'level')}/>)}
      </Stack>

      {/* Current Rotation */}
      <Stack>
        <Stack direction="row" alignItems="baseline" gap={2} sx={{ mb: 3 }} flexWrap="wrap">
          <Typography variant={'sectionTitle'} component={'h2'}>Current rotation</Typography>
          {nextRotationDate instanceof Date ? <Typography variant={'caption'} color={'text.secondary'}>
            {/* The Timer ticks itself and reads like every timer; its text placeholder would draw at body1 */}
            Next in <Timer type={'countdown'} date={nextRotationDate.getTime()} component={'span'}
                           placeholder={<StatusText status={'ready'}/>}/>
          </Typography> : null}
        </Stack>
        <CardGrid size={'m'}>
          {renderCards(currentRotation)}
        </CardGrid>
      </Stack>

      {/* Off Rotation */}
      <Stack>
        <Typography sx={{ mb: 3 }} variant={'sectionTitle'} component={'h2'}>Off rotation</Typography>
        <CardGrid size={'m'}>
          {renderCards(offRotation)}
        </CardGrid>
      </Stack>
    </Stack>
  );
};

export default Market;
