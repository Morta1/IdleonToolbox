import React from 'react';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { commaNotation, notateNumber, prefix } from '@utility/helpers';
import { CardTitleAndValue } from '@components/common/styles';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import Tooltip from 'components/Tooltip';
import { getRibbonBonus } from '@parsers/world-4/cooking';

const RibbonIcon = ({ rank, size = 32 }) => <img style={{ width: size, height: size, objectFit: 'contain' }}
                                                 src={`${prefix}data/Ribbon${Math.max(0, rank - 1)}.png`}
                                                 alt={`ribbon-${rank}`}/>;

const SectionTitle = ({ title, tooltip }) => <Stack direction={'row'} alignItems={'center'} gap={1} sx={{ mt: 3 }}>
  <Typography variant={'h6'}>{title}</Typography>
  <Tooltip title={tooltip}>
    <IconInfoCircleFilled size={18} style={{ cursor: 'pointer', display: 'block' }}/>
  </Tooltip>
</Stack>;

const Ribbons = ({ cookingMastery, account }) => {
  const ribbons = cookingMastery?.ribbons;
  if (!ribbons?.totalMeals) {
    return <Typography sx={{ mt: 3 }}>Ribbons are unlocked via the Grimoire, Cooking Mastery is unlocked via Rift
      61.</Typography>;
  }

  const legendRanks = Array.from({ length: ribbons?.maxRank ?? 0 }, (_, index) => index + 1);

  return <>
    <Stack direction={'row'} flexWrap={'wrap'} gap={3} mt={3} alignItems={'stretch'}>
      <CardTitleAndValue title={'Total ribbon ranks'} value={commaNotation(ribbons?.total)}
                         tooltipTitle={'Ranks are counted across your meals only, ribbons still on the shelf are not included. This is the total the Sour mastery category scales with.'}/>
      <CardTitleAndValue title={'Highest ribbon'} value={ribbons?.highest > 0
        ? `Rank ${ribbons?.highest} (${notateNumber(getRibbonBonus(account, ribbons?.highest), 'MultiplierInfo')}x)`
        : '-'}/>
      <CardTitleAndValue title={'Lowest ribbon'} value={ribbons?.lowest > 0
        ? `Rank ${ribbons?.lowest} (${notateNumber(getRibbonBonus(account, ribbons?.lowest), 'MultiplierInfo')}x)`
        : '-'}/>
      <CardTitleAndValue title={'Ribboned meals'} value={`${ribbons?.ribbonedMeals} / ${ribbons?.totalMeals}`}/>
      <CardTitleAndValue title={'Max rank'} value={ribbons?.maxRank}/>
    </Stack>

    <SectionTitle
      title={'Ribbon shelf'}
      tooltip={'Ribbons waiting on your shelf in-game. Drag one onto a meal to apply it permanently, or onto a duplicate rank to combine.'}/>
    <Stack direction={'row'} flexWrap={'wrap'} gap={1} mt={1}>
      {ribbons?.shelf?.map((shelfRank, index) => <Card key={`shelf-${index}`}
                                                       sx={{ width: 78, opacity: shelfRank > 0 ? 1 : .35 }}>
        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
          <Stack alignItems={'center'} justifyContent={'center'} sx={{ height: 52 }}>
            {shelfRank > 0 ? <>
              <RibbonIcon rank={shelfRank}/>
              <Typography variant={'caption'} noWrap>Rank {shelfRank}</Typography>
            </> : <Typography variant={'caption'} color={'text.secondary'}>Empty</Typography>}
          </Stack>
        </CardContent>
      </Card>)}
    </Stack>

    <SectionTitle
      title={'Rank legend'}
      tooltip={'The meal bonus multiplier each ribbon rank gives, including your Emperor set and Equinox cloud bonuses. Ranks you already have on a meal are highlighted.'}/>
    <Stack direction={'row'} flexWrap={'wrap'} gap={1} mt={1}>
      {legendRanks.map((legendRank) => {
        const mealsAtRank = ribbons?.rankCounts?.[legendRank] ?? 0;
        return <Card key={`legend-${legendRank}`} sx={{ width: 90, opacity: mealsAtRank > 0 ? 1 : .55 }}>
          <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
            <Stack alignItems={'center'}>
              <RibbonIcon rank={legendRank}/>
              <Typography variant={'caption'} noWrap>Rank {legendRank}</Typography>
              <Typography variant={'body2'} fontWeight={'bold'}>
                {notateNumber(getRibbonBonus(account, legendRank), 'MultiplierInfo')}x
              </Typography>
              <Typography variant={'caption'} color={'text.secondary'}>
                {mealsAtRank > 0 ? `${mealsAtRank} meal${mealsAtRank > 1 ? 's' : ''}` : '-'}
              </Typography>
            </Stack>
          </CardContent>
        </Card>;
      })}
    </Stack>
  </>;
};

export default Ribbons;
