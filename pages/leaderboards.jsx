import {
  Autocomplete,
  Card,
  CardContent,
  CircularProgress,
  createFilterOptions,
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
import { fetchLeaderboard } from '../services/profiles';
import Box from '@mui/material/Box';

const filterOptions = createFilterOptions({
  trim: true,
  limit: 50
});

const tabs = ['general', 'tasks', 'skills', 'character', 'misc'];
const Leaderboards = () => {
  const { state } = useContext(AppContext);
  const loggedMainChar = state?.characters?.[0]?.name;
  const [leaderboards, setLeaderboards] = useState(null);
  const [error, setError] = React.useState('');
  const [searchedChar, setSearchChar] = useState('');
  const [selectedTab, setSelectedTab] = useState('general');

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
    <Box
      sx={{ width: 'fit-content', margin: '16px auto', border: 'none' }}>
      <Autocomplete
        loading={!leaderboards?.totalUsers}
        options={Object.values(leaderboards?.[selectedTab] || {})?.[0] || []}
        getOptionLabel={(option) => option.mainChar}
        id="user-search"
        filterOptions={filterOptions}
        sx={{ width: 230 }}
        value={searchedChar || null}
        onChange={(event, newValue) => setSearchChar(newValue)}
        renderInput={(params) => <TextField {...params} label="Search by character name" variant="standard"/>}
      />
    </Box>
    <Tabber
      tabs={['General', 'Tasks', 'Skills', 'Character', 'Misc']} onTabChange={(selected) => {
      setSelectedTab(tabs?.[selected]);
      setLeaderboards(null);
      setError('');
    }}>
      <LeaderboardSection leaderboards={leaderboards?.general} loggedMainChar={loggedMainChar}
                          searchedChar={searchedChar?.mainChar}/>
      <LeaderboardSection leaderboards={leaderboards?.tasks} loggedMainChar={loggedMainChar}
                          searchedChar={searchedChar?.mainChar}/>
      <LeaderboardSection leaderboards={leaderboards?.skills} loggedMainChar={loggedMainChar}
                          searchedChar={searchedChar?.mainChar}/>
      <LeaderboardSection leaderboards={leaderboards?.character} loggedMainChar={loggedMainChar}
                          searchedChar={searchedChar?.mainChar}/>
      <LeaderboardSection leaderboards={leaderboards?.misc} loggedMainChar={loggedMainChar}
                          searchedChar={searchedChar?.mainChar}/>
    </Tabber>
    {!leaderboards && !error
      ? <Stack alignItems={'center'} justifyContent={'center'} mt={3}><CircularProgress/></Stack>
      : error ?
        <Typography color={'error.light'} textAlign={'center'} variant={'h6'}>{error}</Typography> : null}
  </>
};

export default Leaderboards;
