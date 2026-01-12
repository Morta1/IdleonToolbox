import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { NextSeo } from 'next-seo';
import Tabber from '@components/common/Tabber';
import { PAGES } from '@components/constants';
import { cleanUnderscore, getTabs, prefix } from '@utility/helpers';
import { CardTitleAndValue } from '@components/common/styles';
import Timer from '@components/common/Timer';

const VoteBallot = () => {
  const { state } = useContext(AppContext);
  const { voteBallot, timeAway } = state?.account || {};
  const bonusTimeLeft = (604800 - (timeAway?.GlobalTime + 197860 - 604800 * Math.floor((timeAway?.GlobalTime + 197860) / 604800))) * 1000;
  const meritocracyTimeLeft = (604800 - (timeAway?.GlobalTime + 543460 - 604800 * Math.floor((timeAway?.GlobalTime + 543460) / 604800))) * 1000;

  const renderBonusTab = () => (
    <>
      <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
        <CardTitleAndValue title={'Bonus multi'} value={`${voteBallot?.voteMulti?.toFixed(3)}x`}/>
        <CardTitleAndValue title={'Selected bonus'} value={' '} icon={`data/${voteBallot?.selectedBonus?.icon}`}/>
        <CardTitleAndValue title={'Next week starts in'}
                           value={<Timer type={'countdown'} lastUpdated={state?.lastUpdated}
                                         staticTime
                                         variant={'body2'}
                                         date={new Date().getTime() + (bonusTimeLeft)}/>}/>
      </Stack>
      <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
        {voteBallot?.bonuses?.map((bonus, index) => {
          return <Card key={index} sx={{
            width: 350,
            border: bonus?.selected || bonus?.active ? '1px solid' : '',
            borderColor: bonus?.selected ? 'success.main' : bonus?.active ? 'secondary.main' : ''
          }}>
            <CardContent>
              <Stack direction={'row'} gap={2}>
                <img style={{ objectFit: 'contain' }} src={`${prefix}data/${bonus?.icon}`} alt={''}/>
                <Stack>
                  <Typography>{cleanUnderscore(bonus?.[0].replace('{', bonus?.bonus.toFixed(3)).replace('}', (1 + bonus?.bonus / 100).toFixed(3)))}</Typography>
                  {bonus?.active ? <Typography mt={1}>Voters percent: {bonus?.percent}%</Typography> : null}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        })}
      </Stack>
    </>
  );

  const renderMeritocracyTab = () => (
    <>
      <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
        <CardTitleAndValue title={'Meritocracy multi'} value={`${voteBallot?.meritocracyMult?.toFixed(3)}x`}/>
        <CardTitleAndValue title={'Selected meritocracy bonus'} value={' '}
                           icon={`data/${voteBallot?.selectedMeritocracyBonus?.icon}`}/>
        <CardTitleAndValue title={'Next week starts in'}
                           value={<Timer type={'countdown'} lastUpdated={state?.lastUpdated}
                                         staticTime
                                         variant={'body2'}
                                         date={new Date().getTime() + (meritocracyTimeLeft)}/>}/>
      </Stack>
      <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
        {voteBallot?.meritocracyBonuses?.map((bonus, index) => {
          return <Card key={index} sx={{
            width: 350,
            border: bonus?.selected || bonus?.active ? '1px solid' : '',
            borderColor: bonus?.selected ? 'success.main' : bonus?.active ? 'secondary.main' : ''
          }}>
            <CardContent>
              <Stack direction={'row'} gap={2}>
                {index > 0 ? <img style={{ objectFit: 'contain' }} src={`${prefix}data/${bonus?.icon}`} alt={''}/> :
                  <Box sx={{ width: 26, height: 26 }}></Box>}
                <Stack>
                  <Typography>{cleanUnderscore(bonus?.description?.replace('{', bonus?.bonus.toFixed(3)).replace('}', (1 + bonus?.bonus / 100).toFixed(3)))}</Typography>
                  {bonus?.active ? <Typography mt={1}>Voters percent: {bonus?.percent}%</Typography> : null}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        })}
      </Stack>
    </>
  );

  return <>
    <NextSeo
      title="Vote Ballot | Idleon Toolbox"
      description="Keep track of the vote bonuses"
    />
    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 2'].categories, 'voteBallot')}>
      {renderBonusTab()}
      {renderMeritocracyTab()}
    </Tabber>
  </>;
};
export default VoteBallot;
