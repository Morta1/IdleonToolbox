import React, { useContext } from 'react';
import { Box, Link, Stack, Typography } from '@mui/material';
import { NextSeo } from 'next-seo';
import { isToday, isValid } from 'date-fns';
import useFormatDate from '@hooks/useFormatDate';
import { useGlobalSnapshots, useGuildIndex } from '@hooks/useGuildHistory';
import { useRouter } from 'next/router';
import NextLink from 'next/link';
import { biggestClimber, closestGap, nextWeeklyReset } from '@components/guilds/CurationStrip';
import GuildTable, { GuildLink } from '@components/guilds/GuildTable';
import { rankText, showsFailure } from '@components/leaderboards/format';
import Notice, { retryAction } from '@components/common/Notice';
import PageSummary from '@components/common/cards/PageSummary';
import StatTile from '@components/common/cards/StatTile';
import SimpleLoader from '@components/common/SimpleLoader';
import Timer from '@components/common/Timer';
import Toolbar from '@components/common/Toolbar';
import { usePinnedGuilds } from '@hooks/usePinnedGuilds';
import { useGuildListView } from '@hooks/useGuildListView';
import { useHoistedGuilds } from '@hooks/useHoistedGuilds';
import { AppContext } from '@components/common/context/AppProvider';
import { formatNum } from '@utility/helpers';

// The numbers above the table, once the list has arrived: the week's end reads the visitor's clock.
const GuildSummary = ({ guilds, totalGuilds, router }) => {
  const formatDate = useFormatDate();
  const climber = biggestClimber(guilds);
  const gap = closestGap(guilds);
  const weekEndsAt = nextWeeklyReset();
  return <PageSummary label={'Guilds'}>
    <StatTile label={'Guilds tracked'} value={formatNum(guilds.length, 'whole')}
              sub={totalGuilds != null ? `of about ${formatNum(totalGuilds, 'whole')}` : undefined}/>
    <StatTile label={'Week ends in'} value={<Timer type={'countdown'} date={weekEndsAt} placeholder={'Now'}/>}
              sub={`Resets ${formatDate(weekEndsAt, { showSeconds: false })}`}/>
    {climber ? <StatTile label={'Biggest climber'} value={<GuildLink guild={climber} router={router}/>}
                         sub={`+${formatNum(Math.abs(climber.rank_delta_2w), 'whole')} ranks in 2 weeks, now ${rankText(climber.rank)}`}/> : null}
    {gap ? <StatTile label={'Closest gap'}
                     value={<><GuildLink guild={gap.leader} router={router}/> and <GuildLink guild={gap.challenger} router={router}/></>}
                     sub={`${formatNum(gap.gap, 'amount')} GP apart in the top 25`}/> : null}
  </PageSummary>;
};

const Guilds = () => {
  const formatDate = useFormatDate();
  const router = useRouter();
  const { state } = useContext(AppContext);
  const index = useGuildIndex();
  const { data: globalSnapshotData, isError: snapshotsFailed } = useGlobalSnapshots();
  // A reply that isn't a list reads as an empty one.
  const guilds = Array.isArray(index.data?.guilds) ? index.data.guilds : null;
  const snapshotDate = index.data?.captured_at ?? null;

  const { pinnedGuilds, isPinned, togglePin } = usePinnedGuilds();

  const { query, setQuery, filteredGuilds } = useGuildListView(guilds);

  const totalGuilds = globalSnapshotData?.snapshots?.[0]?.total_guilds ?? null;

  const { hoistedRows, showHoistedSection } = useHoistedGuilds({
    guilds,
    pinnedGuilds,
    myGuildId: state?.account?.guild?.id || null
  });
  // Rendered in every branch: when it sat below the early return the page had no title at all
  // while the guild list was still loading.
  const seo = <NextSeo
    title="Guilds | Idleon Toolbox"
    description="Browse the top Legends of Idleon guilds ranked by guild points, with member details, levels, and leadership info"
  />;

  if (showsFailure(index)) {
    return <>
      {seo}
      <Notice key={index.errorUpdateCount} tone={'error'} action={retryAction(() => index.refetch(), index.isFetching)}>Couldn't load the guild list.</Notice>
    </>;
  }
  if (index.isLoading) return <>{seo}<SimpleLoader message="Loading guilds..."/></>;
  if (!guilds?.length) return <>{seo}<Notice tone={'info'}>No guilds are tracked yet. The list fills in hourly.</Notice></>;
  return <Box>
    {seo}
    <GuildSummary guilds={guilds} totalGuilds={totalGuilds} router={router}/>
    <Stack direction={'row'} alignItems={'center'} columnGap={1.5} flexWrap={'wrap'} sx={{ mt: -2, mb: 2 }}>
      <Typography variant={'caption'} color={'text.secondary'}>
        {isValid(snapshotDate)
          ? `Updated hourly, last ${isToday(snapshotDate)
            ? `at ${formatDate(snapshotDate, { timeOnly: true, showSeconds: false })}`
            : `on ${formatDate(snapshotDate, { showSeconds: false })}`}`
          : 'Updated hourly'}
      </Typography>
      {snapshotsFailed ? <Typography variant={'caption'} color={'text.secondary'}>Ecosystem numbers didn't load.</Typography> : null}
      <Link component={NextLink} href={'/guilds/ecosystem'} variant={'caption'} sx={{ verticalAlign: 'baseline' }}>Ecosystem stats</Link>
    </Stack>
    <Toolbar state={{ search: query }} defaults={{ search: '' }} onChange={({ search }) => setQuery(search ?? '')} onReset={() => setQuery('')}
             total={guilds.length} shown={filteredGuilds?.length ?? 0} noun={'guilds'}>
      <Toolbar.Search placeholder={'Search guilds by name'}/>
    </Toolbar>
    <GuildTable
      guilds={filteredGuilds ?? []}
      hoistedRows={hoistedRows}
      showHoistedSection={showHoistedSection}
      isPinned={isPinned}
      onTogglePin={togglePin}
      router={router}
    />
  </Box>;
};

export default Guilds;
