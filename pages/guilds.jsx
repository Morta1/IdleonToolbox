import React, { useCallback, useEffect, useState } from 'react';
import { getGuilds } from '../firebase';
import {
  CircularProgress,
  Collapse,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import { NextSeo } from 'next-seo';
import { getDuration, numberWithCommas, prefix, tryToParse } from '@utility/helpers';
import IconButton from '@mui/material/IconButton';
import ErrorIcon from '@mui/icons-material/Error';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Box from '@mui/material/Box';
import { format, isValid } from 'date-fns';
import RefreshIcon from '@mui/icons-material/Refresh';
import Tooltip from '../components/Tooltip';
import { getGuildLevel } from '../parsers/guild';

const Guilds = () => {
  const [listener, setListener] = useState({ func: null });
  const [guilds, setGuilds] = useState(null);
  const [openIndex, setOpenIndex] = useState(null);
  const snapshotDate = tryToParse(sessionStorage.getItem('snapshotDate'));
  const [error, setError] = useState('');

  const parseGuildsData = useCallback(
    (topGuilds) => {
      return topGuilds?.slice(0, 100)?.map((guild) => {
        const leader = guild?.members?.find(({ g }) => g === 0);
        const topContributors = guild?.members?.sort((a, b) => b?.e - a?.e)
          ?.slice(0, 5)?.map(({ a, e }) => ({ name: a, gpEarned: e }));
        return {
          guildIcon: guild?.guildIcon,
          guildName: guild?.guildName,
          totalGp: guild?.totalGp,
          membersCount: guild?.members?.length,
          leader,
          topContributors
        }
      });
    },
    [],
  );


  const handleGuildsUpdate = ({ guilds, error }) => {
    if (error) {
      return setError('An unexpected error has occurred');
    }
    const parsedGuilds = parseGuildsData(guilds);
    sessionStorage.setItem('guildsLeaderboard', JSON.stringify(parsedGuilds));
    sessionStorage.setItem('snapshotDate', new Date().getTime());
    setGuilds(parsedGuilds)
  }

  const handleRefresh = () => {
    if (!guilds) return null;
    setGuilds(null);
    sessionStorage.removeItem('guildsLeaderboard');
    sessionStorage.removeItem('snapshotDate');
    subscribe();
  }
  const subscribe = async () => {
    const unsubscribe = getGuilds(handleGuildsUpdate);
    setListener({ func: unsubscribe });
  }

  useEffect(() => {
    const timePassed = getDuration(new Date(), snapshotDate);
    if (timePassed?.days > 0 || timePassed?.hours > 0 || timePassed?.minutes >= 15 || !snapshotDate) {
      setTimeout(() => subscribe(), 3000);
    } else {
      setGuilds(tryToParse(sessionStorage.getItem('guildsLeaderboard')));
    }
    return () => {
      listener && typeof listener?.func === 'function' && listener?.func();
    }
  }, [])

  return <>
    <NextSeo
      title="Guilds | Idleon Toolbox"
      description="Top guilds in idleon"
    />
    <Typography variant={'h2'}>Guilds Leaderboard</Typography>
    <Stack direction={'row'} alignItems={'center'} gap={1}>
      <Stack gap={2} direction="row">Last Updated: {!guilds ?
        <CircularProgress size={'22px'} disableShrink/> : isValid(snapshotDate)
          ? format(snapshotDate, 'dd/MM/yyyy HH:mm:ss')
          : null}</Stack>
      <Tooltip title={'Reload guild data'}>
        <span><IconButton disabled={!guilds} onClick={handleRefresh}><RefreshIcon/></IconButton></span>
      </Tooltip>
    </Stack>
    <Typography variant={'caption'} component={'div'} sx={{ mb: 2 }}>* Updates every 15 minutes</Typography>
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: '1px' }}></TableCell>
            <TableCell sx={{ width: 30 }}></TableCell>
            <TableCell>Guild Name</TableCell>
            <TableCell>Guild Points</TableCell>
            <TableCell>Guild Leader</TableCell>
            <TableCell>Guild Level</TableCell>
            <TableCell>Members Count</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {!guilds && !error ? <TableRow>
            <TableCell colSpan={7} align={'center'}>
              <Stack alignItems={'center'} gap={2}>
                <Typography>Gathering guild info</Typography>
                <LinearProgress sx={{ width: 300 }}/>
              </Stack>
            </TableCell>
          </TableRow> : null}
          {error ? <TableRow>
            <TableCell colSpan={7} align={'center'}>
              <Stack sx={{ my: 3 }} direction={'row'} alignItems={'center'} justifyContent={'center'} gap={2}>
                <ErrorIcon/>
                <Typography variant={'h6'}>{error}</Typography>
              </Stack>
            </TableCell>
          </TableRow> : null}
          {guilds?.map(({ totalGp, leader, membersCount, guildIcon, guildName, topContributors }, index) => {
            const guildLevel = getGuildLevel(totalGp);
            const maxMembers = 30 + 4 * guildLevel;
            return <React.Fragment key={'row' + index}>
              <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell sx={{ p: '4px' }}>
                  <IconButton
                    aria-label="expand row"
                    size="small"
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}>
                    {openIndex === index ? <KeyboardArrowUpIcon/> : <KeyboardArrowDownIcon/>}
                  </IconButton>
                </TableCell>
                <TableCell sx={{ p: 1, textAlign: 'center' }}>
                  {index + 1}
                </TableCell>


                <TableCell>
                  <Stack direction={'row'} alignItems={'center'} gap={1}>
                    <img src={`${prefix}data/G2icon${guildIcon}.png`}
                         style={{ width: 24 }}
                         alt={'guild-icon'}/>
                    <Typography>{guildName}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>{numberWithCommas(totalGp)}</TableCell>
                <TableCell>{leader?.a}</TableCell>
                <TableCell>{guildLevel}</TableCell>
                <TableCell>{membersCount} / {maxMembers}</TableCell>
              </TableRow>
              <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                  <Collapse in={openIndex === index} timeout="auto" unmountOnExit>
                    <Box sx={{ p: 1 }}>
                      <Typography variant={'h6'} sx={{ mb: 1 }}>Top Contributors</Typography>
                      <Table size="small" sx={{ width: 300 }}>
                        <TableHead>
                          <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Gp</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {topContributors?.map(({ name, gpEarned }) => {
                            return <TableRow key={`top-3-${name}`}>
                              <TableCell>{name}</TableCell>
                              <TableCell>{numberWithCommas(gpEarned)}</TableCell>
                            </TableRow>
                          })}
                        </TableBody>
                      </Table>
                    </Box>
                  </Collapse>
                </TableCell>
              </TableRow>
            </React.Fragment>
          })}
        </TableBody>
      </Table>
    </TableContainer>
  </>
};

export default Guilds;
