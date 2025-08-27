import {
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  Skeleton,
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

const tabs = ['General', 'Tasks', 'Skills', 'Character', 'Misc', 'Caverns'];
const Leaderboards = () => {
  const { state } = useContext(AppContext);
  const isSm = useMediaQuery((theme) => theme.breakpoints.down('sm'), { noSsr: true });
  const loggedMainChar = state?.characters?.[0]?.name;
  const [leaderboards, setLeaderboards] = useState(null);
  const [error, setError] = React.useState('');
  const [searchedChar, setSearchChar] = useState('');
  const router = useRouter();
  const { t } = router.query;
  const [selectedTab, setSelectedTab] = useState(t?.toLowerCase() || 'general');
  const [loadingSearchedChar, setLoadingSearchedChar] = useState(false);
  const [helperText, setHelperText] = useState('');

  useEffect(() => {
    const getLeaderboards = async () => {
      try {
        const tempLeaderboards = await fetchLeaderboard(selectedTab.toLowerCase());
        setLeaderboards(tempLeaderboards);
        setError('');
      } catch (e) {
        setError('Error has occurred while getting leaderboards');
      }
    };

    getLeaderboards();
  }, [selectedTab]);

  const isUserFullyExistLocally = (data, username) => {
    for (const category in data) {
      if (!data[category].some(item => item.mainChar === username)) {
        return false;
      }
    }
    return true;
  }
  const searchUserAndAppend = (data, username, userStats) => {
    for (const category in data) {
      const categoryData = data[category];
      const found = categoryData.some(item => item.mainChar === username);

      if (!found) {
        // Append the user's actual stats if they exist
        if (userStats[category] !== undefined) {
          data[category].push({ mainChar: username, ...userStats[category] });
        }
        else {
          data[category].push({ mainChar: username });
        }
      }
    }
    return data;
  }
  const handleKeyDown = (event) => {
    if (!searchedChar || loadingSearchedChar) return;
    if (event.key === 'Enter') {
      handleUserSearch();
    }
  }
  const handleUserSearch = async () => {
    if (!searchedChar) return;
    const userFullyExistsLocally = isUserFullyExistLocally(leaderboards[selectedTab.toLowerCase()], searchedChar);
    if (!userFullyExistsLocally) {
      setLoadingSearchedChar(true);
      const response = await fetchUserLeaderboards(selectedTab.toLowerCase(), searchedChar);
      if (!response || response?.error) {
        setLoadingSearchedChar(false);
        return setHelperText(response?.error);
      }
      const updateLeaderboards = searchUserAndAppend(leaderboards[selectedTab.toLowerCase()], searchedChar, response);
      setLeaderboards({ ...leaderboards, [selectedTab.toLowerCase()]: updateLeaderboards });
      setLoadingSearchedChar(false);
    }
  }

  return <>
    <NextSeo
      title="Leaderboards | Idleon Toolbox"
      description="Leaderboards for Legends Of Idleon MMO"
    />
    <Box sx={{ maxWidth: '300px', margin: '16px auto 0 auto', border: 'none' }}>
      <TextField
        fullWidth
        size={'small'} value={searchedChar || ''}
        label={isSm ? 'Char name' : 'Character name'}
        onChange={(event) => {
          setSearchChar(event.target.value);
          setHelperText('');
        }}
        onKeyDown={handleKeyDown}
        slotProps={{
          input: {
            endAdornment: <InputAdornment position="end"><IconButton
              loading={loadingSearchedChar}
              disabled={!leaderboards?.totalUsers || loadingSearchedChar} onClick={handleUserSearch}>
              <IconSearch/>
            </IconButton></InputAdornment>
          }
        }}
        error={helperText !== ''}
        helperText={helperText}
      />
      {!helperText ? <Typography sx={{ ml: 1 }} variant={'caption'} color={'text.secondary'}>Press Enter to search
        globally</Typography> : null}
    </Box>
    <Box sx={{ maxWidth: '300px', margin: '16px auto', textAlign: 'center' }}>
      {!leaderboards?.totalUsers || !leaderboards?.createdAt ? <Skeleton sx={{ width: 300, margin: '0 auto' }}
                                                                         variant={'text'}/> : <Stack direction={'row'}
                                                                                                     gap={1}
                                                                                                     justifyContent={'center'}
                                                                                                     divider={<Divider
                                                                                                       flexItem
                                                                                                       sx={{ bgcolor: '#a9b3a6' }}
                                                                                                       orientation={'vertical'}/>}>
        <Stack flexWrap={'wrap'} direction={'row'} gap={1} justifyContent={'center'} alignItems={'center'}>
          <Typography sx={{ fontSize: 14 }} component={'div'}>{numberWithCommas(leaderboards?.totalUsers)}</Typography>

          <Typography sx={{ fontSize: 14 }}>Accounts</Typography>
        </Stack>
        <Stack flexWrap={'wrap'} direction={'row'} gap={1} justifyContent={'center'} alignItems={'center'}>
          <Typography sx={{ fontSize: 14 }}>Updated at</Typography>
          <Typography sx={{ fontSize: 14 }} component={'div'}>{format(leaderboards?.createdAt, 'HH:mm:ss')}</Typography>
        </Stack>
      </Stack>}

    </Box>
    <Tabber
      tabs={tabs} onTabChange={(selected) => {
      setSelectedTab(tabs?.[selected]);
      setLeaderboards(null);
      setError('');
    }}>
      <LeaderboardSection leaderboards={leaderboards?.general} loggedMainChar={loggedMainChar}
                          searchedChar={searchedChar}/>
      <LeaderboardSection leaderboards={leaderboards?.tasks} loggedMainChar={loggedMainChar}
                          searchedChar={searchedChar}/>
      <LeaderboardSection leaderboards={leaderboards?.skills} loggedMainChar={loggedMainChar}
                          searchedChar={searchedChar}/>
      <LeaderboardSection leaderboards={leaderboards?.character} loggedMainChar={loggedMainChar}
                          searchedChar={searchedChar}/>
      <LeaderboardSection leaderboards={leaderboards?.misc} loggedMainChar={loggedMainChar}
                          searchedChar={searchedChar}/>
      <LeaderboardSection leaderboards={leaderboards?.caverns} loggedMainChar={loggedMainChar}
                          searchedChar={searchedChar}/>
    </Tabber>
    {!leaderboards && !error
      ? <Stack alignItems={'center'} justifyContent={'center'} mt={3}><CircularProgress/></Stack>
      : error ?
        <Typography color={'error.light'} textAlign={'center'} variant={'h6'}>{error}</Typography> : null}
  </>
};

export default Leaderboards;
