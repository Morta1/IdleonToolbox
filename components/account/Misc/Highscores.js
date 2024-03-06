import { Stack } from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import React from 'react';
import { numberWithCommas } from '@utility/helpers';

const Highscores = ({ title, highscore }) => {
  // coloHighscores
  // minigameHighscores
  return (
    <Stack gap={1.5} justifyContent={'center'}>
      <Tablee title={title} rows={highscore}/>
    </Stack>
  );
};

const Tablee = ({ title, rows }) => {
  return <TableContainer>
    <Table aria-label="simple table">
      <TableHead>
        <TableRow>
          <TableCell>{title}</TableCell>
          <TableCell>Score</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows?.sort((a, b) => b.score - a.score).map((row) => (
          <TableRow key={row.name} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
            <TableCell sx={{ p: 1 }} component="th" scope="row">{row.name}</TableCell>
            <TableCell sx={{ p: 1 }} component="th" scope="row">{numberWithCommas(parseInt(row.score))}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
}

export default Highscores;
