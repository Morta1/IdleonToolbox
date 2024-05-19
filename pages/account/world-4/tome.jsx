import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, commaNotation, notateNumber } from '@utility/helpers';
import { CardTitleAndValue } from '@components/common/styles';
import InfoIcon from '@mui/icons-material/Info';
import Tooltip from '@components/Tooltip';

const Tome = () => {
  const { state } = useContext(AppContext);

  return <>
    <NextSeo
      title="Tome | Idleon Toolbox"
      description="Keep track of your tome bonuses and highscores"
    />
    <Typography variant={'h2'} textAlign={'center'} mb={3}>Tome</Typography>
    <CardTitleAndValue title={'Total Points'} value={commaNotation(state?.account?.tome?.totalPoints)}/>
    <Typography variant={'caption'}>* Bubble bonus might be inaccurate because it is determined by your active
      character.</Typography>
    <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
      {state?.account?.tome?.bonuses?.map(({ name, bonus }, index) => {
        const formatted = index <= 2 ? notateNumber(bonus, 'Big') : notateNumber(bonus, 'MultiplierInfo');
        return <CardTitleAndValue key={name} title={cleanUnderscore(name)} value={`${formatted}%`}
                                  icon={`etc/Tome_${index}.png`}>
        </CardTitleAndValue>
      })}
    </Stack>
    <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
      {state?.account?.tome?.tome?.map(({ name, color, tomeLvReq, quantity, index, x2, x4, points }, rIndex) => {
        const formattedQuantity = quantity > 1e9 && x2 === 1 ? notateNumber(quantity, 'Big') : x4 === 1
          ? Math.round(100 * quantity) / 100
          : commaNotation(quantity);
        return <Card key={index} sx={{ width: 300 }}>
          <CardContent sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            opacity: state?.account?.accountLevel < tomeLvReq ? .5 : 1
          }}>
            <Stack mb={1} direction={'row'} alignItems={'center'} gap={1}>
              <Typography variant={'body1'}>{cleanUnderscore(name.replace('(Tap_for_more_info)', ''))}</Typography>
              {rIndex === 18 ? <Tooltip
                title={'Affected by your currently active character'}><InfoIcon></InfoIcon></Tooltip> : null}
            </Stack>
            <Stack mt={'auto'} justifyContent="space-between" direction={'row'}>
              <Typography>{formattedQuantity}</Typography>
              <Typography color={color}>{commaNotation(points)} PTS</Typography>
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

export default Tome;
