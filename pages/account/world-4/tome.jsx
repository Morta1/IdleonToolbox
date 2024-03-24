import React, { useContext } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { Stack, Typography } from '@mui/material';
import { cleanUnderscore } from '@utility/helpers';

const Tome = () => {
  const { state } = useContext(AppContext);

  return <>
    <NextSeo
      title="Tome | Idleon Toolbox"
      description="Keep track of your tome bonuses and highscores"
    />
    <Typography variant={'h2'} textAlign={'center'} mb={3}>Tome</Typography>

    <Stack gap={2}>
      {state?.account?.tome?.map(({ name, info, tomeLvReq }, index) => {
        return <div key={index}>
          <Typography>{cleanUnderscore(name)}</Typography>
          {/*<Typography>{index}</Typography>*/}
        </div>
      })}
    </Stack>
  </>
};

export default Tome;
