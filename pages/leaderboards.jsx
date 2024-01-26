import {
  Autocomplete,
  Card,
  CardContent,
  CircularProgress,
  createFilterOptions,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import Tabber from '../components/common/Tabber';
import LeaderboardSection from '../components/Leaderboard';
import React, { useContext, useEffect } from 'react';
import { AppContext } from '@components/common/context/AppProvider';
import { NextSeo } from 'next-seo';
import { fetchLeaderboards } from '../services/profiles';
import Box from '@mui/material/Box';

const filterOptions = createFilterOptions({
  trim: true,
  limit: 50
});

const Leaderboards = () => {
  const { state } = useContext(AppContext);
  const loggedMainChar = state?.characters?.[0]?.name;
  const [leaderboards, setLeaderboards] = React.useState();
  const [error, setError] = React.useState('');
  const [searchedChar, setSearchChar] = React.useState('');

  useEffect(() => {
    const getLeaderboards = async () => {
      try {
        const tempLeaderboards = await fetchLeaderboards();
        setLeaderboards(tempLeaderboards);
        setError('');
      } catch (e) {
        setError('Error has occurred while getting leaderboards');
      }
    };

    getLeaderboards();
  }, []);

  return <>
    <NextSeo
      title="Leaderboards | Idleon Toolbox"
      description="Leaderboards for Idleon MMO"
    />
    <Typography textAlign={'center'}
                variant={'h2'}>Leaderboards</Typography>
    <Typography mb={3} textAlign={'center'} sx={{ fontSize: 14 }} component={'div'} variant={'caption'}>* To participate
      in the
      leaderboards, please upload your profile with leaderboard consent.</Typography>
    {leaderboards?.general?.totalMoney?.length ? <Card variant={'outlined'} sx={{
      width: 'fit-content',
      margin: '16px auto',
      borderColor: 'success.light'
    }}>
      <CardContent sx={{ '&:last-child': { p: 1 } }}>
        <Typography textAlign={'center'} sx={{ fontSize: 14 }} component={'div'} variant={'caption'}>Uploaded
          accounts: {leaderboards?.general?.totalMoney?.length}</Typography>
      </CardContent>
    </Card> : null}
    {leaderboards?.general?.totalMoney?.length ? <Box
      sx={{ width: 'fit-content', margin: '16px auto', border: 'none' }}>
      <Autocomplete
        options={leaderboards?.general?.totalMoney}
        getOptionLabel={(option) => option.mainChar}
        id="user-search"
        filterOptions={filterOptions}
        sx={{ width: 230 }}
        value={searchedChar || null}
        onChange={(event, newValue) => setSearchChar(newValue)}
        renderInput={(params) => <TextField {...params} label="Search by character name" variant="standard"/>}
      />
    </Box> : null}

    {!leaderboards && !error ? <Stack alignItems={'center'} justifyContent={'center'} mt={3}><CircularProgress/></Stack> : error ?
      <Typography color={'error.light'} textAlign={'center'} variant={'h6'}>{error}</Typography> : <Tabber
        tabs={['General', 'Tasks', 'Skills', 'Character', 'Misc']}>
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
      </Tabber>}

  </>
};

export default Leaderboards;
