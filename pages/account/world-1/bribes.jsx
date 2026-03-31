import React, { useContext } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { cleanUnderscore, getCoinsArray } from 'utility/helpers';
import CoinDisplay from 'components/common/CoinDisplay';
import { NextSeo } from 'next-seo';
const Bribes = () => {
  const { state } = useContext(AppContext);

  return (
    <>
      <NextSeo
        title="Bribes | Idleon Toolbox"
        description="Track your bribe status, costs, and bonus effects across all Legends of Idleon worlds"
      />
      <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
        {state?.account?.bribes?.map((bribe, index) => {
          const { name, desc, price, done, value } = bribe;
          const money = getCoinsArray(price);
          return (
            <Card sx={{
              width: 250,
              borderLeft: done ? '4px solid' : '4px solid transparent',
              borderColor: done ? 'success.light' : 'transparent',
              opacity: done ? 0.7 : 1,
              display: 'flex',
              flexDirection: 'column'
            }} key={'bribe-' + index}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                <Stack gap={0.5}>
                  <Typography variant="body1" fontWeight="bold">{cleanUnderscore(name)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {index === 0 ? cleanUnderscore(desc).replace('5%', `${value}%`) : cleanUnderscore(desc)}
                  </Typography>
                </Stack>
                <Stack mt={1.5}>
                  {done
                    ? <Chip label="Purchased" size="small" color="success" variant="outlined" sx={{ width: 'fit-content' }}/>
                    : <CoinDisplay title={''} money={money}/>
                  }
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </>
  );
};

export default Bribes;
