import React, { useContext } from 'react';
import { AppContext } from 'components/common/context/AppProvider';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { cleanUnderscore, getCoinsArray } from 'utility/helpers';
import CoinDisplay from 'components/common/CoinDisplay';
import { NextSeo } from 'next-seo';
import AutoGrid from '@components/common/AutoGrid';

const Bribes = () => {
  const { state } = useContext(AppContext);

  return (
    <>
      <NextSeo
        title="Bribes | Idleon Toolbox"
        description="Keep track of your bribes status"
      />
      <AutoGrid>
        {state?.account?.bribes?.map((bribe, index) => {
          const { name, desc, price, done, value } = bribe;
          const money = getCoinsArray(price);
          return (
            <Card sx={{
              width: 300,
              border: done ? '1px solid' : '',
              borderColor: done ? 'success.light' : ''
            }} key={'bribe-' + index}>
              <CardContent>
                <Stack>
                  <Typography variant="body1">{cleanUnderscore(name)}</Typography>
                  <Typography variant="body1"
                              component={'span'}>
                    {index === 0 ? cleanUnderscore(desc).replace('5%', `${value}%`) : cleanUnderscore(desc)}
                  </Typography>
                </Stack>
                {!done ? <CoinDisplay title={''} money={money}/> : null}
              </CardContent>
            </Card>
          );
        })}
      </AutoGrid>
    </>
  );
};

export default Bribes;
