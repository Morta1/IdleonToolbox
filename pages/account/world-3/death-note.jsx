import React, { useContext } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { getDeathNoteRank } from 'parsers/deathNote';
import { cleanUnderscore, notateNumber, numberWithCommas, prefix, worldColor, worlds } from 'utility/helpers';
import Box from '@mui/material/Box';
import { NextSeo } from 'next-seo';
import { CardTitleAndValue } from '@components/common/styles';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import Tooltip from '@components/Tooltip';

const DeathNote = () => {
  const { state } = useContext(AppContext);
  const { deathNote } = state?.account || { deathNote: {} };

  return (
    <>
      <NextSeo
        title="Death Note | Idleon Toolbox"
        description="Keep track of death note progression"
      />
      <Stack direction={'row'} alignItems={'center'} gap={2} mb={2}>
        <CardTitleAndValue title={'Normal Monsters'}>
          <Stack direction={'row'} alignItems={'center'} gap={1}>
            <Typography>Legend</Typography>
            <Tooltip title={<LegendTooltip/>}>
              <IconInfoCircleFilled size={18}/>
            </Tooltip>
          </Stack>
        </CardTitleAndValue>
        <CardTitleAndValue title={'Minibosses'}>
          <Stack direction={'row'} alignItems={'center'} gap={1}>
            <Typography>Legend</Typography>
            <Tooltip title={<MinibossLegendTooltip/>}>
              <IconInfoCircleFilled size={18}/>
            </Tooltip>
          </Stack>
        </CardTitleAndValue>
      </Stack>

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

const LegendTooltip = () => {
  return <Stack gap={1}>
    <LegendItem number={25_000} points={1} icon={`data/StatusSkull${0}`}/>
    <LegendItem number={100_000} points={2} icon={`data/StatusSkull${1}`}/>
    <LegendItem number={250_00} points={3} icon={`data/StatusSkull${2}`}/>
    <LegendItem number={500_000} points={4} icon={`data/StatusSkull${3}`}/>
    <LegendItem number={1e6} points={2} icon={`data/StatusSkull${4}`}/>
    <LegendItem number={5e6} points={7} icon={`data/StatusSkull${5}`}/>
    <LegendItem number={100e6} points={10} icon={`data/StatusSkull${6}`}/>
    <LegendItem number={1e9} points={20} icon={'etc/EclipseSkull'}/>
  </Stack>
}

const MinibossLegendTooltip = () => {
  return <Stack gap={1}>
    <LegendItem number={100} points={1} icon={`data/StatusSkull${0}`}/>
    <LegendItem number={250} points={2} icon={`data/StatusSkull${1}`}/>
    <LegendItem number={1000} points={3} icon={`data/StatusSkull${2}`}/>
    <LegendItem number={5000} points={4} icon={`data/StatusSkull${3}`}/>
    <LegendItem number={25000} points={5} icon={`data/StatusSkull${4}`}/>
    <LegendItem number={100000} points={7} icon={`data/StatusSkull${5}`}/>
    <LegendItem number={1e7} points={10} icon={`data/StatusSkull${6}`}/>
  </Stack>
}

const LegendItem = ({ number, points, icon }) => {
  return <Stack direction={'row'} alignItems={'center'}>
    <img style={{ marginTop: -10 }} src={`${prefix}${icon}.png`} alt="skull-icon"/>
    <Typography variant={'body1'} sx={{ mx: 1 }}>{numberWithCommas(number)}</Typography>
    <Typography variant={'body1'} sx={{ whiteSpace: 'no-wrap' }}>{points > 1
      ? `= ${points} points`
      : `= ${points} point`}</Typography>
  </Stack>
}

export default DeathNote;