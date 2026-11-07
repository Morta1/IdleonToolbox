import { Box, Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum, titleCaseName } from '@utility/helpers';
import { fillRound } from '@utility/gameNotation';
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
import { SummaryFailed } from '@components/common/cards/PageSummary';
import GameIcon from '@components/common/GameIcon';
import StatusText from '@components/common/StatusText';
import Timer from '@components/common/Timer';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';

// The card text's own fill (parsers/world-6/farming.ts, `{`), so the bar and the line under it read 0.67 alike
const effectText = (value) => String(fillRound(value ?? 0));
// ExoticReturnsIn draws a caption; on the card's meta line it takes the line's own type
const META_TEXT_SX = { font: 'inherit', letterSpacing: 'inherit' };

const MARKET_TOOLBAR = { details: false };

const Market = ({ market }) => {
  const { state } = useContext(AppContext);
  const failed = useContext(SummaryFailed);
  const [view, setView, resetView] = useToolbarState('farming-exotic-market', MARKET_TOOLBAR);

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

  // A card keeps what it gives (its bar and its text) and when it returns, on the level's line in place of a footer. The
  // share of the hard cap shows with the Details pill: the card ran about a third taller than the old page's.
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
                       meta={<ExoticReturnsIn weeks={returnWeeks} sx={META_TEXT_SX}/>}
                       aside={isOrganic ? <Stack direction={'row'} alignItems={'center'} gap={0.5}>
                         <GameIcon src={DOUBLER_ICONS.organicLabels} size={16} alt={''}/>
                         <Typography variant={'caption'} color={'text.success'}>Organic label: x2</Typography>
                       </Stack> : null}
                       more={isCapped
                         ? <ItemCard.Facts rows={[['Share of the hard cap', formatNum(percentOfCap ?? 0, 'pct')]]}/>
                         : null}>
        {isCapped
          ? <ItemCard.Progress label={'Effect'} value={effectText(value)} max={effectText(maxValue)}
                               percent={Math.min(100, percentOfCap ?? 0)}/>
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

      <Box>
        {failed ? null : <Toolbar state={view} defaults={MARKET_TOOLBAR} onChange={setView} onReset={resetView}
                                  total={market?.length ?? 0} shown={market?.length ?? 0} noun={'upgrades'}>
          <Toolbar.Filter name={'details'} label={'Details'} display/>
        </Toolbar>}
        <Stack gap={4}>
          <Stack gap={1.5}>
            <Stack direction="row" alignItems="baseline" gap={2} flexWrap="wrap">
              <Typography variant={'sectionTitle'} component={'h2'}>Current rotation</Typography>
              {nextRotationDate instanceof Date ? <Typography variant={'caption'} color={'text.secondary'}>
                {/* The Timer ticks itself and reads like every timer; its text placeholder would draw at body1 */}
                Next in <Timer type={'countdown'} date={nextRotationDate.getTime()} component={'span'}
                               placeholder={<StatusText status={'ready'}/>}/>
              </Typography> : null}
            </Stack>
            <CardGrid size={'m'} details={!failed && view?.details}>
              {renderCards(currentRotation)}
            </CardGrid>
          </Stack>

          <Stack gap={1.5}>
            <Typography variant={'sectionTitle'} component={'h2'}>Off rotation</Typography>
            <CardGrid size={'m'} details={!failed && view?.details}>
              {renderCards(offRotation)}
            </CardGrid>
          </Stack>
        </Stack>
      </Box>
    </Stack>
  );
};

export default Market;
