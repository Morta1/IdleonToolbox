import React, { useContext } from 'react';
import { AppContext } from '../../../components/common/context/AppProvider';
import { getRandomEvents } from '../../../parsers/misc';
import { Card, CardContent, Stack } from '@mui/material';
import RandomEvent from '../../../components/account/Misc/RandomEvent';
import { NextSeo } from 'next-seo';

const RandomEvents = () => {
  const { state } = useContext(AppContext);

  const events = getRandomEvents(state?.account);

  return <>
    <NextSeo
      title="Random Events | Idleon Toolbox"
      description="See upcoming random events"
    />
    {events?.length ? <>
      <Stack direction={'row'} flexWrap={'wrap'} gap={2}>
        {events?.map((event, index) => {
          return <Card key={'events' + index} sx={{ width: 250 }}>
            <CardContent>
              <RandomEvent {...event} />
            </CardContent>
          </Card>
        })}
      </Stack>
    </> : <div>There is no random event data</div>}
  </>;
}

export default RandomEvents;
