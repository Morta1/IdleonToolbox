import React from 'react';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, commaNotation, commaOrBig, notateNumber } from '@utility/helpers';
import { CardTitleAndValue } from '@components/common/styles';
import ProgressBar from '@components/common/ProgressBar';

const formatNumber = (value) => commaOrBig(value, Math.floor);

// Clam Work page 2: the Scurge upgrades, unlocked by Luminous Menagerie unlock 4
const Scurge = ({ scurge }) => {
  if (!scurge) return null;
  const { unlocked, level, exp, expReq, expGain, pointsLeft, upgrades } = scurge;

  return <>
    {!unlocked ? <Typography variant={'body2'} color={'text.secondary'} mb={2}>
      Unlocked from the Luminous Menagerie.
    </Typography> : null}
    <Stack direction={'row'} gap={2} flexWrap={'wrap'} mb={3}>
      <CardTitleAndValue title={'Scurge LV'} value={commaNotation(level ?? 0)} />
      <CardTitleAndValue title={'Scurge EXP'}>
        <Typography component={'div'}>{formatNumber(exp ?? 0)} / {formatNumber(expReq ?? 0)}</Typography>
        {/* The panel draws an EXP bar under the level */}
        <ProgressBar percent={expReq > 0 ? Math.min(100, (exp ?? 0) / expReq * 100) : 0} boxSx={{ mt: .5, minWidth: 140 }}/>
      </CardTitleAndValue>
      <CardTitleAndValue title={'Scurge EXP per kill'} value={formatNumber(expGain ?? 0)} />
      <CardTitleAndValue title={'Points left'} value={notateNumber(Math.max(0, pointsLeft ?? 0), 'Big')} />
    </Stack>
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 2 }}>
      {upgrades?.map((upgrade) => {
        const isAvailable = unlocked && upgrade.unlocked;
        return <Card key={upgrade.name || upgrade.index} variant={'outlined'} sx={{ opacity: isAvailable ? 1 : 0.6 }}>
          <CardContent>
            <Stack gap={1.5}>
              <Stack>
                <Typography variant={'subtitle1'} fontWeight={500}>{cleanUnderscore(upgrade.name)}</Typography>
                <Typography variant={'body2'} color={'text.secondary'}>
                  Level: {upgrade.level}
                </Typography>
              </Stack>
              {upgrade.description ? <Typography variant={'body2'} color={'text.secondary'}>
                {cleanUnderscore(upgrade.description).replace(/@/g, '')}
              </Typography> : null}
              <Stack direction={'row'} justifyContent={'space-between'}>
                <Stack>
                  <Typography variant={'caption'} color={'text.secondary'}>Cost:</Typography>
                  <Typography variant={'body2'}>{commaNotation(upgrade.cost)} point</Typography>
                </Stack>
                {upgrade.levelReq > 0 ? <Stack>
                  <Typography variant={'caption'} color={'text.secondary'}>Requires Scurge LV:</Typography>
                  <Typography variant={'body2'}
                              color={upgrade.unlocked ? 'text.primary' : 'error.light'}>{commaNotation(upgrade.levelReq)}</Typography>
                </Stack> : null}
              </Stack>
            </Stack>
          </CardContent>
        </Card>;
      })}
    </Box>
  </>;
};

export default Scurge;
