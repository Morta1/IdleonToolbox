import { Box, Divider, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  cleanUnderscore,
  formatNum,
  getBitIndex,
  getCoinsArray,
  msToDate,
  notateNumber,
  numberWithCommas,
  prefix
} from '@utility/helpers';
import { CardTitleAndValue } from '@components/common/styles';
import { Breakdown } from '@components/common/Breakdown/Breakdown';
import React from 'react';
import CoinDisplay from '@components/common/CoinDisplay';
import { IconAlertTriangle } from '@tabler/icons-react';
import Tooltip from 'components/Tooltip';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';


const TheBell = ({ hole }) => {
  return <>
    <Stack mb={3} direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      <CardTitleAndValue title={'New method chance'}
                         value={`${notateNumber(hole?.caverns?.theBell?.newMethodChance * 100, 'MultiplierInfo')}%`}/>
      <CardTitleAndValue title={'Rings'}
                         >
        <Stack direction={'row'} alignItems={'center'} gap={1} >
          <Typography>{notateNumber(hole?.caverns?.theBell?.rings, 'Big')}</Typography>
          <Tooltip title={'20th ring bonus from study triggers on rings 19, 39, 59, 79 ...'}>
            <Box component={'span'} sx={{ display: 'inline-flex', color: 'text.warning' }}>
              <IconAlertTriangle size={18}/>
            </Box>
          </Tooltip>

        </Stack>
      </CardTitleAndValue>
      <CardTitleAndValue title={'Opals found'} icon={'data/Opal.png'} imgStyle={{ width: 24, height: 24 }}
                         value={hole?.holesObject?.opalsPerCavern?.[4] || 0}/>
    </Stack>
    <Divider sx={{ my: 2 }}/>
    <CardGrid size={'m'}>
      {hole?.caverns?.theBell?.bells?.map(({ expRate, expReq, exp, readyUses }, index) => {
        const timeToFull = (expReq - exp) / expRate.value * 1000 * 3600;
        return <ItemCard key={`bell-${index}`}
                         icon={<BellBanner src={`${prefix}data/HoleBellAction${index}.png`} alt={'bell-' + index}/>}>
          <ItemCard.Facts rows={[
            ['Exp rate', <Breakdown key={'rate'} data={expRate.breakdown} asValue>
              {numberWithCommas(Math.floor(expRate.value))} / hr
            </Breakdown>],
            ['Exp', `${notateNumber(exp, 'Big')} / ${notateNumber(expReq, 'Big')}`],
            ['Time to full', timeToFull > 0 ? msToDate(timeToFull) : `Ready${readyUses > 1 ? ` (x${readyUses})` : ''}`]
          ]}/>
        </ItemCard>
      })}
    </CardGrid>
    <Divider sx={{ my: 2 }}/>
    <CardGrid size={'m'}>
      {hole?.caverns?.theBell?.improvementMethods?.map(({ description, level, bonus, cost, costType, owned }, index) => {
        if (hole?.caverns?.theBell?.bellMethodsOwned <= index) return null;
        return <ItemCard key={`method-${index}`}
                         level={{ value: level }}
                         footer={<BellMethodCost costType={costType} cost={cost} owned={owned}/>}>
          <ItemCard.Desc>{cleanUnderscore(description.replace('{', notateNumber(bonus, 'Big')))}</ItemCard.Desc>
        </ItemCard>
      })}
    </CardGrid>
    <Divider sx={{ my: 2 }}/>
    <CardGrid size={'m'}>
      {hole?.caverns?.theBell?.bellBonuses?.map(({ description, bonus, level }, index) => {
        return <ItemCard key={`bell-bonus-${index}`} dimmed={level === 0} level={{ value: level }}>
          <ItemCard.Desc>
            {cleanUnderscore(description.replace('{', formatNum(bonus, 'pct', { bare: true })).replace('|', ' '))}
          </ItemCard.Desc>
        </ItemCard>
      })}
    </CardGrid>
  </>
};

const BELL_COST_ICONS = {
  sediments: 'data/HoleWellFill4.png',
  notes: 'data/HoleHarpNote4.png',
  particles: 'etc/Particle.png',
  rupie: 'data/HoleJarR5.png'
};

const BellMethodCost = ({ costType, cost, owned }) => {
  if (costType === 'money') return <CoinDisplay title={''} noShadow money={getCoinsArray(cost)}/>;
  if (costType === 'bits') {
    return <ItemCard.Cost icon={`etc/Bits_${getBitIndex(cost)}.png`} iconAlt={'Bits'} need={cost} have={owned}
                          format={(value) => notateNumber(value, 'bits')}/>;
  }
  return <ItemCard.Cost icon={BELL_COST_ICONS[costType] ?? 'afk_targets/Nothing.png'} iconAlt={costType}
                        need={cost} have={owned}/>;
};

// HoleBellAction sprites are the bell's name as word art, so they stand in for the title
const BellBanner = styled('img')`
  height: 32px;
  object-fit: contain;
`;

export default TheBell;
