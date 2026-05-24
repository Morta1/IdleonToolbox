import React, { useContext, useState } from 'react';
import {
  Chip,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';
import { NextSeo } from 'next-seo';
import ErrorIcon from '@mui/icons-material/Error';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import { isValid } from 'date-fns';
import useFormatDate from '@hooks/useFormatDate';
import { useGlobalSnapshots, useGuildIndex } from '@hooks/useGuildHistory';
import { useRouter } from 'next/router';
import HeaderWithHint from '@components/guilds/HeaderWithHint';
import GuildRow from '@components/guilds/GuildRow';
import CurationStrip from '@components/guilds/CurationStrip';
import SimpleLoader from '@components/common/SimpleLoader';
import { usePinnedGuilds } from '@hooks/usePinnedGuilds';
import { AppContext } from '../components/common/context/AppProvider';

const ROWS_PER_PAGE = 25;

const Guilds = () => {
  const formatDate = useFormatDate();
  const router = useRouter();
  const muiTheme = useTheme();
  const { state } = useContext(AppContext);
  const { data, isLoading, error: queryError } = useGuildIndex();
  const { data: globalSnapshotData } = useGlobalSnapshots();
  const guilds = data?.guilds || null;
  const snapshotDate = data?.captured_at ?? null;
  const error = queryError ? 'An unexpected error has occurred' : '';
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState('');
  const handleQueryChange = (e) => {
    setQuery(e.target.value);
    setPage(0);
  };

  const { pinnedGuilds, isPinned, togglePin } = usePinnedGuilds();

  // Scale banner: prefer actual tracked guild count; fall back to global snapshot total_guilds.
  const trackedCount = guilds?.length ?? null;
  const totalGuilds = globalSnapshotData?.snapshots?.[0]?.total_guilds ?? null;

  const normalizedQuery = query.trim().toLowerCase();
  const filteredGuilds = normalizedQuery
    ? guilds?.filter((g) => g.guild_name?.toLowerCase().includes(normalizedQuery))
    : guilds;
  const pagedGuilds = filteredGuilds?.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);

  // Build a lookup map from guild_id → live guild row for O(1) access.
  const guildById = guilds
    ? new Map(guilds.map((g) => [g.guild_id, g]))
    : new Map();

  // 7c: "Your guild" — in-cohort only, never written to pin list.
  const myGuildId = state?.account?.guild?.id || null;
  const myGuildRow = myGuildId ? guildById.get(myGuildId) ?? null : null;

  // 7a + 7c: Build the hoisted section (your-guild + manual pins, deduplicated).
  // myGuildRow wins and is shown as "your guild"; manual pins fill in the rest.
  // Manual pins NOT in the cohort are tombstones.
  const hoistedRows = [];
  const hoistedIds = new Set();

  if (myGuildRow) {
    hoistedIds.add(myGuildId);
    hoistedRows.push({ guild: myGuildRow, yourGuild: true, tombstone: false });
  }

  for (const { id, name } of pinnedGuilds) {
    if (hoistedIds.has(id)) continue; // already shown as your-guild
    hoistedIds.add(id);
    const liveRow = guildById.get(id);
    if (liveRow) {
      hoistedRows.push({ guild: liveRow, yourGuild: false, tombstone: false });
    }
    else {
      // Tombstone: guild is no longer in the tracked cohort.
      hoistedRows.push({
        guild: { guild_id: id, guild_name: name },
        yourGuild: false,
        tombstone: true
      });
    }
  }

  const showHoistedSection = hoistedRows.length > 0;

  return <>
    <NextSeo
      title="Guilds | Idleon Toolbox"
      description="Browse the top Legends of Idleon guilds ranked by guild points, with member details, levels, and leadership info"
    />
    <Stack direction="row" alignItems="baseline" gap={1.5} sx={{ flexWrap: 'wrap' }}>
      <Typography variant={'h2'}>Guilds Leaderboard</Typography>
      {trackedCount != null && totalGuilds != null && (
        <Chip
          size="small"
          variant="outlined"
          label={`Top ${trackedCount.toLocaleString()} of ~${totalGuilds.toLocaleString()}`}
        />
      )}
    </Stack>
    <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
      <Typography variant="caption" color="text.secondary">
        {guilds && isValid(snapshotDate)
          ? `Updated ${formatDate(snapshotDate)} · hourly`
          : 'Updated hourly'}
      </Typography>
      {trackedCount != null && totalGuilds != null && (
        <>
          <Typography variant="caption" color="text.secondary">·</Typography>
          <Link
            component="button"
            variant="caption"
            onClick={() => router.push('/guilds/universe')}
            sx={{ verticalAlign: 'baseline', cursor: 'pointer' }}
          >
            Universe stats →
          </Link>
        </>
      )}
    </Stack>
    <TextField
      size="small"
      placeholder="Search guild by name"
      value={query}
      onChange={handleQueryChange}
      sx={{ mb: 2, width: 280 }}
    />
    <CurationStrip guilds={guilds} router={router}/>
    {!guilds && !error ? (
      <SimpleLoader message="Gathering guild info..."/>
    ) : error ? (
      <Stack sx={{ my: 3 }} direction={'row'} alignItems={'center'} justifyContent={'center'} gap={2}>
        <ErrorIcon/>
        <Typography variant={'h6'}>{error}</Typography>
      </Stack>
    ) : (
      <Paper sx={{ p: 2 }}>
        <TableContainer>
          <Table size="small" sx={{ background: 'transparent' }}>
            <TableHead sx={{ whiteSpace: 'nowrap' }}>
              <TableRow>
                <TableCell sx={{ width: '1px', textAlign: 'center' }}>
                  <Tooltip title="Click the pin on any row to keep that guild at the top">
                    <PushPinOutlinedIcon fontSize="small" sx={{ opacity: 0.4, verticalAlign: 'middle' }} />
                  </Tooltip>
                </TableCell>
                <TableCell sx={{ width: 30 }}></TableCell>
                <TableCell>Guild Name</TableCell>
                <TableCell align="right">Total GP</TableCell>
                <TableCell align="right">GP this week</TableCell>
                <TableCell align="right">
                  <HeaderWithHint
                    label="vs last week"
                    align="right"
                    hint="This week's GP vs last week's GP at the same hour-of-week. Positive = faster pace than last week at this point."
                  />
                </TableCell>
                <TableCell>
                  <HeaderWithHint
                    label="Trend"
                    hint="GP gained per day over the last 30 days. Spikes mark active days; flat stretches mark quiet ones. The dot marks the most recent complete day — today is excluded so a partial day doesn't always look like a dip."
                  />
                </TableCell>
                <TableCell align="right">Members</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {showHoistedSection && (
                <>
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      sx={{ py: 0.5, px: 1, backgroundColor: 'action.selected' }}
                    >
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Pinned
                      </Typography>
                    </TableCell>
                  </TableRow>
                  {hoistedRows.map(({ guild, yourGuild, tombstone }) => (
                    <GuildRow
                      key={guild.guild_id}
                      guild={guild}
                      muiTheme={muiTheme}
                      router={router}
                      isPinned={isPinned(guild.guild_id)}
                      onTogglePin={togglePin}
                      yourGuild={yourGuild}
                      tombstone={tombstone}
                    />
                  ))}
                  <TableRow>
                    <TableCell colSpan={8} sx={{ py: 0.5, backgroundColor: 'action.selected' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        All guilds
                      </Typography>
                    </TableCell>
                  </TableRow>
                </>
              )}
              {pagedGuilds?.length === 0 ? <TableRow>
                <TableCell colSpan={8} align={'center'}>
                  <Typography sx={{ py: 2 }} color="text.secondary">No guilds</Typography>
                </TableCell>
              </TableRow> : null}
              {pagedGuilds?.map((guild) => (
                <GuildRow
                  key={guild.guild_id}
                  guild={guild}
                  muiTheme={muiTheme}
                  router={router}
                  isPinned={isPinned(guild.guild_id)}
                  onTogglePin={togglePin}
                  yourGuild={false}
                  tombstone={false}
                />
              ))}
            </TableBody>
          </Table>
          {filteredGuilds?.length > ROWS_PER_PAGE && (
            <TablePagination
              component="div"
              count={filteredGuilds.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={ROWS_PER_PAGE}
              rowsPerPageOptions={[ROWS_PER_PAGE]}
            />
          )}
        </TableContainer>
      </Paper>
    )}
  </>
};

export default Guilds;
