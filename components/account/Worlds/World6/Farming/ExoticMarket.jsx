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
import GameIcon from '@components/common/GameIcon';
import StatusText from '@components/common/StatusText';
import Timer from '@components/common/Timer';
import Toolbar from '@components/common/Toolbar';
import useToolbarState from '@hooks/useToolbarState';

// The card text's own fill (parsers/world-6/farming.ts, `{`), so the bar and the line under it read 0.67 alike
const effectText = (value) => String(fillRound(value ?? 0));
// ExoticReturnsIn draws a caption; on the card's meta line it takes the line's own type
const META_TEXT_SX = { font: 'inherit', letterSpacing: 'inherit' };
const EXOTIC_TOOLBAR = { sort: { key: 'return', order: 'asc' } };
const SORTS = [['return', 'Returns soonest', 'asc', ['Soonest first', 'Latest first']],
  ['game', 'Game order', 'asc', ['Game order', 'Game order reversed']]];

const Market = ({ market }) => {
  const { state } = useContext(AppContext);

  const rotations = getExoticMarketRotations(state?.account, 2);
  const nextRotationDate = rotations?.[1]?.date;

  const organicLabels = state?.account?.menagerie?.doublers?.organicLabels;
  const returnsIn = getExoticMarketReturnWeeks(state?.account);
  const withReturnWeeks = market?.map((upgrade) => ({ ...upgrade, returnWeeks: returnsIn(upgrade.index) }));
  const currentRotation = withReturnWeeks?.filter(u => u.isAvailableThisWeek);
  const [toolbar, setToolbar, resetToolbar] = useToolbarState('exotic-market', EXOTIC_TOOLBAR);
  const sortKey = toolbar?.sort?.key ?? 'return';
  const flip = toolbar?.sort?.order === 'desc' ? -1 : 1;
  // Upgrades outside the lookahead window stay at the bottom either way
  const byReturn = (a, b) => (a.returnWeeks == null) - (b.returnWeeks == null)
    || flip * ((a.returnWeeks ?? 0) - (b.returnWeeks ?? 0));
  // The game's order keeps each family together (Genealogy I to V)
  const byGame = (a, b) => flip * (a.index - b.index);
  const offRotation = withReturnWeeks
    ?.filter(u => !u.isAvailableThisWeek)
    ?.sort(sortKey === 'game' ? byGame : byReturn);

  const breakpoints = [50, 75, 90, 95, 99].map(pct => ({
    pct,
    lvlNeeded: Math.ceil(findExoticCappedThresholdLevel(pct))
  }));

  // A card keeps what it gives (its bar and its text) and when it returns, on the level's line in place of a footer. The
  // share of the hard cap ends the effect's numbers rather than taking a row: as a row the card ran a third taller.
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
                       </Stack> : null}>
        {isCapped
          ? <ItemCard.Progress label={'Effect'} value={effectText(value)} percent={Math.min(100, percentOfCap ?? 0)}
                               max={<>{effectText(maxValue)}<Box component={'span'} sx={{ color: 'text.secondary' }}>
                                 {` · ${formatNum(percentOfCap ?? 0, 'pct')}`}
                               </Box></>}/>
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
            <CardGrid size={'m'}>
              {renderCards(currentRotation)}
            </CardGrid>
          </Stack>

          <Stack gap={1.5}>
            <Typography variant={'sectionTitle'} component={'h2'}>Off rotation</Typography>
            <Toolbar state={toolbar} defaults={EXOTIC_TOOLBAR} onChange={setToolbar} onReset={resetToolbar}
                     total={offRotation?.length ?? 0} shown={offRotation?.length ?? 0} noun={'upgrades'}>
              <Toolbar.Sort options={SORTS}/>
            </Toolbar>
            <CardGrid size={'m'}>
              {renderCards(offRotation)}
            </CardGrid>
          </Stack>
        </Stack>
      </Box>
    </Stack>
  );
};

export default Market;
