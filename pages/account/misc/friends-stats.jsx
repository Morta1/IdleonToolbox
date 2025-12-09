import React, { useContext } from 'react';
import { NextSeo } from 'next-seo';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { AppContext } from '@components/common/context/AppProvider';
import { CardTitleAndValue } from '@components/common/styles';

const FriendsStats = () => {
  const { state } = useContext(AppContext);
  const { friendBonusStats } = state?.account || {};
  const { bonuses = [], slots, multiplier } = friendBonusStats || {};

  return (
    <>
      <NextSeo
        title="Friends Stats | Idleon Toolbox"
        description="View all friend bonuses"
      />
      <Stack gap={2}>
        <Stack direction={'row'} flexWrap={'wrap'} gap={3} alignItems="center">
          <CardTitleAndValue
            title={'Slots'}
            value={`${slots}`}
          />
          <CardTitleAndValue
            title={'Multiplier'}
            value={`${multiplier?.toFixed?.(2) ?? 0}x`}
          />
        </Stack>
        <Stack direction="row" flexWrap="wrap" gap={2}>
          {bonuses?.map((bonus, index) => (
            <Card key={`friend-bonus-${bonus?.statIndex ?? index}`} sx={{ minWidth: 220 }}>
              <CardContent>
                <Typography variant="subtitle1">{(bonus?.value ?? 0).toFixed(2)}{bonus?.name || 'Bonus'}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Friend: {bonus?.friendName || '-'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Level: {bonus?.level ?? 0}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Stack>
    </>
  );
};

export default FriendsStats;

