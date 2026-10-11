import React, { useContext } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import {
  DEATH_NOTE_RANKS,
  ECLIPSE_SKULL_KILLS,
  ECLIPSE_SKULL_RANK,
  getDeathNoteRank,
  MINI_BOSS_DEATH_NOTE_RANKS
} from '@parsers/world-3/deathNote';
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
        description="Track your Death Note monster kill counts, multikill progress, and world completion in Legends of Idleon"
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
              <Typography variant={'h5'}
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

// The skull icon of each rank step: StatusSkull0 for the first rank up to StatusSkull6 for the last
const RankLegend = ({ ranks, children }) => {
  return <Stack gap={1}>
    {ranks.map(([kills, points], index) => <LegendItem key={kills} number={kills} points={points}
                                                         icon={`data/StatusSkull${index}`}/>)}
    {children}
  </Stack>
}

const LegendTooltip = () => {
  return <RankLegend ranks={DEATH_NOTE_RANKS}>
    <LegendItem number={ECLIPSE_SKULL_KILLS} points={ECLIPSE_SKULL_RANK} icon={'etc/EclipseSkull'}/>
  </RankLegend>
}

const MinibossLegendTooltip = () => {
  return <RankLegend ranks={MINI_BOSS_DEATH_NOTE_RANKS}/>
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