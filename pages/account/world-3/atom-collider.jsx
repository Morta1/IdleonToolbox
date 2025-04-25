import React, { useContext, useMemo } from 'react';
import { AppContext } from '../../../components/common/context/AppProvider';
import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, commaNotation, msToDate, notateNumber, prefix } from '../../../utility/helpers';
import processString from 'react-process-string';
import { NextSeo } from 'next-seo';
import { calcTotals } from '../../../parsers/printer';
import { CardTitleAndValue } from '@components/common/styles';
import Timer from '@components/common/Timer';

const AtomCollider = ({}) => {
  const { state } = useContext(AppContext);
  const { atoms, particles, stampReducer } = state?.account?.atoms || {};
  const totals = useMemo(() => calcTotals(state?.account), [state?.account]);
  return <>
    <NextSeo
      title="Atom Collider | Idleon Toolbox"
      description="Atom Collider bonuses and progression"
    />
    <Stack direction={'row'} gap={2}>
      <CardTitleAndValue title={'Particles'}>
        <Stack direction={'row'} gap={2}>
          <img src={`${prefix}etc/Particle.png`}
               alt="particle-icon" style={{ objectFit: 'contain' }}/>
          <Typography>{commaNotation(Math.floor(particles))}</Typography>
        </Stack>
      </CardTitleAndValue>
      <CardTitleAndValue title={'Stamp Reducer'}>
        <Stack direction={'row'} gap={1}>
          <img src={`${prefix}data/Atom0.png`}
               alt="reducer-icon" style={{ objectFit: 'contain', width: 45 }}/>
          <Typography>{stampReducer}%</Typography>
        </Stack>
      </CardTitleAndValue>
    </Stack>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
      {atoms?.map(({
                     name,
                     desc,
                     level,
                     rawName,
                     baseBonus,
                     cost,
                     nextLeveCost,
                     costToMax,
                     bonus,
                     maxLevel
                   }) => {
        const description = cleanUnderscore(desc)
          .replace(/{/g, `${baseBonus * level}`)
          .replace(/[>}]/, notateNumber(bonus, 'Big'))
          .replace('<', level);
        const timeLeft = (cost - particles) / totals?.atom?.atoms * 3600 * 1000
        return (
          (<Card key={rawName} sx={{
            outline: level >= maxLevel ? '1px solid' : '',
            outlineColor: (theme) => level >= maxLevel
              ? theme.palette.success.light
              : ''
          }}>
            <CardContent sx={{ width: 250, height: '100%' }}>
              <Stack direction={'column'} sx={{ height: '100%' }}>
                <Stack direction={'row'} alignItems={'center'} gap={1}>
                  <img src={`${prefix}data/${rawName}.png`}
                       alt="atom-icon" width={64} height={64} style={{ objectFit: 'contain' }}/>
                  <Stack>
                    <Typography>{cleanUnderscore(name)}</Typography>
                    <Typography>Lv. {level} / {maxLevel}</Typography>
                  </Stack>
                </Stack>
                {level < maxLevel ? <>
                  <Divider sx={{ my: 2 }}/>
                  <Typography variant={'caption'}>Cost: {notateNumber(cost, 'Big')}</Typography>
                  <Typography variant={'caption'}>Next Level Cost: {notateNumber(nextLeveCost, 'Big')}</Typography>
                  <Typography variant={'caption'}>Cost To Max: {notateNumber(costToMax, 'Big')}</Typography>
                </> : null}
                {level < maxLevel && totals?.atom?.atoms > 0 ? <>
                  <Divider sx={{ my: 2 }}/>
                  <Typography variant={'caption'}>Next level: <Timer type={'countdown'}
                                                                     staticTime
                                                                     placeholder={<Typography color={'success.light'}>Ready!</Typography>}
                                                                     date={new Date().getTime() + timeLeft}
                                                                     lastUpdated={state?.lastUpdated}/></Typography>
                </> : null}
                <Divider sx={{ my: 2 }}/>
                <Typography sx={{ mb: 2 }} variant={'body1'} component={'div'}>
                  {processString([{
                    regex: /Total bonus.*/,
                    fn: (key, result) => {
                      return <div key={key} style={{ marginTop: 15 }}>{result[0]}</div>
                    }
                  }])(description)}
                </Typography>
              </Stack>
            </CardContent>
          </Card>)
        );
      })}
    </Stack>
  </>;
};

export default AtomCollider;
