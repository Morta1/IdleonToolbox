import { NextSeo } from 'next-seo';
import { Button, Card, CardContent, Stack, Typography } from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../../components/common/context/AppProvider';
import Tabber from '../../../components/common/Tabber';
import GuildMembers from '../../../components/account/Guild/GuildMembers';
import GuildBonuses from '../../../components/account/Guild/GuildBonuses';
import { numberWithCommas, prefix, tryToParse } from '../../../utility/helpers';
import ProgressBar from '../../../components/common/ProgressBar';
import { format } from 'date-fns';
import Box from '@mui/material/Box';
import Popper from '@components/common/Popper';

const Guild = () => {
  const { state } = useContext(AppContext);
  const { guild } = state?.account || {};
  const [dataTimestamp, setDataTimestamp] = useState([]);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const lsData = tryToParse(localStorage.getItem('guild'));
    if (lsData) {
      setDataTimestamp(Array.isArray(lsData) ? lsData : [lsData]);
    }
  }, [])

  const saveToLS = () => {
    const timestamp = new Date().getTime();
    let currentSaves = tryToParse(localStorage.getItem('guild'));
    let saves
    if (Array.isArray(currentSaves)) {
      currentSaves = currentSaves?.length >= 3 ? currentSaves?.slice(1) : currentSaves;
      saves = [...(currentSaves || []), {
        timestamp,
        members: guild?.members
      }]
    } else {
      if (currentSaves) {
        saves = [currentSaves, {
          timestamp,
          members: guild?.members
        }]
      } else {
        saves = [{
          timestamp,
          members: guild?.members
        }]
      }
    }
    setDataTimestamp(saves)
    localStorage.setItem('guild', JSON.stringify(saves));
    setError('')
  }

  const exportToJson = async (e) => {
    setAnchorEl(e.currentTarget)
    try {
      const exportedData = {
        date: format(new Date(), 'dd/MM/yyyy HH:mm:ss'),
        members: guild?.members?.map(({ name, gpEarned }) => ({ name, gpEarned }))
      }
      await navigator.clipboard.writeText(JSON.stringify(exportedData, null, 2));
    } catch (e) {
      console.error('exportToJson -> ', e);
    }
  }

  const onClear = () => {
    localStorage.removeItem('guild');
    setDataTimestamp([]);
  }

  if (!guild || guild?.members?.length === 0) {
    return <Typography variant={'h3'} mb={3}>You have to be in a guild to view this page's content</Typography>
  }

  return <>
    <NextSeo
      title="Guild | Idleon Toolbox"
      description="Keep track of your guild members, gp, bonuses and more"
    />
    <Stack>
      <Stack direction={'row'} alignItems={'center'} gap={1}>
        <img src={`${prefix}data/G2icon${state?.account?.accountOptions?.[38]}.png`}
             alt={'guild-icon'}/>
        <Typography variant={'h3'}>{state?.account?.accountOptions?.[37]} <Typography component="span"
                                                                                      variant={'h5'}>({guild?.members?.length} / {guild?.maxMembers})</Typography></Typography>
      </Stack>
      <Stack sx={{ mb: 1 }} direction={'row'} gap={2} flexWrap={'wrap'}>
        <CardTitleAndValue title={'Members'} value={`${guild?.members?.length} / ${guild?.maxMembers}`}/>
        <CardTitleAndValue title={'Exp'}>
          <ProgressBar boxSx={{ width: 200 }}
                       percent={guild?.totalGp / Math.round(guild?.levelReq) * 100}
                       bgColor={'#f3dd4c'}/>
          <Typography>{numberWithCommas(guild?.totalGp)} / {numberWithCommas(Math.round(guild?.levelReq))}</Typography>
        </CardTitleAndValue>
        <CardTitleAndValue title={'Saves (up to 3)'}>
          <Stack gap={1}>
            <Box>
              {dataTimestamp?.reverse()?.map(({ timestamp }, index) => {
                return <Typography
                  key={timestamp + index}>#{index + 1} - {format(new Date(timestamp), 'dd/MM/yyyy HH:mm:ss')}</Typography>
              })}
            </Box>
            <Stack direction={'row'} alignItems={'center'} gap={2}>
              <Button variant={'contained'} onClick={saveToLS}>Save</Button>
              <Button variant={'contained'} onClick={exportToJson}>Export</Button>
              <Popper anchorEl={anchorEl} handleClose={() => setAnchorEl(null)}/>
              <Button variant={'contained'} color={'warning'} onClick={onClear}>Clear
                all</Button>
            </Stack>
            {error ? <Typography color={'error.light'}>{error}</Typography> : null}
          </Stack>
        </CardTitleAndValue>
      </Stack>
    </Stack>
    <Tabber tabs={['Members', 'Bonuses']}>
      <GuildMembers members={guild?.members} saves={dataTimestamp}/>
      <GuildBonuses bonuses={guild?.guildBonuses}/>
    </Tabber>
  </>
};

const CardTitleAndValue = ({ cardSx, title, value, children }) => {
  return <Card sx={{ my: { xs: 0, md: 3 }, width: 'fit-content', ...cardSx }}>
    <CardContent>
      <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>{title}</Typography>
      {value ? <Typography>{value}</Typography> : children}
    </CardContent>
  </Card>
}

export default Guild;
