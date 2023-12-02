import React, { useContext, useMemo } from 'react';
import { AppContext } from '../../../components/common/context/AppProvider';
import { Box, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from '../../../utility/helpers';
import processString from 'react-process-string';
import { NextSeo } from 'next-seo';
import { calcTotals } from '../../../parsers/printer';
import Timer from '../../../components/common/Timer';
import { CardTitleAndValue } from '../../../components/common/styles';

const MAX_ATOMS = 11;

const AtomCollider = ({}) => {
  const { state } = useContext(AppContext);
  const { atoms, particles, stampReducer } = state?.account?.atoms || {};
  const totals = useMemo(() => calcTotals(state?.account), [state?.account]);
  return <>
    <NextSeo
      title="Idleon Toolbox | Atom Collider"
      description="Atom Collider bonuses and progression"
    />
    <Typography variant={'h2'} textAlign={'center'} mb={3}>Atoms</Typography>
    <Stack direction={'row'} gap={2}>
      <CardTitleAndValue title={'Particles'}>
        <Stack direction={'row'} gap={2}>
          <img src={`${prefix}etc/Particle.png`}
               alt="" style={{ objectFit: 'contain' }}/>
          <Typography>{Math.floor(particles)}</Typography>
        </Stack>
      </CardTitleAndValue>
      <CardTitleAndValue title={'Stamp reducer'}>
        <Stack direction={'row'} gap={1}>
          <img src={`${prefix}data/Atom0.png`}
               alt="" style={{ objectFit: 'contain', width: 45 }}/>
          <Typography>{stampReducer}%</Typography>
        </Stack>
      </CardTitleAndValue>
    </Stack>
    <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
      {atoms?.map(({ name, desc, level, rawName, baseBonus, cost, nextLeveCost, costToMax, bonus, maxLevel }, index) => {
        if (index >= MAX_ATOMS) return;
        const description = cleanUnderscore(desc)
          .replace(/{/g, `${baseBonus * level}`)
          .replace(/[>}]/, notateNumber(bonus, 'Big'))
          .replace('<', level);
        const timeLeft = ((cost - particles) / totals?.atom?.atoms) * 3600 * 1000
        return <Card key={rawName}>
          <CardContent sx={{ width: 250, height: '100%' }}>
            <Stack direction={'column'} sx={{ height: '100%' }}>
              <Stack direction={'row'} alignItems={'center'} gap={1}>
                <img src={`${prefix}data/${rawName}.png`}
                     alt="" width={64} height={64} style={{ objectFit: 'contain' }}/>
                <Stack>
                  <Typography>{cleanUnderscore(name)}</Typography>
                  <Typography>Lv. {level} / {maxLevel}</Typography>
                  {level < maxLevel ? <>
                    <Typography variant={'caption'}>Cost: {notateNumber(cost, 'Big')}</Typography>
                    <Typography variant={'caption'}>Next level cost: {notateNumber(nextLeveCost, 'Big')}</Typography>
                    <Typography variant={'caption'}>Cost to max: {notateNumber(costToMax, 'Big')}</Typography>
                  </> : null}
                </Stack>
              </Stack>
              <Divider sx={{ my: 2 }}/>
              <Typography sx={{ mb: 2 }} variant={'body1'} component={'div'}>
                {processString([{
                  regex: /Total bonus.*/,
                  fn: (key, result) => {
                    return <div key={key} style={{ marginTop: 15 }}>{result[0]}</div>
                  }
                }])(description)}
              </Typography>
              {level < maxLevel && totals?.atom?.atoms > 0 ? <Box sx={{ marginTop: 'auto' }}>
                <Timer type={'countdown'}
                       placeholder={<Typography color={'success.light'}>Ready!</Typography>}
                       date={new Date().getTime() + timeLeft}
                       lastUpdated={state?.lastUpdated}/>
              </Box> : null}
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>
};

export default AtomCollider;
