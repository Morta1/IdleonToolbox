import { Divider, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  cleanUnderscore,
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
import { IconAlertTriangle, IconInfoCircleFilled } from '@tabler/icons-react';
import Tooltip from 'components/Tooltip';
import UpgradeCard, { IconValueRow, LabelValue } from '@components/common/UpgradeCard';


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
            <IconAlertTriangle color="#cc952e" size={18}/>
          </Tooltip>

        </Stack>
      </CardTitleAndValue>
      <CardTitleAndValue title={'Opals found'} icon={'data/Opal.png'} imgStyle={{ width: 24, height: 24 }}
                         value={hole?.holesObject?.opalsPerCavern?.[4] || 0}/>
    </Stack>
    <Divider sx={{ my: 2 }}/>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
      {hole?.caverns?.theBell?.bells?.map(({ expRate, expReq, exp, readyUses }, index) => {
        const timeToFull = (expReq - exp) / expRate.value * 1000 * 3600;
        return <UpgradeCard key={`bell-${index}`}
                            icon={<BellBanner src={`${prefix}data/HoleBellAction${index}.png`} alt={'bell-' + index}/>}>
          <Stack gap={.5}>
            <Stack direction={'row'} alignItems={'center'} gap={.5}>
              <LabelValue label={'Exp rate'}>{numberWithCommas(Math.floor(expRate.value))} / hr</LabelValue>
              <Breakdown data={expRate.breakdown}>
                <Stack><IconInfoCircleFilled size={16}/></Stack>
              </Breakdown>
            </Stack>
            <LabelValue label={'Exp'}>{notateNumber(exp, 'Big')} / {notateNumber(expReq, 'Big')}</LabelValue>
            <LabelValue label={'Time to full'}>
              {timeToFull > 0 ? msToDate(timeToFull) : `Ready${readyUses > 1 ? ` (x${readyUses})` : ''}`}
            </LabelValue>
          </Stack>
        </UpgradeCard>
      })}
    </Stack>
    <Divider sx={{ my: 2 }}/>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
      {hole?.caverns?.theBell?.improvementMethods?.map(({ description, level, bonus, cost, costType, owned }, index) => {
        if (hole?.caverns?.theBell?.bellMethodsOwned <= index) return null;
        return <UpgradeCard key={`method-${index}`}
                            footer={<BellMethodCost costType={costType} cost={cost} owned={owned}/>}>
          <Stack gap={.5}>
            <Typography variant={'body2'} color={'text.secondary'}>Lv. {level}</Typography>
            <Typography variant={'body2'}>{cleanUnderscore(description.replace('{', notateNumber(bonus, 'Big')))}</Typography>
          </Stack>
        </UpgradeCard>
      })}
    </Stack>
    <Divider sx={{ my: 2 }}/>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
      {hole?.caverns?.theBell?.bellBonuses?.map(({ description, bonus, level }, index) => {
        return <UpgradeCard key={`bell-bonus-${index}`} dimmed={level === 0}>
          <Stack gap={.5}>
            <Typography variant={'body2'} color={'text.secondary'}>Lv. {level}</Typography>
            <Typography variant={'body2'}>
              {cleanUnderscore(description.replace('{', bonus.toFixed(2).replace('.00', '')).replace('|', ' '))}
            </Typography>
          </Stack>
        </UpgradeCard>
      })}
    </Stack>
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
    return <IconValueRow src={`etc/Bits_${getBitIndex(cost)}.png`}>
      {notateNumber(owned, 'bits')} / {notateNumber(cost, 'bits')}
    </IconValueRow>
  }
  return <IconValueRow src={BELL_COST_ICONS[costType] ?? 'afk_targets/Nothing.png'}
                       fit={costType === 'sediments' ? 'cover' : 'contain'}>
    {notateNumber(owned, 'Big')} / {notateNumber(cost, 'Big')}
  </IconValueRow>
};

// HoleBellAction sprites are the bell's name as word art, so they stand in for the title
const BellBanner = styled('img')`
  height: 32px;
  object-fit: contain;
`;

export default TheBell;
