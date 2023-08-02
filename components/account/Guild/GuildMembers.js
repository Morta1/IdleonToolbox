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

const GuildMembers = ({ members, changes }) => {
  const [localMembers, setLocalMembers] = useState();
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('gpEarned')

  useEffect(() => {
    setLocalMembers(getSortedMembers(members, orderBy, order))
  }, [members])

  const getSortedMembers = (arr, orderByKey, wantedOrder) => {
    return arr.sort((a, b) => {
      return wantedOrder === 'asc' ? a?.[orderByKey] - b?.[orderByKey] : b?.[orderByKey] - a?.[orderByKey]
    })
  }

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
          <TableCell sortDirection={order}>
            <TableSortLabel direction={order} active={orderBy === 'gpEarned'}
                            onClick={() => handleSort('gpEarned', order === 'asc' ? 'desc' : 'asc')}>
              Earned GP
            </TableSortLabel>
          </TableCell>
          <TableCell>Wanted Bonus</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {localMembers?.map(({ name, level, gpEarned, wantedBonus, rank }, index) => {
          const memberChange = changes?.members?.find(({ name: cName }) => cName === name);
          let gpChange = 0;
          if (memberChange) {
            gpChange = memberChange?.gpEarned - gpEarned;
          }
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
            <TableCell>{gpEarned} {changes ? <Typography variant={'caption'}
                                               color={gpChange > 0 ? 'success.light' : 'error.light'}>({gpChange > 0
              ? '+'
              : ''}{gpChange})</Typography> : null}</TableCell>
            <TableCell>{cleanUnderscore(wantedBonus?.name) || 'Guild Gifts'}</TableCell>
          </TableRow> : null
        })}
      </TableBody>
    </Table>
  </TableContainer>
};

export default GuildMembers;
