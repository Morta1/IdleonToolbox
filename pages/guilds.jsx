import React, { useContext } from 'react';
import { Box, Link, Stack, TextField, Typography } from '@mui/material';
import { NextSeo } from 'next-seo';
import ErrorIcon from '@mui/icons-material/Error';
import { isValid } from 'date-fns';
import useFormatDate from '@hooks/useFormatDate';
import { useGlobalSnapshots, useGuildIndex } from '@hooks/useGuildHistory';
import { useRouter } from 'next/router';
import CurationStrip from '@components/guilds/CurationStrip';
import GuildTable from '@components/guilds/GuildTable';
import SimpleLoader from '@components/common/SimpleLoader';
import { usePinnedGuilds } from '@hooks/usePinnedGuilds';
import { useGuildListView } from '@hooks/useGuildListView';
import { useHoistedGuilds } from '@hooks/useHoistedGuilds';
import { AppContext } from '@components/common/context/AppProvider';

const ROWS_PER_PAGE = 25;

const Guilds = () => {
  const formatDate = useFormatDate();
  const router = useRouter();
  const { state } = useContext(AppContext);
  const { data, isLoading, error: queryError } = useGuildIndex();
  const { data: globalSnapshotData } = useGlobalSnapshots();
  const guilds = data?.guilds || null;
  const snapshotDate = data?.captured_at ?? null;
  const error = queryError ? 'An unexpected error has occurred' : '';

  const { pinnedGuilds, isPinned, togglePin } = usePinnedGuilds();

  const {
    query, onQueryChange,
    sortBy, sortDir, onSort,
    page, onPageChange,
    filteredGuilds, pagedGuilds
  } = useGuildListView(guilds, ROWS_PER_PAGE);

  // Scale banner: prefer actual tracked guild count; fall back to global snapshot total_guilds.
  const trackedCount = guilds?.length ?? null;
  const totalGuilds = globalSnapshotData?.snapshots?.[0]?.total_guilds ?? null;

  const { hoistedRows, showHoistedSection } = useHoistedGuilds({
    guilds,
    pinnedGuilds,
    myGuildId: state?.account?.guild?.id || null
  });

  return <Box sx={{ maxWidth: 980 }}>
    <NextSeo
      title="Guilds | Idleon Toolbox"
      description="Browse the top Legends of Idleon guilds ranked by guild points, with member details, levels, and leadership info"
    />
    {isLoading ? (
      <SimpleLoader message="Gathering guild info..."/>
    ) : error ? (
      <Stack sx={{ my: 3 }} direction={'row'} alignItems={'center'} justifyContent={'center'} gap={2}>
        <ErrorIcon/>
        <Typography variant={'h6'}>{error}</Typography>
      </Stack>
    ) : (
      <>
        <Stack direction="row" alignItems="center" gap={2} sx={{ mb: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search guild by name"
            value={query}
            onChange={onQueryChange}
            sx={{ width: 280 }}
          />
          <Stack direction="row" alignItems="center" gap={1} sx={{ flexWrap: 'wrap' }}>
            <Typography variant="caption" color="text.secondary">
              {trackedCount != null && totalGuilds != null
                ? `Top ${trackedCount.toLocaleString()} of ~${totalGuilds.toLocaleString()} · `
                : ''}
              {guilds && isValid(snapshotDate)
                ? `Updated ${formatDate(snapshotDate, { showSeconds: false })} · hourly`
                : 'Updated hourly'}
            </Typography>
            {trackedCount != null && totalGuilds != null && (
              <Link
                component="button"
                variant="caption"
                onClick={() => router.push('/guilds/ecosystem')}
                sx={{ verticalAlign: 'baseline', cursor: 'pointer' }}
              >
                Ecosystem stats →
              </Link>
            )}
          </Stack>
        </Stack>
        <CurationStrip guilds={guilds} router={router}/>
        <GuildTable
          pagedGuilds={pagedGuilds}
          hoistedRows={hoistedRows}
          showHoistedSection={showHoistedSection}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={onSort}
          isPinned={isPinned}
          onTogglePin={togglePin}
          filteredCount={filteredGuilds?.length ?? 0}
          page={page}
          onPageChange={onPageChange}
          rowsPerPage={ROWS_PER_PAGE}
          router={router}
        />
      </>
    )}
  </Box>
};

export default Guilds;
