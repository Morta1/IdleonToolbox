import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, kFormatter, prefix, round } from 'utility/helpers';
import Tooltip from '../Tooltip';
import { calcPrayerCost } from '@parsers/world-3/prayers';
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
    <Typography mb={1} variant={'cardTitle'} component={'div'}>{cleanUnderscore(name)}</Typography>
    {/* The labels keep their color at 500, so the 16/500 title above them leads */}
    <Typography fontWeight={500} variant={'body1'} color={'text.success'}>Bonus: <Typography
      fontWeight={400}
      component={'span'}>{cleanUnderscore(effect).replace('{', calculatedBonus)}</Typography></Typography>
    <Typography fontWeight={500} variant={'body1'} color={'text.error'}>Curse: <Typography
      fontWeight={400}
      component={'span'}>{cleanUnderscore(curse).replace('{', calculatedCurse)}</Typography></Typography>
    <Box mt={1}>Cost: {level !== maxLevel ? <><Typography component={'span'}
                                                          sx={{
                                                            color: level === 0 ? '' : cost <= totalAmount
                                                              ? 'text.success'
                                                              : 'text.error'
                                                          }}>
        {kFormatter(round(cost), 2)}</Typography> ({kFormatter(totalAmount, 2)})</> :
      <Typography fontWeight={500} color={'text.success'} component={'span'}>Maxed</Typography>}
    </Box>
  </>
}


export default Prayers;
