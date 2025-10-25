import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { NextSeo } from 'next-seo';
import { cleanUnderscore, prefix } from '@utility/helpers';
import { CardTitleAndValue } from '@components/common/styles';

const VoteBallot = () => {
  const { state } = useContext(AppContext);
  const { voteBallot } = state?.account || {};

  return <>
    <NextSeo
      title="Vote Ballot | Idleon Toolbox"
      description="Keep track of the vote bonuses"
    />
    <Stack direction={'row'} gap={2} flexWrap={'wrap'}>
      <CardTitleAndValue title={'Bonus multi'} value={`${voteBallot?.voteMulti?.toFixed(3)}x`} />
      <CardTitleAndValue title={'Selected bonus'} value={' '} icon={`data/${voteBallot?.selectedBonus?.icon}`} />
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
              <img style={{ objectFit: 'contain' }} src={`${prefix}data/${bonus?.icon}`} alt={''} />
              <Stack>
                <Typography>{cleanUnderscore(bonus?.[0].replace('{', bonus?.bonus.toFixed(3)).replace('}', (1 + bonus?.bonus / 100).toFixed(3)))}</Typography>
                {bonus?.active ? <Typography mt={1}>Voters percent: {bonus?.percent}%</Typography> : null}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      })}
    </Stack>
  </>;
};
export default VoteBallot;
