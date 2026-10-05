import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { Box, Card, CardContent, Checkbox, FormControlLabel, Stack, Typography } from '@mui/material';
import { NextSeo } from 'next-seo';
import { useLocalStorage } from '@mantine/hooks';
import Tabber from '@components/common/Tabber';
import { PAGES } from '@components/constants';
import { cleanUnderscore, getTabs, prefix } from '@utility/helpers';
import { CardTitleAndValue } from '@components/common/styles';
import Timer from '@components/common/Timer';
import { CardWithBreakdown } from '@components/account/Worlds/World5/Hole/commons';

const formatDescription = (bonus, description) => cleanUnderscore(description?.replace('{', bonus?.bonus.toFixed(3)).replace('}', (1 + bonus?.bonus / 100).toFixed(3)));

const BonusCard = ({ bonus, description, showIcon = true }) => (
  <Card sx={{
    width: 350,
    border: bonus?.selected || bonus?.active ? '1px solid' : '',
    borderColor: bonus?.selected ? 'success.main' : bonus?.active ? 'secondary.main' : ''
  }}>
    <CardContent>
      <Stack direction={'row'} gap={2}>
        {showIcon ? <img style={{ objectFit: 'contain' }} src={`${prefix}data/${bonus?.icon}`} alt=""/> :
          <Box sx={{ width: 26, height: 26 }}></Box>}
        <Stack>
          <Typography>{formatDescription(bonus, description)}</Typography>
          {bonus?.active ? <Typography mt={1}>Voters percent: {bonus?.percent}%</Typography> : null}
        </Stack>
      </Stack>
    </CardContent>
  </Card>
);

const BonusList = ({ bonuses, hideOffRotation, getDescription, showIcon }) => {
  const renderCards = (list) => <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
    {list.map(({ bonus, index }) => <BonusCard key={index} bonus={bonus} description={getDescription(bonus)}
                                               showIcon={showIcon(index)}/>)}
  </Stack>;
  const entries = (bonuses || []).map((bonus, index) => ({ bonus, index }));
  if (!hideOffRotation) return renderCards(entries);

  const current = entries.filter(({ bonus }) => bonus?.selected);
  const candidates = entries.filter(({ bonus }) => bonus?.active)
    .sort((a, b) => (b.bonus?.percent ?? 0) - (a.bonus?.percent ?? 0));
  if (current.length === 0 && candidates.length === 0) {
    return <Typography color={'text.secondary'}>No active vote data</Typography>;
  }
  return <Stack gap={3}>
    {current.length > 0 ? <Stack gap={1.5}>
      <Typography variant={'h6'}>Current bonus</Typography>
      {renderCards(current)}
    </Stack> : null}
    {candidates.length > 0 ? <Stack gap={1.5}>
      <Typography variant={'h6'}>Voting for next week</Typography>
      {renderCards(candidates)}
    </Stack> : null}
  </Stack>;
};

const VoteBallot = () => {
  const { state } = useContext(AppContext);
  const { voteBallot, timeAway } = state?.account || {};
  const [hideOffRotation, setHideOffRotation] = useLocalStorage({ key: 'voteBallot-hideOffRotation', defaultValue: false });
  const bonusTimeLeft = (604800 - (timeAway?.GlobalTime + 197860 - 604800 * Math.floor((timeAway?.GlobalTime + 197860) / 604800))) * 1000;
  const meritocracyTimeLeft = (604800 - (timeAway?.GlobalTime + 543460 - 604800 * Math.floor((timeAway?.GlobalTime + 543460) / 604800))) * 1000;

  const hideToggle = <FormControlLabel
    control={<Checkbox size={'small'} checked={!!hideOffRotation}
                       onChange={(e) => setHideOffRotation(e.target.checked)}/>}
    label={'Hide off-rotation bonuses'}/>;

  const renderBonusTab = () => (
    <>
      <Stack mb={3} direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
        <CardWithBreakdown title={'Bonus multi'} value={`${voteBallot?.voteMulti?.toFixed(3)}x`}
                           breakdown={voteBallot?.voteMultiBreakdown}/>
        <CardTitleAndValue title={'Selected bonus'} value={' '} icon={`data/${voteBallot?.selectedBonus?.icon}`}/>
        <CardTitleAndValue title={'Next week starts in'}
                           value={<Timer type={'countdown'} lastUpdated={state?.lastUpdated}
                                         staticTime
                                         variant={'body2'}
                                         date={new Date().getTime() + (bonusTimeLeft)}/>}/>
        {hideToggle}
      </Stack>
      <BonusList bonuses={voteBallot?.bonuses} hideOffRotation={hideOffRotation}
                 getDescription={(bonus) => bonus?.[0]} showIcon={() => true}/>
    </>
  );

  const renderMeritocracyTab = () => (
    <>
      <Stack mb={3} direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
        <CardWithBreakdown title={'Meritocracy multi'} value={`${voteBallot?.meritocracyMult?.toFixed(3)}x`}
                           breakdown={voteBallot?.meritocracyMultBreakdown}/>
        <CardTitleAndValue title={'Selected meritocracy bonus'} value={' '}
                           icon={`data/${voteBallot?.selectedMeritocracyBonus?.icon}`}/>
        <CardTitleAndValue title={'Next week starts in'}
                           value={<Timer type={'countdown'} lastUpdated={state?.lastUpdated}
                                         staticTime
                                         variant={'body2'}
                                         date={new Date().getTime() + (meritocracyTimeLeft)}/>}/>
        {hideToggle}
      </Stack>
      <BonusList bonuses={voteBallot?.meritocracyBonuses} hideOffRotation={hideOffRotation}
                 getDescription={(bonus) => bonus?.description} showIcon={(index) => index > 0}/>
    </>
  );

  return <>
    <NextSeo
      title="Vote Ballot | Idleon Toolbox"
      description="Track your active vote ballot bonuses and their effects on gameplay in Legends of Idleon"
    />
    <Tabber tabs={getTabs(PAGES.ACCOUNT['world 2'].categories, 'voteBallot')}>
      {renderBonusTab()}
      {renderMeritocracyTab()}
    </Tabber>
  </>;
};
export default VoteBallot;
