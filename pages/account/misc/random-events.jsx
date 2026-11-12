import React, { useContext } from 'react';
import { AppContext } from '../../../components/common/context/AppProvider';
import { getRandomEventCatalog, getRandomEvents } from '../../../parsers/misc';
import { Stack, Typography } from '@mui/material';
import { isValid } from 'date-fns';
import { NextSeo } from 'next-seo';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import useFormatDate from '@hooks/useFormatDate';
import Notice from '@components/common/Notice';
import { MissingData } from '@components/common/styles';
import CardGrid from '@components/common/cards/CardGrid';
import ItemCard from '@components/common/cards/ItemCard';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import GameIcon from '@components/common/GameIcon';
import Timer from '@components/common/Timer';

const HOUR = 3600 * 1000;

// A rare drop as the event banner draws it: its sprite, dark until found
const dropRow = ({ rawName, name, found }, signedIn) => [
  <Stack key={rawName} component={'span'} direction={'row'} alignItems={'center'} gap={0.75}>
    <GameIcon src={`data/${rawName}.png`} size={24} alt={''} status={signedIn && !found ? 'missing' : undefined}/>
    {cleanUnderscore(name)}
  </Stack>,
  signedIn ? (found ? 'Found' : 'Not found') : ''
];

// "World 1", "Worlds 1 and 2", "Worlds 1 to 3": the worlds an event's map pool covers
const worldsText = (worlds) => {
  if (!worlds?.length) return undefined;
  if (worlds.length === 1) return `Spawns in World ${worlds[0]}`;
  const consecutive = worlds.every((world, index) => index === 0 || world === worlds[index - 1] + 1);
  if (worlds.length === 2) return `Spawns in Worlds ${worlds[0]} and ${worlds[1]}`;
  return consecutive ? `Spawns in Worlds ${worlds[0]} to ${worlds.at(-1)}` : `Spawns in Worlds ${worlds.join(', ')}`;
};

const RandomEvents = () => {
  const { state } = useContext(AppContext);
  const formatDate = useFormatDate();
  const signedIn = Boolean(state?.account) && !state?.emptyAccount;
  // The catalog needs no save, so it draws signed out too; the schedule and the found state are the save's
  const catalog = getRandomEventCatalog(signedIn ? state?.account : undefined);
  const events = signedIn ? getRandomEvents(state?.account) : [];
  // The list reads the server's schedule, not a section: only a whole-parse failure leaves it nothing to read
  const parseFailed = state?.account?.failedSections?.includes('*');
  const drops = catalog.flatMap(({ drops: eventDrops }) => eventDrops);
  const found = drops.filter((drop) => drop.found).length;

  return <>
    <NextSeo
      title="Random Events | Idleon Toolbox"
      description="Check upcoming random event schedules and rewards for Legends of Idleon"
    />
    {parseFailed ? <MissingData name={'your save'} failed/> : null}
    {signedIn ? <PageSummary>
      <StatTile label={'Rare drops found'} value={`${formatNum(found)} / ${formatNum(drops.length)}`}/>
    </PageSummary> : null}
    <Stack gap={3}>
      <Stack gap={1.5}>
        <Typography variant={'sectionTitle'} component={'h2'}>Events</Typography>
        <CardGrid size={'m'}>
          {catalog.map(({ eventType, eventName, drops: eventDrops, worlds }) => <ItemCard
            key={eventType} icon={`etc/${eventName}.png`} title={cleanUnderscore(eventName)}
            meta={worldsText(worlds)}>
            <ItemCard.Section label={'Rare drops'}>
              <ItemCard.Facts rows={eventDrops.map((drop) => dropRow(drop, signedIn))}/>
            </ItemCard.Section>
          </ItemCard>)}
        </CardGrid>
      </Stack>
      <Stack gap={1.5}>
        <Typography variant={'sectionTitle'} component={'h2'}>Next 100 hours</Typography>
        {parseFailed ? null : !signedIn
          ? <Notice tone={'signin'}>The next random events show here once you sign in.</Notice>
          : !events?.length
            ? <Notice>No random event is on the way in the next 100 hours.</Notice>
            : <CardGrid size={'s'}>
              {events.map((event, index) => {
                const live = Boolean(event?.live);
                return <ItemCard key={`event-${index}`} icon={`etc/${event?.eventName}.png`}
                                 title={cleanUnderscore(event?.eventName)} meta={cleanUnderscore(event?.mapName)}
                                 status={live ? 'active' : undefined} statusLabel={'Now'}>
                  {isValid(event?.date) ? <ItemCard.Facts rows={live
                    ? [['Ends in', <Timer key={'ends'} type={'countdown'} date={event.date + HOUR}/>]]
                    : [['Starts', formatDate(event.date, { showSeconds: false })], ['In', <Timer key={'in'} type={'countdown'} date={event.date}/>]]}/> : null}
                </ItemCard>;
              })}
            </CardGrid>}
      </Stack>
    </Stack>
  </>;
};

export default RandomEvents;
