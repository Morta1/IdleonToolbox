import { Stack, Typography, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import { IconCaretDownFilled, IconCaretUpFilled, IconPin, IconPinFilled } from '@tabler/icons-react';
import DataTable from '@components/common/DataTable';
import GameIcon, { MissingArt } from '@components/common/GameIcon';
import StatusText from '@components/common/StatusText';
import TagLine from '@components/common/TagLine';
import { getGuildLevel } from '@parsers/guild';
import { seriesColors } from '@utility/chartTheme';
import { formatNum } from '@utility/helpers';
import { focusRing } from '../../styles/theme/darkTheme';
import Sparkline from './Sparkline';

const VS_LAST_WEEK_NOTE = 'This week\'s GP vs last week\'s GP at the same hour-of-week. Positive = faster pace than last week at this point.';
const TREND_NOTE = 'Daily GP gains over the last 30 days. The dot marks the most recent complete day (today is excluded to avoid a partial-day dip).';
const UNNAMED = 'Unnamed guild';

// A row's pieces are plain elements styled once, not MUI's per row: "Show 941 more" mounts them all at once.
const NameButton = styled('button')(({ theme }) => ({
  padding: 0,
  border: 0,
  background: 'transparent',
  font: 'inherit',
  fontWeight: 500,
  color: (theme.vars || theme).palette.primary.main,
  textAlign: 'left',
  cursor: 'pointer',
  '&:hover': { textDecoration: 'underline' },
  '&:focus-visible': focusRing(theme)
}));
const NameRow = styled('span')({ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 });
const RankDelta = styled('span')(({ theme }) => ({
  ...theme.typography.caption,
  display: 'inline-flex',
  alignItems: 'center',
  fontWeight: 500,
  fontVariantNumeric: 'tabular-nums',
  color: (theme.vars || theme).palette.text.success,
  '&[data-fell]': { color: (theme.vars || theme).palette.text.error }
}));
const PinButton = styled('button')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  padding: 0,
  border: 0,
  borderRadius: '50%',
  background: 'transparent',
  color: (theme.vars || theme).palette.text.secondary,
  cursor: 'pointer',
  '&[aria-pressed="true"]': { color: (theme.vars || theme).palette.primary.main },
  '&:hover': { background: (theme.vars || theme).palette.action.hover },
  '&:focus-visible': focusRing(theme),
  '@media (pointer: coarse)': { width: 44, height: 44 }
}));

// The guild's name opens its page through the router, with no href: every ?id= address is a copy of one
// canonical page, so they stay out of Search Console (Decision 6).
export const GuildLink = ({ guild, router }) => <NameButton type={'button'}
                                                            onClick={() => router.push(`/guilds/detail?id=${encodeURIComponent(guild.guild_id)}`)}>
  {guild.guild_name ?? UNNAMED}
</NameButton>;

// A guild no longer tracked has no page.
const GuildName = ({ guild, router }) => {
  const { guild_name, yourGuild, tombstone, rank_delta_2w } = guild;
  if (tombstone) {
    return <Stack direction={'row'} alignItems={'center'} gap={1} component={'span'}>
      <Typography variant={'body2'} component={'span'}>{guild_name ?? UNNAMED}</Typography>
      <TagLine tags={['Not tracked']}/>
    </Stack>;
  }
  return <NameRow>
    <GuildLink guild={guild} router={router}/>
    {yourGuild ? <StatusText status={'selected'}>Your guild</StatusText> : null}
    {/* Two weeks of rank change: the arrow is the sign, so the color is never alone. */}
    {rank_delta_2w ? <RankDelta data-fell={rank_delta_2w > 0 ? '' : undefined}>
      {rank_delta_2w < 0 ? <IconCaretUpFilled size={14} aria-label={'Up'}/> : <IconCaretDownFilled size={14} aria-label={'Down'}/>}
      {formatNum(Math.abs(rank_delta_2w), 'whole')}
    </RankDelta> : null}
  </NameRow>;
};

const membersText = ({ members_count, total_gp }) => {
  if (members_count == null) return null;
  const cap = 30 + 4 * getGuildLevel(total_gp);
  return Number.isFinite(cap) ? `${formatNum(members_count, 'whole')} / ${formatNum(cap, 'whole')}` : formatNum(members_count, 'whole');
};

export default function GuildTable({ guilds, hoistedRows, showHoistedSection, isPinned, onTogglePin, router, stickyTop }) {
  const muiTheme = useTheme();
  const sparkColor = seriesColors(muiTheme.palette.mode)[0];
  const columns = [
    {
      key: 'guild',
      label: 'Guild',
      value: (guild) => guild.guild_name,
      icon: (guild) => (guild.tombstone ? null : guild.guild_icon == null
        ? <MissingArt style={{ width: 24, height: 24 }} aria-hidden>?</MissingArt>
        : <GameIcon src={`data/G2icon${guild.guild_icon}.png`} alt={''} size={24}/>),
      render: (guild) => <GuildName guild={guild} router={router}/>
    },
    { key: 'total_gp', label: 'Total GP', kind: 'amount', sortable: true, phone: true, value: (guild) => guild.total_gp },
    { key: 'gp_this_week', label: 'GP this week', kind: 'amount', sortable: true, value: (guild) => guild.gp_this_week },
    {
      key: 'vs_last_wk_pct',
      label: 'vs last week',
      kind: 'pct',
      format: { decimals: 2 },
      change: 'higher',
      sortable: true,
      info: VS_LAST_WEEK_NOTE,
      // Beside the ad column the page is 364 px narrower than the window: these two arrive once the row holds them.
      from: 1100,
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
      from: 1100,
      render: (guild) => (guild.total_gp_history
        ? <Sparkline values={guild.total_gp_history} color={sparkColor}/>
        : null)
    },
    {
      key: 'members',
      label: 'Members',
      numeric: true,
      sortable: true,
      from: 'lg',
      value: (guild) => guild.members_count,
      render: membersText
    },
    {
      key: 'pin',
      label: 'Pin',
      info: 'Pin a guild to keep it at the top',
      render: (guild) => {
        const pinned = isPinned(guild.guild_id);
        return <PinButton type={'button'} aria-pressed={pinned} aria-label={`${pinned ? 'Unpin' : 'Pin'} ${guild.guild_name ?? UNNAMED}`}
                          onClick={() => onTogglePin(guild.guild_id, guild.guild_name)}>
          {pinned ? <IconPinFilled size={16}/> : <IconPin size={16}/>}
        </PinButton>;
      }
    }
  ];
  const hoisted = hoistedRows.map(({ guild, yourGuild, tombstone }) => ({ ...guild, yourGuild, tombstone }));
  const empty = !guilds?.length;

  return empty && !showHoistedSection ? null : <DataTable
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
    rowLabel={(guild) => guild.guild_name ?? UNNAMED}
    // The order is the point: # is the guild's rank, whatever the table is sorted by.
    rankOf={(guild) => guild.rank}
    // A guild pinned but no longer tracked stays listed, dimmed, so it can still be unpinned.
    muted={(guild) => Boolean(guild.tombstone)}
    surface={'card'}
    stickyTop={stickyTop}
  />;
}
