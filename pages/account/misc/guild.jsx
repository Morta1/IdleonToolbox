import { NextSeo } from 'next-seo';
import { Button, Stack, Typography } from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../../components/common/context/AppProvider';
import Tabber from '../../../components/common/Tabber';
import GuildMembers from '../../../components/account/Guild/GuildMembers';
import GuildBonuses from '../../../components/account/Guild/GuildBonuses';
import { numberWithCommas, prefix, tryToParse } from '@utility/helpers';
import ProgressBar from '../../../components/common/ProgressBar';
import useFormatDate from '@hooks/useFormatDate';
import Box from '@mui/material/Box';
import Popper from '@components/common/Popper';
import { CLIPBOARD_ERROR_MESSAGE, copyText } from '@utility/clipboard';
import { OPT } from '@parsers/accountOptions';
import { CardTitleAndValue } from '@components/common/styles';

const Guild = () => {
  const { state } = useContext(AppContext);
  const formatDate = useFormatDate();
  const { guild } = state?.account || {};
  const [dataTimestamp, setDataTimestamp] = useState([]);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [popperMessage, setPopperMessage] = React.useState(null);
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
    const target = e.currentTarget;
    let copied = false;
    try {
      const exportedData = {
        date: formatDate(new Date()),
        members: guild?.members?.map(({ name, gpEarned }) => ({ name, gpEarned }))
      }
      copied = await copyText(JSON.stringify(exportedData, null, 2));
    } catch (e) {
      console.error('exportToJson -> ', e);
    }
    setPopperMessage(copied ? null : CLIPBOARD_ERROR_MESSAGE);
    setAnchorEl(target);
  }

  const onClear = () => {
    localStorage.removeItem('guild');
    setDataTimestamp([]);
  }

  if (!guild?.unlocked || guild?.members?.length === 0) {
    return <>
      <GuildSeo/>

      <Typography variant={'h5'} mb={2}>Guild bonuses</Typography>
      <GuildBonuses bonuses={guild?.guildBonuses}/>
    </>
  }

  return <>
    <GuildSeo/>
    <Stack>
      <Stack direction={'row'} alignItems={'center'} gap={1}>
        <img src={`${prefix}data/G2icon${state?.account?.accountOptions?.[OPT.guildIcon]}.png`}
             alt={'guild-icon'}/>
        <Typography variant={'h3'}>{state?.account?.accountOptions?.[OPT.guildName]} <Typography component="span"
                                                                                      variant={'h5'}>({guild?.members?.length} / {guild?.maxMembers})</Typography></Typography>
      </Stack>
      <Stack mt={{ xs: 0, md: 3 }} mb={{ xs: 1, md: 4 }} direction={'row'} gap={2} flexWrap={'wrap'}>
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
              {[...dataTimestamp].reverse()?.map(({ timestamp }, index) => {
                return <Typography
                  key={timestamp + index}>#{index + 1} - {formatDate(new Date(timestamp))}</Typography>
              })}
            </Box>
            <Stack direction={'row'} alignItems={'center'} gap={2}>
              <Button variant={'contained'} onClick={saveToLS}>Save</Button>
              <Button variant={'outlined'} onClick={exportToJson}>Export</Button>
              <Popper anchorEl={anchorEl} handleClose={() => setAnchorEl(null)} message={popperMessage ?? undefined}/>
              <Button color={'error'} onClick={onClear} sx={{ color: 'text.error' }}>Clear all</Button>
            </Stack>
            {error ? <Typography color={'text.error'}>{error}</Typography> : null}
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

const GuildSeo = () => <NextSeo
  title="Guild | Idleon Toolbox"
  description="Keep track of your guild members, gp, bonuses and more"
/>;


export default Guild;
