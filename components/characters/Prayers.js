import { Box, Stack, Typography } from "@mui/material";
import { cleanUnderscore, kFormatter, prefix, round } from "utility/helpers";
import Tooltip from "../Tooltip";
import { calcPrayerCost } from "parsers/prayers";
import styled from "@emotion/styled";
import React from "react";

const Prayers = ({ prayers }) => {
  return <Stack>
    <Typography variant={'h5'}>Prayers</Typography>
    <Stack direction={'row'} gap={2} flexWrap='wrap' justifyContent={'center'}>
      {prayers?.map((prayer, index) => {
        return <Tooltip title={<CurseTooltip {...prayer}/>} key={name + index}>
          <PrayerIcon src={`${prefix}data/Prayer${prayer?.prayerIndex}.png`} alt=""/>
        </Tooltip>;
      })}
    </Stack>
  </Stack>
};

const PrayerIcon = styled.img`
  width: 50px;
  height: 50px;
`;

const CurseTooltip = ({ name, x1, x2, level, prayerIndex, effect, curse, maxLevel, totalAmount, costMulti }) => {
  const calculatedBonus = x1 + (x1 * (level - 1)) / 10;
  const calculatedCurse = x2 + (x2 * (level - 1)) / 10;
  const cost = calcPrayerCost({ name, x1, x2, level, prayerIndex, costMulti });
  return <>
    <Typography mb={1} fontWeight={'bold'} variant={'h5'}>{cleanUnderscore(name)}</Typography>
    <Typography fontWeight={'bold'} variant={'body1'} color={'success.dark'}>Bonus: <Typography color={'black'}
                                                                                                fontWeight={400}
                                                                                                component={'span'}>{cleanUnderscore(effect).replace('{', calculatedBonus)}</Typography></Typography>
    <Typography fontWeight={'bold'} variant={'body1'} color={'error.dark'}>Curse: <Typography color={'black'}
                                                                                              fontWeight={400}
                                                                                              component={'span'}>{cleanUnderscore(curse).replace('{', calculatedCurse)}</Typography></Typography>
    <Box mt={1}>Cost: {level !== maxLevel ? <><Typography component={'span'}
                                                          sx={{ color: level === 0 ? '' : cost <= totalAmount ? 'success.dark' : 'error.dark' }}>
        {kFormatter(round(cost), 2)}</Typography> ({kFormatter(totalAmount, 2)})</> :
      <Typography fontWeight={'bold'} color={'success.dark'} component={'span'}>Maxed</Typography>}
    </Box>
  </>
}


export default Prayers;
