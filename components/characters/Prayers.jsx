import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, kFormatter, prefix, round } from 'utility/helpers';
import Tooltip from '../Tooltip';
import { calcPrayerCost } from 'parsers/prayers';
import styled from '@emotion/styled';
import React from 'react';

const Prayers = ({ prayers }) => {
  return <>
    <Card variant={'outlined'} sx={{ height: 'fit-content' }}>
      <CardContent>
        <Stack direction={'row'} gap={2} flexWrap="wrap" justifyContent={'center'}>
          {prayers?.length === 0 ? <Typography variant={'body2'}>No prayers equipped</Typography> : prayers?.map((prayer, index) => {
            return <Tooltip title={<CurseTooltip {...prayer}/>} key={name + index}>
              <PrayerIcon src={`${prefix}data/Prayer${prayer?.prayerIndex}.png`} alt=""/>
            </Tooltip>;
          })}
        </Stack>
      </CardContent>
    </Card>
  </>
};

const PrayerIcon = styled.img`
  width: 32px;
  height: 32px;
`;

const CurseTooltip = ({ name, x1, x2, level, prayerIndex, effect, curse, maxLevel, totalAmount, costMulti }) => {
  const calculatedBonus = x1 + (x1 * (level - 1)) / 10;
  const calculatedCurse = x2 + (x2 * (level - 1)) / 10;
  const cost = calcPrayerCost({ name, x1, x2, level, prayerIndex, costMulti });
  return <>
    <Typography mb={1} fontWeight={'bold'} variant={'h5'}>{cleanUnderscore(name)}</Typography>
    <Typography fontWeight={'bold'} variant={'body1'} color={'success.light'}>Bonus: <Typography
      fontWeight={400}
      component={'span'}>{cleanUnderscore(effect).replace('{', calculatedBonus)}</Typography></Typography>
    <Typography fontWeight={'bold'} variant={'body1'} color={'error.light'}>Curse: <Typography
      fontWeight={400}
      component={'span'}>{cleanUnderscore(curse).replace('{', calculatedCurse)}</Typography></Typography>
    <Box mt={1}>Cost: {level !== maxLevel ? <><Typography component={'span'}
                                                          sx={{
                                                            color: level === 0 ? '' : cost <= totalAmount
                                                              ? 'success.light'
                                                              : 'error.light'
                                                          }}>
        {kFormatter(round(cost), 2)}</Typography> ({kFormatter(totalAmount, 2)})</> :
      <Typography fontWeight={'bold'} color={'success.light'} component={'span'}>Maxed</Typography>}
    </Box>
  </>
}


export default Prayers;
