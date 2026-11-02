import { IconButton, Link, Stack, Typography, useTheme } from '@mui/material';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import DataTable from '@components/common/DataTable';
import GameIcon from '@components/common/GameIcon';
import Notice from '@components/common/Notice';
import StatusText from '@components/common/StatusText';
import TagLine from '@components/common/TagLine';
import usePageTop from '@hooks/usePageTop';
import { getGuildLevel } from '@parsers/guild';
import { seriesColors } from '@utility/chartTheme';
import Sparkline from './Sparkline';

const VS_LAST_WEEK_NOTE = 'This week\'s GP vs last week\'s GP at the same hour-of-week. Positive = faster pace than last week at this point.';
const TREND_NOTE = 'Daily GP gains over the last 30 days. The dot marks the most recent complete day (today is excluded to avoid a partial-day dip).';

// The guild's name opens its page through the router, with no href: every ?id= address is a copy of one
// canonical page, so they stay out of Search Console (Decision 6). A guild no longer tracked has no page.
const GuildName = ({ guild, router }) => {
  const { guild_id, guild_name, yourGuild, tombstone, rank_delta_2w } = guild;
  if (tombstone) {
    return <Stack direction={'row'} alignItems={'center'} gap={1} component={'span'}>
      <Typography variant={'body2'} component={'span'}>{guild_name}</Typography>
      <TagLine tags={['Not tracked']}/>
    </Stack>;
  }
  return <Stack direction={'row'} alignItems={'center'} gap={1} flexWrap={'wrap'} component={'span'}>
    <Link component={'button'} type={'button'} variant={'body2'} underline={'hover'} fontWeight={500} textAlign={'left'}
          onClick={() => router.push(`/guilds/detail?id=${encodeURIComponent(guild_id)}`)}>
      {guild_name}
    </Link>
    {yourGuild ? <StatusText status={'selected'}>Your guild</StatusText> : null}
    {/* Two weeks of rank change: the arrow is the sign, so the color is never alone. */}
    {rank_delta_2w ? <Stack direction={'row'} alignItems={'center'} component={'span'}
                            sx={{ color: rank_delta_2w < 0 ? 'text.success' : 'text.error' }}>
      {rank_delta_2w < 0
        ? <ArrowDropUpIcon fontSize={'small'} sx={{ mr: -0.25 }}/>
        : <ArrowDropDownIcon fontSize={'small'} sx={{ mr: -0.25 }}/>}
      <Typography variant={'caption'} component={'span'} fontWeight={600} sx={{ fontVariantNumeric: 'tabular-nums' }}>
        {Math.abs(rank_delta_2w)}
      </Typography>
    </Stack> : null}
  </Stack>;
};

export default function GuildTable({ guilds, hoistedRows, showHoistedSection, isPinned, onTogglePin, query, router }) {
  const muiTheme = useTheme();
  const pageTop = usePageTop();
  const columns = [
    {
      key: 'guild',
      label: 'Guild',
      value: (guild) => guild.guild_name,
      icon: (guild) => (guild.tombstone ? null : <GameIcon src={`data/G2icon${guild.guild_icon}.png`} alt={''} size={32}/>),
      render: (guild) => <GuildName guild={guild} router={router}/>
    },
    { key: 'total_gp', label: 'Total GP', kind: 'amount', sortable: true, phone: true, value: (guild) => guild.total_gp },
    { key: 'gp_this_week', label: 'GP this week', kind: 'amount', sortable: true, value: (guild) => guild.gp_this_week },
    {
      key: 'vs_last_wk_pct',
      label: 'vs last week',
      kind: 'pct',
      format: { decimals: 1 },
      change: 'higher',
      sortable: true,
      info: VS_LAST_WEEK_NOTE,
      value: (guild) => (guild.vs_last_wk_pct == null ? null : guild.vs_last_wk_pct * 100),
      // Under 0.05% either way is the same pace: no color.
      tone: (guild) => (guild.vs_last_wk_pct == null || Math.abs(guild.vs_last_wk_pct) < 0.0005
        ? null
        : guild.vs_last_wk_pct > 0 ? 'good' : 'bad')
    },
    {
      key: 'trend',
      label: 'Trend',
      info: TREND_NOTE,
      render: (guild) => (guild.total_gp_history
        ? <Sparkline values={guild.total_gp_history} color={seriesColors(muiTheme.palette.mode)[0]}/>
        : null)
    },
    {
      key: 'members',
      label: 'Members',
      numeric: true,
      sortable: true,
      value: (guild) => guild.members_count,
      render: (guild) => (guild.members_count == null ? null : `${guild.members_count} / ${30 + 4 * getGuildLevel(guild.total_gp)}`)
    },
    {
      key: 'pin',
      label: 'Pin',
      info: 'Pin a guild to keep it at the top',
      render: (guild) => {
        const pinned = isPinned(guild.guild_id);
        return <IconButton size={'small'} aria-pressed={pinned}
                           aria-label={`${pinned ? 'Unpin' : 'Pin'} ${guild.guild_name}`}
                           onClick={() => onTogglePin(guild.guild_id, guild.guild_name)}>
          {pinned ? <PushPinIcon fontSize={'small'} color={'primary'}/> : <PushPinOutlinedIcon fontSize={'small'}/>}
        </IconButton>;
      }
    }
  ];
  const hoisted = hoistedRows.map(({ guild, yourGuild, tombstone }) => ({ ...guild, yourGuild, tombstone }));
  const empty = !guilds?.length;

  return <Stack gap={2}>
    {empty && query ? <Notice tone={'info'}>No guilds match &quot;{query}&quot;.</Notice> : null}
    {empty && !showHoistedSection ? null : <DataTable
      columns={columns}
      {...(showHoistedSection
        ? {
          bands: [
            { key: 'pinned', label: 'Pinned', rows: hoisted },
            ...(empty ? [] : [{ key: 'all', label: 'All guilds', rows: guilds }])
          ]
        }
        : { rows: guilds })}
      rowKey={'guild_id'}
      rowLabel={(guild) => guild.guild_name}
      // The order is the point: # is the guild's rank, whatever the table is sorted by.
      rankOf={(guild) => guild.rank}
      // A guild pinned but no longer tracked stays listed, dimmed, so it can still be unpinned.
      muted={(guild) => Boolean(guild.tombstone)}
      surface={'card'}
      stickyTop={pageTop}
    />}
  </Stack>;
}
