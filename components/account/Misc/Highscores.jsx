import { Stack, Typography, Divider } from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import React from 'react';
import { numberWithCommas, cleanUnderscore } from '@utility/helpers';
import Tooltip from '@components/Tooltip';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import { TitleAndValue } from '@components/common/styles';

const Highscores = ({ title, highscore }) => {
  // coloHighscores
  // minigameHighscores
  return (
    <Stack gap={1.5} justifyContent={'center'}>
      <LeaderboardTable title={title} rows={highscore} />
    </Stack>
  );
};

const LeaderboardTable = ({ title, rows }) => {
  return <TableContainer>
    <Table aria-label="simple table">
      <TableHead>
        <TableRow>
          <TableCell>{title}</TableCell>
          <TableCell>Score</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows?.sort((a, b) => b.score - a.score).map((row) => {
          const hasUpgrades = row.upgrades && row.upgrades.length > 0;

          return (
            <TableRow key={row.name} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              <TableCell sx={{ p: 1 }} component="th" scope="row">
                <Stack direction="row" alignItems="center" gap={0.5}>
                  {row.name.capitalize()}
                  {hasUpgrades && (
                    <Tooltip
                      maxWidth={450}
                      title={
                        <Stack gap={1}>
                          {row.totalPoints !== undefined && (
                            <>
                              <TitleAndValue
                                title="Total Points"
                                value={numberWithCommas(row.totalPoints)}
                                boldTitle
                              />
                              <Divider sx={{ my: 0.5 }} />
                            </>
                          )}
                          <Stack gap={1}>
                            {row.upgrades.map((upgrade, index) => (
                              <Stack key={index} gap={0.5}>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {cleanUnderscore(upgrade.description)}
                                </Typography>
                                <Stack gap={0.25} >
                                  <Typography variant="caption" >Level: {upgrade.level || 0}</Typography>
                                  {!upgrade.unlocked ? <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    {'Unlocks at ' + upgrade.pointsToUnlock + ' points'}
                                  </Typography> : null}
                                </Stack>
                                {index < row.upgrades.length - 1 && <Divider sx={{ mt: 0.5 }} />}
                              </Stack>
                            ))}
                          </Stack>
                        </Stack>
                      }
                    >
                      <IconInfoCircleFilled size={16} style={{ cursor: 'help' }} />
                    </Tooltip>
                  )}
                </Stack>
              </TableCell>
              <TableCell sx={{ p: 1 }} component="th" scope="row">{numberWithCommas(parseInt(row.score))}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </TableContainer>
}

export default Highscores;
