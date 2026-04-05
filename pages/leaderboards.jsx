import {
  Alert,
  CircularProgress,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Skeleton,
  Snackbar,
  Stack,
  Switch,
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
import { useQuery, useQueryClient } from '@tanstack/react-query';

const tabs = ['Global', 'General', 'Tasks', 'Skills', 'Character', 'Misc', 'Caverns'];
const Leaderboards = () => {
  const { state } = useContext(AppContext);
  const isSm = useMediaQuery((theme) => theme.breakpoints.down('sm'), { noSsr: true });
  const loggedMainChar = state?.characters?.[0]?.name;
  const [inputValue, setInputValue] = useState('');
  const [searchedChar, setSearchChar] = useState('');
  const router = useRouter();
  const { t } = router.query;
  const [selectedTab, setSelectedTab] = useState(t?.toLowerCase() || 'global');
  const [loadingSearchedChar, setLoadingSearchedChar] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });
  const [showAnonymous, setShowAnonymous] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('leaderboard:showAnonymous') !== 'false';
  });
  const queryClient = useQueryClient();

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

  const AGGREGATION_INTERVAL = 1000 * 60 * 30; // 30 minutes

  const { data: leaderboards, isLoading, error } = useQuery({
    queryKey: ['leaderboard', selectedTab.toLowerCase()],
    queryFn: () => fetchLeaderboard(selectedTab.toLowerCase()),
    staleTime: (query) => {
      const createdAt = query.state.data?.createdAt;
      if (!createdAt) return AGGREGATION_INTERVAL;
      const nextRefresh = createdAt + AGGREGATION_INTERVAL;
      return Math.max(nextRefresh - Date.now(), 0);
    }
  });

  // Auto-fetch logged user and searched user after leaderboard data loads
  useEffect(() => {
    if (!leaderboards) return;
    const tab = selectedTab.toLowerCase();
    const data = leaderboards[tab];
    if (!data) return;

    const usersToFetch = [loggedMainChar, searchedChar].filter(Boolean);
    const fetchUsers = async () => {
      let updated = false;
      let updatedData = data;
      for (const user of usersToFetch) {
        const userExists = Object.values(updatedData).every(list =>
          Array.isArray(list) && list.some(item => item.mainChar === user)
        );
        if (!userExists) {
          const userStats = await fetchUserLeaderboards(tab, user);
          if (userStats && !userStats.error) {
            updatedData = searchUserAndAppend(updatedData, user, userStats);
            updated = true;
          }
        }
      }
      if (updated) {
        queryClient.setQueryData(['leaderboard', tab], (old) => {
          if (!old) return old;
          return { ...old, [tab]: updatedData };
        });
      }
    };
    fetchUsers();
  }, [leaderboards, loggedMainChar, searchedChar]);

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

    const tab = selectedTab.toLowerCase();
    const data = leaderboards?.[tab];
    const isInTopN = data && Object.values(data).every(list =>
      Array.isArray(list) && list.some(item => item.mainChar === searchValue)
    );
    if (isInTopN && tab !== 'global') return;

    setLoadingSearchedChar(true);
    const response = await fetchUserLeaderboards(tab, searchValue);
    if (!response || response?.error) {
      setLoadingSearchedChar(false);
      setToast({ open: true, message: response?.error || 'Error fetching user data', severity: 'error' });
      return;
    }
    // Update the cached query data
    queryClient.setQueryData(['leaderboard', tab], (old) => {
      if (!old?.[tab]) return old;
      return { ...old, [tab]: searchUserAndAppend(old[tab], searchValue, response) };
    });
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
    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
      <FormControlLabel
        control={<Switch checked={showAnonymous} onChange={() => {
          const next = !showAnonymous;
          setShowAnonymous(next);
          localStorage.setItem('leaderboard:showAnonymous', String(next));
        }} />}
        label="Show anonymous players"
      />
    </Box>
    <Tabber
      tabs={tabs} onTabChange={(selected) => {
        setSelectedTab(tabs?.[selected]);
      }}>
      <LeaderboardSection leaderboards={showAnonymous ? leaderboards?.global?.anonymous : leaderboards?.global?.public}
        loggedMainChar={loggedMainChar} searchedChar={searchedChar} />
      <LeaderboardSection leaderboards={showAnonymous ? leaderboards?.general?.anonymous : leaderboards?.general?.public}
        loggedMainChar={loggedMainChar} searchedChar={searchedChar} />
      <LeaderboardSection leaderboards={showAnonymous ? leaderboards?.tasks?.anonymous : leaderboards?.tasks?.public}
        loggedMainChar={loggedMainChar} searchedChar={searchedChar} />
      <LeaderboardSection leaderboards={showAnonymous ? leaderboards?.skills?.anonymous : leaderboards?.skills?.public}
        loggedMainChar={loggedMainChar} searchedChar={searchedChar} />
      <LeaderboardSection leaderboards={showAnonymous ? leaderboards?.character?.anonymous : leaderboards?.character?.public}
        loggedMainChar={loggedMainChar} searchedChar={searchedChar} />
      <LeaderboardSection leaderboards={showAnonymous ? leaderboards?.misc?.anonymous : leaderboards?.misc?.public}
        loggedMainChar={loggedMainChar} searchedChar={searchedChar} />
      <LeaderboardSection leaderboards={showAnonymous ? leaderboards?.caverns?.anonymous : leaderboards?.caverns?.public}
        loggedMainChar={loggedMainChar} searchedChar={searchedChar} />
    </Tabber>
    {isLoading && !error
      ? <Stack alignItems={'center'} justifyContent={'center'} mt={3}><CircularProgress /></Stack>
      : error ?
        <Typography color={'error.light'} textAlign={'center'} variant={'h6'}>Error has occurred while getting leaderboards</Typography> : null}
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
