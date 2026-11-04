import React, { useContext } from 'react';
import { AppContext } from '../../../components/common/context/AppProvider';
import { getRandomEvents } from '../../../parsers/misc';
import { Typography } from '@mui/material';
import { isValid } from 'date-fns';
import { NextSeo } from 'next-seo';
import { cleanUnderscore } from '@utility/helpers';
import useFormatDate from '@hooks/useFormatDate';
import Notice from '@components/common/Notice';
import { MissingData } from '@components/common/styles';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';

const RandomEvents = () => {
  const { state } = useContext(AppContext);
  const formatDate = useFormatDate();
  const events = getRandomEvents(state?.account);
  const saveTime = state?.account?.timeAway?.GlobalTime;
  // The list reads the save's clock, not a section: only a whole-parse failure leaves it nothing to read
  const parseFailed = state?.account?.failedSections?.includes('*');

  return <>
    <NextSeo
      title="Random Events | Idleon Toolbox"
      description="Check upcoming random event schedules and rewards for Legends of Idleon"
    />
    {parseFailed ? <MissingData name={'your save'} failed/> : state?.emptyAccount
      ? <Notice tone={'signin'}>The next random events show here once you sign in.</Notice>
      // The schedule starts at the save's own clock, so a save older than its 100 hours lists nothing
      : !events?.length
        ? <Notice>{Number.isFinite(saveTime)
          ? `Your save is from ${formatDate(saveTime * 1000, { showSeconds: false })}, so its next 100 hours of events have passed. Open the game to refresh your save.`
          : 'No random event is on the way in the next 100 hours.'}</Notice>
        : <>
          <Typography variant={'body2'} color={'text.secondary'} sx={{ mb: 2 }}>
            Times shown are when events spawn, in your local timezone.
          </Typography>
          <CardGrid size={'s'}>
            {events.map((event, index) => <ItemCard key={`event-${index}`} icon={`etc/${event?.eventName}.png`}
                                                    title={cleanUnderscore(event?.eventName)} meta={cleanUnderscore(event?.mapName)}>
              {isValid(event?.date) ? <ItemCard.Facts rows={[['Starts', formatDate(event.date)]]}/> : null}
            </ItemCard>)}
          </CardGrid>
        </>}
  </>;
}

export default RandomEvents;
