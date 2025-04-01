import {
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  InputAdornment,
  Skeleton,
  Stack,
  TextField,
  Typography
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

const defaultText = 'If you don\'t see your name in the top 10, search for your character’s name here.';

const tabs = ['general', 'tasks', 'skills', 'character', 'misc'];
const Leaderboards = () => {
  const { state } = useContext(AppContext);
  const loggedMainChar = state?.characters?.[0]?.name;
  const [leaderboards, setLeaderboards] = useState(null);
  const [error, setError] = React.useState('');
  const [searchedChar, setSearchChar] = useState('');
  const router = useRouter();
  const { t } = router.query;
  const [selectedTab, setSelectedTab] = useState(t.toLowerCase() || 'general');
  const [loadingSearchedChar, setLoadingSearchedChar] = useState(false);
  const [helperText, setHelperText] = useState(defaultText);

  useEffect(() => {
    const getLeaderboards = async () => {
      try {
        const tempLeaderboards = await fetchLeaderboard(selectedTab);
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
        } else {
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
    const userFullyExistsLocally = isUserFullyExistLocally(leaderboards[selectedTab], searchedChar);
    if (!userFullyExistsLocally) {
      setLoadingSearchedChar(true);
      const response = await fetchUserLeaderboards(selectedTab, searchedChar);
      if (!response || response?.error) {
        setLoadingSearchedChar(false);
        return setHelperText(response?.error);
      }
      const updateLeaderboards = searchUserAndAppend(leaderboards[selectedTab], searchedChar, response);
      setLeaderboards({ ...leaderboards, [selectedTab]: updateLeaderboards });
      setLoadingSearchedChar(false);
    }
  }

  return <>
    <NextSeo
      title="Leaderboards | Idleon Toolbox"
      description="Leaderboards for Legends Of Idleon MMO"
    />
    <Card variant={'outlined'}
          sx={{
            width: '180px',
            margin: '16px auto',
            borderColor: 'success.light'
          }}>
      <CardContent sx={{ '&:last-child': { p: 1 } }}>
        <Typography textAlign={'center'} sx={{ fontSize: 14 }}> Uploaded accounts:</Typography>
        <Typography textAlign={'center'} variant={'body2'} component={'div'}>{!leaderboards?.totalUsers
          ? <Skeleton sx={{ width: 100, margin: '0 auto' }} variant={'text'}/>
          : leaderboards?.totalUsers}</Typography>
      </CardContent>
    </Card>
    <Box sx={{ width: 'fit-content', margin: '16px auto', border: 'none' }}>
      <TextField
        sx={{ width: 360 }}
        size={'small'} value={searchedChar || ''}
        label="Search by character name"
        onChange={(event) => {
          setSearchChar(event.target.value);
          setHelperText(defaultText);
        }}
        onKeyDown={handleKeyDown}
        slotProps={{
          input: {
            endAdornment: <InputAdornment position="end"><IconButton
              disabled={!leaderboards?.totalUsers || loadingSearchedChar} onClick={handleUserSearch}>
              <IconSearch/>
            </IconButton></InputAdornment>
          }
        }}
        error={helperText !== defaultText}
        helperText={helperText}
      />
    </Box>
    <Tabber
      tabs={['General', 'Tasks', 'Skills', 'Character', 'Misc']} onTabChange={(selected) => {
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
    </Tabber>
    {!leaderboards && !error
      ? <Stack alignItems={'center'} justifyContent={'center'} mt={3}><CircularProgress/></Stack>
      : error ?
        <Typography color={'error.light'} textAlign={'center'} variant={'h6'}>{error}</Typography> : null}
  </>
};

export default Leaderboards;
