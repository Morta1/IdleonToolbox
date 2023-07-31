import { NextSeo } from 'next-seo';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import React, { useContext } from 'react';
import { AppContext } from '../../components/common/context/AppProvider';
import Tabber from '../../components/common/Tabber';
import GuildMembers from '../../components/account/Guild/GuildMembers';
import GuildBonuses from '../../components/account/Guild/GuildBonuses';
import { numberWithCommas, prefix } from '../../utility/helpers';
import ProgressBar from '../../components/common/ProgressBar';

const Guild = () => {
  const { state } = useContext(AppContext);
  const { guild } = state?.account;
  if (!guild || guild?.members?.length === 0) {
    return <Typography variant={'h3'} mb={3}>You have to be in a guild to view this page's content</Typography>
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
      </Stack>
    </Stack>
    <Tabber tabs={['Members', 'Bonuses']}>
      <GuildMembers members={guild?.members}/>
      <GuildBonuses bonuses={guild?.guildBonuses} />
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
