import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography
} from '@mui/material';
import { cleanUnderscore, prefix } from '../../../utility/helpers';
import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { format } from 'date-fns';

const GuildMembers = ({ members, saves }) => {
  const [localMembers, setLocalMembers] = useState();
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('gpEarned')
  const sortedSaves = saves?.slice().sort((a, b) => b.timestamp - a.timestamp);

  useEffect(() => {
    setLocalMembers(getSortedMembers(members, orderBy, order))
  }, [members])

  const getSortedMembers = (arr, orderByKey, wantedOrder) => {
    return [...(arr || [])].sort((a, b) =>
      wantedOrder === 'asc' ? a?.[orderByKey] - b?.[orderByKey] : b?.[orderByKey] - a?.[orderByKey]
    );
  };


  const handleSort = (orderKey, newOrder) => {
    setOrder(newOrder);
    setOrderBy(orderKey)
    const ordered = getSortedMembers(members, orderKey, newOrder);
    setLocalMembers(ordered)
  }

  return <TableContainer component={Paper}>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell sortDirection={order}>
            <TableSortLabel direction={order}
                            active={orderBy === 'level'}
                            onClick={() => handleSort('level', order === 'asc' ? 'desc' : 'asc')}>
              Level
            </TableSortLabel>
          </TableCell>
          <TableCell sortDirection={order} align={saves?.length === 0 ? 'left' : 'center'} colSpan={saves?.length || 1}>
            <TableSortLabel direction={order} active={orderBy === 'gpEarned'}
                            onClick={() => handleSort('gpEarned', order === 'asc' ? 'desc' : 'asc')}>
              Earned GP
            </TableSortLabel>
          </TableCell>
          <TableCell>Wanted Bonus</TableCell>
        </TableRow>
        {sortedSaves?.length > 0 ? <TableRow>
          <TableCell colSpan={2}/>
          {sortedSaves?.map((save, index) => {
            if (save) {
              return <TableCell key={'save' + index}>
                {format(save?.timestamp, 'dd/MM/yyyy HH:mm:ss')}
              </TableCell>
            }
          })}
          <TableCell/>
        </TableRow> : null}
      </TableHead>
      <TableBody>
        {localMembers?.map(({ name, level, gpEarned, wantedBonus, rank }, index) => {
          const allChanges = saves?.reduce((res, save) => {
            const memberChange = save?.members?.find(({ name: cName }) => cName === name);
            let gpChange;
            if (memberChange) {
              gpChange = gpEarned - memberChange?.gpEarned;
            } else {
              gpChange = gpEarned;
            }
            return [...res, { gpChange, timestamp: save?.timestamp }]
          }, [])
          return name ? <TableRow key={name + level + index}
                                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
            <TableCell>
              {rank < 5 ? <img src={`${prefix}etc/GuildRank${rank}.png`} alt={`rank-${rank}`}/> : <Box
                component={'span'}
                sx={{ display: 'inline-block', width: 15, height: 17 }}/>}
              <Typography component={'span'} sx={{ ml: 1 }}>{name} {rank === 0 ? '(King)' : rank === 1
                ? '(Leader)'
                : ''}</Typography>
            </TableCell>
            <TableCell>{level}</TableCell>
            {saves?.length === 0 ? <TableCell>{gpEarned}</TableCell> : null}
            {allChanges.map(({ gpChange }, changeIndex) => {
              return <TableCell key={'change' + changeIndex}>
                <Typography component={'span'} mr={1}>{gpEarned}</Typography>
                <Typography variant={'caption'}
                            color={gpChange > 0
                              ? 'success.light'
                              : 'error.light'}>({gpChange > 0
                  ? '+'
                  : ''}{gpChange})</Typography>
              </TableCell>
            })}
            <TableCell>{cleanUnderscore(wantedBonus?.name) || 'Guild Gifts'}</TableCell>
          </TableRow> : null
        })}
      </TableBody>
    </Table>
  </TableContainer>
};

export default GuildMembers;
