import React, { useContext } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { getDeathNoteRank } from 'parsers/deathNote';
import { cleanUnderscore, notateNumber, prefix, worlds } from 'utility/helpers';
import Box from '@mui/material/Box';
import { NextSeo } from 'next-seo';

const worldColor = ['#64b564', '#f1ac45', '#00bcd4', '#864ede', '#de4e4e', '#5FF1B4FF'];

const DeathNote = () => {
  const { state } = useContext(AppContext);
  const { deathNote } = state?.account || { deathNote: {} };

  return (
    <>
      <NextSeo
        title="Death Note | Idleon Toolbox"
        description="Keep track of death note progression"
      />
      <Stack direction={'row'} gap={2} justifyContent={'center'} flexWrap={'wrap'}>
        {Object.entries(deathNote)?.map(([worldIndex, { mobs, rank }], index) => {
          return <Card key={worldIndex + ' ' + index}>
            <CardContent>
              <Typography variant={'h4'}
                          style={{ color: worldColor?.[worldIndex] || '#e987e6' }}>{worlds?.[worldIndex] || 'Minibosses'}</Typography>
              <Typography mb={2} variant={'h6'}>Multikill Bonus: {rank}%</Typography>
              <Stack>
                {mobs?.map((mob, innerIndex) => {
                  const mobRank = getDeathNoteRank(state?.account, mob.kills, worldIndex === 'miniBosses');
                  const iconNumber = mobRank - 1 - Math.floor(mobRank / 7) - 2 * Math.floor(mobRank / 10);
                  let skullName = `data/StatusSkull${iconNumber}`;
                  if (mobRank > 10) {
                    skullName = 'etc/EclipseSkull'
                  }
                  return <Stack sx={{ height: mobRank > 10 ? 30 : 35 }} direction={'row'}
                                alignItems={'baseline'}
                                justifyContent={'space-between'}
                                key={mob?.rawName + ' ' + innerIndex}>
                    <Stack direction={'row'} alignItems={mobRank > 10 ? 'center' : 'baseline'} gap={2}>
                      {iconNumber !== -1 ? <img src={`${prefix}${skullName}.png`} alt="skull-icon"/> :
                        <Box sx={{ height: 25, width: 20 }}/>}
                      <Typography sx={{ width: { xs: 150, sm: 200 } }}>{cleanUnderscore(mob.displayName)}</Typography>
                    </Stack>
                    <Typography>{notateNumber(parseInt(mob.kills), 'Big')}</Typography>
                  </Stack>
                })}
              </Stack>
            </CardContent>
          </Card>
        })}
      </Stack>
    </>
  );
};

export default DeathNote;
