import { useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import TagLine from '@components/common/TagLine';
import DataTable from '@components/common/DataTable';
import GameIcon from '@components/common/GameIcon';
import { NoteTrigger } from '@components/common/InfoButton';
import Notice from '@components/common/Notice';
import Toolbar from '@components/common/Toolbar';
import useFormatDate from '@hooks/useFormatDate';

// Guild role from the member's rank field (g). Mirrors the in-game guild member
// list (GuildMembers.jsx / N.js): ranks 0-4 each get their own GuildRank{g} icon,
// rank 5 (regular member) gets no icon. The game names the two that lead ("Guild leaders, indicated by the King and Crown
// role icons"): 0 and 1. It names no other, and 2-4 have no powers beyond a member's.
// Returns null when rank is missing or 5+ so no badge shows.
function guildRole(rank) {
  if (rank == null || rank >= 5) return null;
  const label = rank === 0 ? 'King' : rank === 1 ? 'Crown' : 'Member';
  return { label, icon: `etc/GuildRank${rank}.png` };
}

// Idleon's reporting week starts Saturday 21:00 UTC: the same anchor used in
// WeeklyProgressChart and CurationStrip.
const HOUR_MS = 3600 * 1000;
const WEEK_MS = 7 * 24 * HOUR_MS;
const WEEK_ANCHOR_MS = (2 * 24 + 21) * HOUR_MS;

function currentWeekStartMs(now = Date.now()) {
  return now - ((now - WEEK_ANCHOR_MS) % WEEK_MS);
}

// How many week boundaries separate `lastContributedAt` from now.
// 0 = contributed during the current week, 1 = last week, etc.
// Returns null when there's no recorded contribution.
function weeksAgoFromTimestamp(lastContributedAt, now = Date.now()) {
  if (lastContributedAt == null) return null;
  const currentStart = currentWeekStartMs(now);
  const contribStart = currentWeekStartMs(lastContributedAt);
  return Math.max(0, Math.round((currentStart - contribStart) / WEEK_MS));
}

function lastContributedLabel(weeksAgo) {
  if (weeksAgo == null) return null;
  if (weeksAgo === 0) return 'This week';
  if (weeksAgo === 1) return 'Last week';
  return `${weeksAgo}w ago`;
}

export function sortedMembers(members) {
  if (!members) return [];
  return [...members].sort((a, b) => (b.gp_earned || 0) - (a.gp_earned || 0));
}

// The role icon (a member with none keeps its room, so names line up), the name and when they joined, under the name
// where the row has no room for both: at 384 the two pushed the table past its box, and a table that scrolls sideways
// can't pin its head.
const MemberName = ({ member }) => {
  const role = guildRole(member.member_rank);
  const joinedWeeksAgo = member.joined_weeks_ago ?? null;
  return <Stack direction="row" alignItems="center" gap={0.75} component="span">
    {role
      ? <NoteTrigger note={role.label} label={role.label}><GameIcon src={role.icon} alt={''} size={16}/></NoteTrigger>
      : <Box component="span" sx={{ display: 'inline-block', width: 16, height: 16, flexShrink: 0 }}/>}
    <Stack direction="row" alignItems="center" flexWrap="wrap" columnGap={0.75} component="span">
      <Typography variant="body2" component="span">{member.member_name}</Typography>
      {joinedWeeksAgo != null && (
        <TagLine tags={[joinedWeeksAgo === 0 ? 'Joined this week' : `Joined ${joinedWeeksAgo}w ago`]}/>
      )}
    </Stack>
  </Stack>;
};

export default function ContributorLeaderboard({ members }) {
  const formatDate = useFormatDate();
  const [query, setQuery] = useState('');
  // Up to 209 rows: the header sticks under the search while they scroll.
  const [toolbarBottom, setToolbarBottom] = useState(null);

  const sorted = sortedMembers(members);
  const ranked = sorted.map((m, i) => ({
    ...m,
    rank: i + 1,
    weeks_since_contribution: weeksAgoFromTimestamp(m.last_contributed_at)
  }));
  const totalGuildGp = sorted.reduce((sum, m) => sum + (m.gp_earned || 0), 0);

  // Beside the menu and the ad column the panel is 400 px narrower than the window: each column joins the row once the
  // panel holds it, so the table fits its box and its head can pin.
  const columns = [
    { key: 'member', label: 'Member', value: (m) => m.member_name, render: (m) => <MemberName member={m}/> },
    { key: 'gp_earned', label: 'GP', kind: 'amount', sortable: true, phone: true, value: (m) => m.gp_earned ?? 0 },
    {
      key: 'share', label: '% Guild', kind: 'pct', format: { decimals: 2 }, from: { room: 400 }, info: 'Share of the guild\'s total weekly GP contributed by this member.',
      value: (m) => (totalGuildGp > 0 ? (m.gp_earned / totalGuildGp) * 100 : 0)
    },
    {
      key: 'gp_lifetime', label: 'Lifetime', kind: 'amount', sortable: true, from: { room: 530 },
      info: 'Total GP this member has contributed since they joined the guild (in-game lifetime, not just since tracking started).',
      value: (m) => m.gp_lifetime ?? null
    },
    {
      key: 'weeks_since_contribution', label: 'Last contributed', numeric: true, sortable: true, from: { room: 670 },
      info: 'Most recent week this member earned any GP. Based on the last 6 weeks of tracked history.',
      // No contributions in the window sorts as the most stale, not as this week.
      sortValue: (m) => m.weeks_since_contribution ?? Number.MAX_SAFE_INTEGER,
      render: (m) => {
        const label = lastContributedLabel(m.weeks_since_contribution);
        return label ? <NoteTrigger note={formatDate(m.last_contributed_at, { showSeconds: false })}
                                    label={`${m.member_name} last contributed`}>{label}</NoteTrigger> : null;
      }
    }
  ];

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = normalizedQuery
    ? ranked.filter((m) => m.member_name?.toLowerCase().includes(normalizedQuery))
    : ranked;

  if (!ranked.length) return <Box sx={{ p: 2 }}><Notice tone={'info'}>No member contributed this week.</Notice></Box>;
  return (
    <>
      <Toolbar state={{ search: query }} defaults={{ search: '' }} onChange={({ search }) => setQuery(search ?? '')} onReset={() => setQuery('')}
               total={ranked.length} shown={filtered.length} noun={'members'} inPanel onStickyBottom={setToolbarBottom}>
        <Toolbar.Search placeholder={'Search members'}/>
      </Toolbar>
      {/* Every member up to 80 rows; past that, 60 and "Show n more" (DataTable's band preview). */}
      {filtered.length ? <Box sx={{ p: 2, containerType: 'inline-size' }}><DataTable
        columns={columns}
        rows={filtered}
        rowKey={'member_name'}
        rowLabel={(m) => m.member_name}
        rankOf={(m) => m.rank}
        defaultSort={{ key: 'gp_earned', order: 'desc' }}
        stickyTop={toolbarBottom}
        surface={'card'}
      /></Box> : null}
    </>
  );
}
