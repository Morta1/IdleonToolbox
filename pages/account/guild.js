import { NextSeo } from 'next-seo';
import { Button, Card, CardContent, Stack, Typography } from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../components/common/context/AppProvider';
import Tabber from '../../components/common/Tabber';
import GuildMembers from '../../components/account/Guild/GuildMembers';
import GuildBonuses from '../../components/account/Guild/GuildBonuses';
import { numberWithCommas, prefix, tryToParse } from '../../utility/helpers';
import ProgressBar from '../../components/common/ProgressBar';
import { format } from 'date-fns';

const Guild = () => {
  const { state } = useContext(AppContext);
  const { guild } = state?.account;
  const [dataTimestamp, setDataTimestamp] = useState();
  const [guildChanges, setGuildChanges] = useState();
  const [error, setError] = useState('');

  if (!guild || guild?.members?.length === 0) {
    return <Typography variant={'h3'} mb={3}>You have to be in a guild to view this page's content</Typography>
  }

  useEffect(() => {
    const lsData = tryToParse(localStorage.getItem('guild'));
    if (lsData?.timestamp) {
      setDataTimestamp(lsData?.timestamp);
    }
  }, [])

  const saveToLS = () => {
    const timestamp = new Date().getTime();
    setDataTimestamp(timestamp);
    localStorage.setItem('guild', JSON.stringify({
      timestamp,
      members: guild?.members
    }));
    setError('')
  }

  const compareFromLS = () => {
    const newData = tryToParse(localStorage.getItem('guild'));
    if (!newData) {
      return setError('Missing save to compare to')
    }
    setGuildChanges(newData);
  }

  const exportToJson = async () => {
    try {
      const exportedData = {
        date: format(new Date(), 'dd/MM/yyyy HH:mm:ss'),
        members: guild?.members
      }
      await navigator.clipboard.writeText(JSON.stringify(exportedData));
    } catch (e) {
      console.error('exportToJson -> ', e);
    }
  }

  return <>
    <NextSeo
      title="Idleon Toolbox | Guild"
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
        <CardTitleAndValue title={'Utility'}>
          <Stack gap={1}>
            {dataTimestamp ? <Typography variant={'caption'}>Data
              from: {format(new Date(dataTimestamp), 'dd/MM/yyyy HH:mm:ss')}</Typography> : null}
            <Stack direction={'row'} alignItems={'center'} gap={2}>
              <Button variant={'contained'} onClick={saveToLS}>Save</Button>
              <Button variant={'contained'} onClick={compareFromLS}>Compare</Button>
              <Button variant={'contained'} onClick={exportToJson}>Export</Button>
            </Stack>
            {error ? <Typography color={'error.light'}>{error}</Typography> : null}
          </Stack>
        </CardTitleAndValue>
      </Stack>
    </Stack>
    <Tabber tabs={['Members', 'Bonuses']}>
      <GuildMembers members={guild?.members} changes={guildChanges}/>
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
