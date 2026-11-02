import { Typography } from '@mui/material';
import { cleanUnderscore } from '@utility/helpers';
import React from 'react';
import Box from '@mui/material/Box';
import useFormatDate from '@hooks/useFormatDate';
import usePageTop from '@hooks/usePageTop';
import DataTable from '@components/common/DataTable';
import GameIcon from '@components/common/GameIcon';

// The rank icon (members past the fourth rank keep its room, so names line up), the name, and the two titles.
const MemberName = ({ member }) => <Box component={'span'} sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
  {member.rank < 5
    ? <GameIcon src={`etc/GuildRank${member.rank}.png`} alt={''} size={16}/>
    : <Box component={'span'} sx={{ display: 'inline-block', width: 16, height: 16 }}/>}
  <Typography component={'span'} variant={'body2'}>
    {member.name} {member.rank === 0 ? '(King)' : member.rank === 1 ? '(Leader)' : ''}
  </Typography>
</Box>;

const GuildMembers = ({ members, saves }) => {
  const formatDate = useFormatDate();
  const pageTop = usePageTop();
  const sortedSaves = saves?.slice().sort((a, b) => b.timestamp - a.timestamp);
  // One column per saved snapshot, newest first: what each member earned since it.
  const saveColumns = (sortedSaves ?? []).map((save) => ({
    key: `since-${save?.timestamp}`,
    label: `Since ${formatDate(save?.timestamp, { showSeconds: false })}`,
    kind: 'amount',
    change: 'higher',
    sortable: true,
    // A member who joined after the save earned all of it since.
    value: (member) => member.gpEarned - (save?.members?.find(({ name }) => name === member.name)?.gpEarned ?? 0)
  }));
  const columns = [
    { key: 'name', label: 'Name', value: (member) => member.name, sortable: true, render: (member) => <MemberName member={member}/> },
    { key: 'level', label: 'Level', kind: 'amount', sortable: true, value: (member) => member.level },
    { key: 'gpEarned', label: 'Earned GP', kind: 'amount', sortable: true, phone: true, value: (member) => member.gpEarned },
    ...saveColumns,
    { key: 'wanted', label: 'Wanted bonus', value: (member) => cleanUnderscore(member.wantedBonus?.name) || 'Guild Gifts' }
  ];

  return <DataTable
    columns={columns}
    rows={(members ?? []).filter((member) => member?.name)}
    rowKey={'name'}
    rowLabel={(member) => member.name}
    defaultSort={{ key: 'gpEarned', order: 'desc' }}
    surface={'card'}
    stickyTop={pageTop}
  />;
};

export default GuildMembers;
