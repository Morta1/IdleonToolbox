import {
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  Skeleton,
  Snackbar,
  Stack,
  TextField,
  Typography,
  useMediaQuery
} from '@mui/material';
import Tabber from '../components/common/Tabber';
import LeaderboardSection from '../components/Leaderboard';
import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { fetchLeaderboard, fetchUserLeaderboards } from '../services/profiles';
import Box from '@mui/material/Box';
import { IconSearch } from '@tabler/icons-react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { numberWithCommas } from '@utility/helpers';

const tabs = ['Global', 'General', 'Tasks', 'Skills', 'Character', 'Misc', 'Caverns'];
const Leaderboards = () => {
  const { state } = useContext(AppContext);
  const isSm = useMediaQuery((theme) => theme.breakpoints.down('sm'), { noSsr: true });
  const loggedMainChar = state?.characters?.[0]?.name;
  const [leaderboards, setLeaderboards] = useState(null);
  const [error, setError] = React.useState('');
  const [inputValue, setInputValue] = useState('');
  const [searchedChar, setSearchChar] = useState('');
  const router = useRouter();
  const { t } = router.query;
  const [selectedTab, setSelectedTab] = useState(t?.toLowerCase() || 'global');
  const [loadingSearchedChar, setLoadingSearchedChar] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });

  const isUserFullyExistLocally = (data, username) => {
    for (const category in data) {
      if (!data[category].some(item => item.mainChar === username)) {
        return false;
      }
    }
    return true;
  }
  const searchUserAndAppend = (data, username, userStats) => {
    const newData = {};
    for (const category in data) {
      const categoryData = data[category];
      const stats = userStats[category];

      if (Array.isArray(stats)) {
        const newEntries = stats.filter(e => !categoryData.some(item => item.mainChar === e.mainChar));
        newData[category] = [...categoryData, ...newEntries];
      } else {
        const found = categoryData.some(item => item.mainChar === username);
        if (!found) {
          if (stats !== undefined) {
            newData[category] = [...categoryData, { mainChar: username, ...stats }];
          } else {
            newData[category] = [...categoryData, { mainChar: username }];
          }
        } else {
          newData[category] = categoryData;
        }
      }
    }
    return newData;
  }

  useEffect(() => {
    const getLeaderboards = async () => {
      try {
        const tempLeaderboards = await fetchLeaderboard(selectedTab.toLowerCase());
        const tab = selectedTab.toLowerCase();
        const usersToFetch = [loggedMainChar, searchedChar].filter(Boolean);
        for (const user of usersToFetch) {
          const data = tempLeaderboards[tab];
          if (data && !isUserFullyExistLocally(data, user)) {
            const userStats = await fetchUserLeaderboards(tab, user);
            if (userStats && !userStats.error) {
              tempLeaderboards[tab] = searchUserAndAppend(data, user, userStats);
            }
          }
        }
        setLeaderboards(tempLeaderboards);
        setError('');
      } catch (e) {
        setError('Error has occurred while getting leaderboards');
      }
    };

    getLeaderboards();
  }, [selectedTab]);

  const handleKeyDown = (event) => {
    if (!inputValue || loadingSearchedChar) return;
    if (event.key === 'Enter') {
      handleUserSearch();
    }
  }

  const handleUserSearch = async () => {
    if (!inputValue) return;
    const searchValue = inputValue.trim();
    if (!searchValue) return;

    setSearchChar(searchValue);

    const isInTopN = isUserFullyExistLocally(leaderboards[selectedTab.toLowerCase()], searchValue);
    if (isInTopN && selectedTab.toLowerCase() !== 'global') return;

    setLoadingSearchedChar(true);
    const response = await fetchUserLeaderboards(selectedTab.toLowerCase(), searchValue);
    if (!response || response?.error) {
      setLoadingSearchedChar(false);
      setToast({ open: true, message: response?.error || 'Error fetching user data', severity: 'error' });
      return;
    }
    const updateLeaderboards = searchUserAndAppend(leaderboards[selectedTab.toLowerCase()], searchValue, response);
    setLeaderboards({ ...leaderboards, [selectedTab.toLowerCase()]: updateLeaderboards });
    setLoadingSearchedChar(false);
  }

  return <>
    <NextSeo
      title="Leaderboards | Idleon Toolbox"
      description="View Legends of Idleon leaderboards for skills, tasks, characters, caverns, and more with player rankings and stats"
    />
    <Box sx={{ maxWidth: '300px', margin: '16px auto 0 auto', border: 'none' }}>
      <TextField
        fullWidth
        size={'small'} value={inputValue || ''}
        label={isSm ? 'Char name' : 'Character name'}
        onChange={(event) => {
          setInputValue(event.target.value);
        }}
        onKeyDown={handleKeyDown}
        slotProps={{
          input: {
            endAdornment: <InputAdornment position="end"><IconButton
              loading={loadingSearchedChar}
              disabled={!leaderboards?.totalUsers || loadingSearchedChar} onClick={handleUserSearch}>
              <IconSearch />
            </IconButton></InputAdornment>
          }
        }}
      />
      <Typography sx={{ ml: 1 }} variant={'caption'} color={'text.secondary'}>Press Enter to search
        globally</Typography>
    </Box>
    <Box sx={{ maxWidth: '300px', margin: '16px auto', textAlign: 'center' }}>
      {!leaderboards?.totalUsers ? <Skeleton sx={{ width: 300, margin: '0 auto' }}
        variant={'text'} /> : <Stack direction={'row'}
          gap={1}
          justifyContent={'center'}
          divider={<Divider
            flexItem
            sx={{ bgcolor: '#a9b3a6' }}
            orientation={'vertical'} />}>
        <Stack flexWrap={'wrap'} direction={'row'} gap={1} justifyContent={'center'} alignItems={'center'}>
          <Typography sx={{ fontSize: 14 }} component={'div'}>{numberWithCommas(leaderboards?.totalUsers)}</Typography>
          <Typography sx={{ fontSize: 14 }}>Accounts</Typography>
        </Stack>
        {leaderboards?.createdAt ? <Stack flexWrap={'wrap'} direction={'row'} gap={1} justifyContent={'center'} alignItems={'center'}>
          <Typography sx={{ fontSize: 14 }}>Updated at</Typography>
          <Typography sx={{ fontSize: 14 }} component={'div'}>{format(leaderboards?.createdAt, 'HH:mm:ss')}</Typography>
        </Stack> : null}
      </Stack>}
    </Box>
    <Tabber
      tabs={tabs} onTabChange={(selected) => {
        setSelectedTab(tabs?.[selected]);
        setLeaderboards(null);
        setError('');
      }}>
      <LeaderboardSection leaderboards={leaderboards?.global} loggedMainChar={loggedMainChar}
        searchedChar={searchedChar} />
      <LeaderboardSection leaderboards={leaderboards?.general} loggedMainChar={loggedMainChar}
        searchedChar={searchedChar} />
      <LeaderboardSection leaderboards={leaderboards?.tasks} loggedMainChar={loggedMainChar}
        searchedChar={searchedChar} />
      <LeaderboardSection leaderboards={leaderboards?.skills} loggedMainChar={loggedMainChar}
        searchedChar={searchedChar} />
      <LeaderboardSection leaderboards={leaderboards?.character} loggedMainChar={loggedMainChar}
        searchedChar={searchedChar} />
      <LeaderboardSection leaderboards={leaderboards?.misc} loggedMainChar={loggedMainChar}
        searchedChar={searchedChar} />
      <LeaderboardSection leaderboards={leaderboards?.caverns} loggedMainChar={loggedMainChar}
        searchedChar={searchedChar} />
    </Tabber>
    {!leaderboards && !error
      ? <Stack alignItems={'center'} justifyContent={'center'} mt={3}><CircularProgress /></Stack>
      : error ?
        <Typography color={'error.light'} textAlign={'center'} variant={'h6'}>{error}</Typography> : null}
    <Snackbar
      open={toast.open}
      autoHideDuration={6000}
      onClose={() => setToast({ ...toast, open: false })}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        onClose={() => setToast({ ...toast, open: false })}
        severity={toast.severity}
        sx={{ width: '100%' }}
      >
        {toast.message}
      </Alert>
    </Snackbar>
  </>
};

export default Leaderboards;
