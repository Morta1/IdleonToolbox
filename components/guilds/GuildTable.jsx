import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import GuildRow from './GuildRow';
import HeaderWithHint from './HeaderWithHint';

export default function GuildTable({
  pagedGuilds,
  hoistedRows,
  showHoistedSection,
  sortBy,
  sortDir,
  onSort,
  isPinned,
  onTogglePin,
  filteredCount,
  page,
  onPageChange,
  rowsPerPage,
  router
}) {
  const muiTheme = useTheme();

  return (
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
              <TableCell align="right" sortDirection={sortBy === 'total_gp' ? sortDir : false}>
                <TableSortLabel
                  active={sortBy === 'total_gp'}
                  direction={sortBy === 'total_gp' ? sortDir : 'desc'}
                  onClick={() => onSort('total_gp')}
                >
                  Total GP
                </TableSortLabel>
              </TableCell>
              <TableCell align="right" sortDirection={sortBy === 'gp_this_week' ? sortDir : false}>
                <TableSortLabel
                  active={sortBy === 'gp_this_week'}
                  direction={sortBy === 'gp_this_week' ? sortDir : 'desc'}
                  onClick={() => onSort('gp_this_week')}
                >
                  GP this week
                </TableSortLabel>
              </TableCell>
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
                  hint="Daily GP gains over the last 30 days. The dot marks the most recent complete day (today is excluded to avoid a partial-day dip)."
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
                    onTogglePin={onTogglePin}
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
            {pagedGuilds?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align={'center'}>
                  <Typography sx={{ py: 2 }} color="text.secondary">No guilds</Typography>
                </TableCell>
              </TableRow>
            ) : null}
            {pagedGuilds?.map((guild) => (
              <GuildRow
                key={guild.guild_id}
                guild={guild}
                muiTheme={muiTheme}
                router={router}
                isPinned={isPinned(guild.guild_id)}
                onTogglePin={onTogglePin}
                yourGuild={false}
                tombstone={false}
              />
            ))}
          </TableBody>
        </Table>
        {filteredCount > rowsPerPage && (
          <TablePagination
            component="div"
            count={filteredCount}
            page={page}
            onPageChange={(_, newPage) => onPageChange(newPage)}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[rowsPerPage]}
          />
        )}
      </TableContainer>
    </Paper>
  );
}
