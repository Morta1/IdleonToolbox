import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import {
  cleanUnderscore,
  getBitIndex,
  getCoinsArray,
  msToDate,
  notateNumber,
  numberWithCommas,
  prefix
} from '@utility/helpers';
import { Breakdown, CardTitleAndValue } from '@components/common/styles';
import React from 'react';
import CoinDisplay from '@components/common/CoinDisplay';
import Box from '@mui/material/Box';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import Tooltip from 'components/Tooltip';

const TheBell = ({ hole }) => {
  return <>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      <CardTitleAndValue title={'New method chance'}
        value={`${notateNumber(hole?.caverns?.theBell?.newMethodChance * 100, 'MultiplierInfo')}%`} />
    </Stack>
    <Divider sx={{ my: 2 }} />
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      {hole?.caverns?.theBell?.bells?.map(({ name, expRate, expReq, exp, bonus }, index) => {
        const timeToFull = (expReq - exp) / expRate.value * 1000 * 3600;
        return <Card key={`bell-${index}`}>
          <CardContent sx={{ width: 300 }}>
            <img src={`${prefix}data/HoleBellAction${index}.png`}
              style={{ transform: 'translateX(-15px)' }}
              alt={'bell-cover-' + index} />
            <Stack direction={'row'} alignItems={'center'} gap={1}>
              <Typography>Exp rate: {numberWithCommas(Math.floor(expRate.value))} / hr</Typography>
              <Tooltip title={<Breakdown breakdown={expRate.breakdown} titleStyle={{width: 170}} />}>
                <IconInfoCircleFilled size={18} />
              </Tooltip>
            </Stack>
            <Typography mt={1}>{notateNumber(exp, 'Big')} / {notateNumber(expReq, 'Big')} Exp</Typography>
            <Typography mt={1}>Time to full: {timeToFull > 0 ? msToDate(timeToFull) : 'Ready'}</Typography>
          </CardContent>
        </Card>
      })}
    </Stack>
    <Divider sx={{ my: 2 }} />
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      {hole?.caverns?.theBell?.improvementMethods?.map(({
        description,
        level,
        bonus,
        cost,
        costType,
        owned
      }, index) => {
        return <Card key={`method-${index}`}>
          <CardContent
            sx={{ width: 300, height: 140, opacity: hole?.caverns?.theBell?.bellMethodsOwned > index ? 1 : 0 }}>
            <Typography>Lv. {level}</Typography>
            <Typography>{cleanUnderscore(description.replace('{', notateNumber(bonus, 'Big')))}</Typography>
            <Box sx={{ mt: 1 }}>
              {costType === 'money' ? <CoinDisplay title={''}
                noShadow
                money={getCoinsArray(cost)} /> : null}
              {costType === 'sediments' ? <Stack direction={'row'} alignItems={'center'} gap={2}>
                <img src={`${prefix}data/HoleWellFill4.png`}
                  style={{ width: 45, height: 45, objectFit: 'none' }}
                  alt={'bell-cover-' + index} />
                <Typography>{notateNumber(owned, 'Big')} / {notateNumber(cost, 'Big')}</Typography>
              </Stack> : null}
              {costType === 'bits' ? <Stack direction={'row'} alignItems={'center'} gap={2}>
                <img src={`${prefix}etc/Bits_${getBitIndex(owned)}.png`}
                  alt={'bits-cost-' + index} />
                <Typography>{notateNumber(owned, 'bits')} / {notateNumber(cost, 'bits')}</Typography>
                <img src={`${prefix}etc/Bits_${getBitIndex(cost)}.png`}
                  alt={'bits-cost-' + index} />
              </Stack> : null}
              {costType === 'notes' ? <Stack direction={'row'} alignItems={'center'} gap={2}>
                <img src={`${prefix}data/HoleHarpNote4.png`}
                  alt={'notes-cost-' + index} />
                <Typography>{notateNumber(owned, 'Big')} / {notateNumber(cost, 'Big')}</Typography>
              </Stack> : null}
              {costType === 'particles' ? <Stack direction={'row'} alignItems={'center'} gap={2}>
                <img src={`${prefix}etc/Particle.png`}
                  alt={'particles-cost-' + index} />
                <Typography>{notateNumber(owned, 'Big')} / {notateNumber(cost, 'Big')}</Typography>
              </Stack> : null}
              {costType === 'rupie' ? <Stack direction={'row'} alignItems={'center'} gap={2}>
                <img src={`${prefix}data/HoleJarR5.png`}
                  alt={'rupie-cost-' + index} />
                <Typography>{notateNumber(owned, 'Big')} / {notateNumber(cost, 'Big')}</Typography>
              </Stack> : null}
              {costType === 'unknown' ? <Stack direction={'row'} alignItems={'center'} gap={2}>
                <img src={`${prefix}afk_targets/Nothing.png`}
                  alt={'unknown-cost-' + index} />
                <Typography>{notateNumber(owned, 'Big')} / {notateNumber(cost, 'Big')}</Typography>
              </Stack> : null}
            </Box>
          </CardContent>
        </Card>
      })}
    </Stack>
    <Divider sx={{ my: 2 }} />
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
      {hole?.caverns?.theBell?.bellBonuses?.map(({ description, bonus, level }, index) => {
        return <Card key={`bell-${index}`}>
          <CardContent sx={{ width: 300 }}>
            <Typography>Lv. {level}</Typography>
            <Typography>{cleanUnderscore(description.replace('{', bonus.toFixed(2).replace('.00', '')).replace('|', ' '))}</Typography>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

export default TheBell;
