import { Stack, Typography } from '@mui/material';
import { formatDuration, formatNum, secondsToCoarseDuration } from '@utility/helpers';
import { formatGame } from '@utility/gameNotation';
import Timer from '@components/common/Timer';
import React from 'react';
import { getCropEvolution, getProductDoubler, getTotalCrop } from '@parsers/world-6/farming';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import CardGrid from '@components/common/cards/CardGrid';
import IconTile from '@components/common/cards/IconTile';
import ItemCard from '@components/common/cards/ItemCard';
import GameIcon from '@components/common/GameIcon';
import InfoButton, { NoteTrigger } from '@components/common/InfoButton';
import StatusText from '@components/common/StatusText';

const Plot = ({ plot, market, ranks, lastUpdated, account, characters, selectedCharacter, enableNano }) => {
  const { productDoubler, percent, multi } = getProductDoubler(market) || {};
  const totals = getTotalCrop(plot, market, ranks, account);
  const doublerNote = productDoubler < 100
    ? `Doesn't include your ${productDoubler}% chance to x2 the quantity collected from Product Doubler.`
    : percent > 0
      ? `Doesn't include your ${percent}% chance to x${parseInt(multi) + 1} the quantity collected from Product Doubler.`
      : null;

  return <>
    <Stack direction={'row'} alignItems={'center'} gap={0.5} mb={1}>
      <Typography variant={'cardTitle'} component={'h2'}>Totals{productDoubler > 100 && multi >= 2 ? ` (x${multi})` : ''}</Typography>
      {doublerNote ? <InfoButton label={'Totals'}>{doublerNote}</InfoButton> : null}
    </Stack>
    <CardGrid size={'icon'} sx={{ mb: 3 }}>
      {/* Crops come whole: the total rounds down, on the tile and in its exact note */}
      {Object.entries(totals || {}).map(([icon, quantity]) => <IconTile key={icon} icon={`data/${icon}`}
                                                                        alt={`Crop ${icon.replace(/\D/g, '')}`}
                                                                        value={Math.floor(quantity)} kind={'amount'}
                                                                        details={formatNum(Math.floor(quantity), 'exact')}/>)}
    </CardGrid>
    <CardGrid size={'s'}>
      {plot?.map((crop, index) => {
        let {
          rank,
          rankProgress,
          rankRequirement,
          cropQuantity,
          cropRawName,
          seedRawName,
          nextOGChance,
          nextOGEta,
          isLocked,
          currentOG,
          ogMulti,
          timeLeft,
          maxTimeLeft
        } = crop;
        nextOGChance = Math.min(100, 100 * nextOGChance);
        nextOGChance = nextOGChance >= 10 ? nextOGChance : 10 * nextOGChance / 10;
        // An evo-locked plot keeps growing, so it is not dimmed; its crop evo still opens the bonuses
        const nextEvoChance = getCropEvolution(account, selectedCharacter, crop, enableNano, characters);
        return <ItemCard key={'plot-' + index} icon={`etc/${seedRawName}`} title={`Plot ${index + 1}`}
                         meta={`Floor ${Math.floor(index / 9) + 1}`}
                         aside={isLocked ? <StatusText status={'locked'}/> : null}>
          <ItemCard.Facts rows={[
            ['Crop', <Stack key={'crop'} component={'span'} direction={'row'} alignItems={'center'} gap={0.5}>
              <GameIcon src={`data/${cropRawName}`} size={16} alt={''}/>{formatNum(cropQuantity ?? 0, 'whole')}</Stack>],
            account?.farming?.hasLandRank ? ['Rank', formatNum(rank || 0)] : null,
            ['Rank EXP', `${formatGame(rankProgress || 0, 'FarmingStuffs.LankRankEXPreq', { whole: true })} / ${formatGame(rankRequirement || 0, 'FarmingStuffs.LankRankEXPreq', { whole: true })}`],
            ['Crop evo', <Breakdown key={'evo'} asValue data={nextEvoChance?.breakdown}>
              {nextEvoChance?.isLocked ? 'Locked' : formatNum(nextEvoChance?.value, 'pct')}</Breakdown>],
            ['Current OG', `${currentOG} (x${formatGame(ogMulti, 'FarmingStuffs.OGmulti')})`],
            ['Next OG', <>{formatNum(nextOGChance, 'pct', { precise: true })}{nextOGEta
              ? <>{' '}<NoteTrigger note={'Average wait for this plot to double again.'} label={'About the wait'}>
                (~{secondsToCoarseDuration(nextOGEta)})</NoteTrigger></> : null}</>],
            ['Max time', formatDuration(maxTimeLeft)],
            // The Timer draws a text placeholder at body1, so Ready comes as the state word itself
            ['Next crop', <Timer key={'next'} type={'countdown'} lastUpdated={lastUpdated} placeholder={<StatusText status={'ready'}/>}
                                 date={new Date().getTime() + timeLeft * 1000}/>]
          ]}/>
        </ItemCard>
      })}
    </CardGrid>
  </>;
};

export default Plot;
