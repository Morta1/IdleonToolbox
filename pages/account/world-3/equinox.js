import { Card, CardContent, Stack, Typography } from '@mui/material';
import React, { useContext } from 'react';
import { AppContext } from '../../../components/common/context/AppProvider';
import ProgressBar from '../../../components/common/ProgressBar';
import Timer from '../../../components/common/Timer';
import { cleanUnderscore, notateNumber, prefix } from '../../../utility/helpers';
import { NextSeo } from 'next-seo';
import { yellow } from '@mui/material/colors';
import Box from '@mui/material/Box';

const Equinox = () => {
  const { state } = useContext(AppContext);
  const equinox = state?.account?.equinox;
  if (!equinox) {
    return <Typography variant={'h2'} textAlign={'center'} mt={3}>Unlock Equinox first</Typography>;
  }
  return (
    <>
      <NextSeo
        title="Idleon Toolbox | Equinox"
        description="Equinox progression"
      />

      <Typography variant={'h2'} textAlign={'center'} mb={3}>Equinox</Typography>
      <Stack mb={1} direction={'row'} gap={{ xs: 1, md: 3 }} flexWrap={'wrap'}>
        <CardTitleAndValue title={'Speed'} value={Math.round(equinox.chargeRate) + '/hr'} width={'200px'}
                           fontSize={40}/>
        <CardTitleAndValue textAlign={'center'} title={'Equinox Progression'} width={'400px'}>
          <Typography
            textAlign={'center'}>{notateNumber(equinox.currentCharge, 'Whole')} / {notateNumber(equinox.chargeRequired, 'Whole')}</Typography>
          <ProgressBar bgColor={yellow} percent={equinox.currentCharge / equinox.chargeRequired * 100} width={300}/>
          <Box sx={{ textAlign: 'center' }}>
            <Timer type={'countdown'}
                   placeholder={'Upgrade is ready'}
                   date={equinox.timeToFull}
                   lastUpdated={state?.lastUpdated}/>
          </Box>
        </CardTitleAndValue>
      </Stack>

      <Typography variant={'h4'} mb={3}>Challenges</Typography>
      <Stack mb={1} gap={3} direction={'row'} flexWrap={'wrap'}>
        {equinox.challenges?.map(({ label, reward, current, active }, index) => {
          return <Card key={label + `${index}`} sx={{
            width: 300,
            border: current === -1 ? '' : '1px solid #dbe07b',
            opacity: current === -1 ? 0.5 : 1,
            display: active ? 'inherited' : 'none'
          }} raised={current !== -1}>
            <CardContent>
              <Typography align="center">{cleanUnderscore(label.capitalize())}</Typography>
              <Typography align="center" sx={{ mt: 2 }}>{cleanUnderscore(reward)}</Typography>
              {current !== -1 ? <Typography align="center" sx={{ mt: 2 }}>Current : {current}</Typography> : null}
            </CardContent>
          </Card>
        })}
      </Stack>

      <Typography variant={'h4'} mt={3} mb={3}>Upgrades</Typography>
      <Stack mb={1} gap={3} direction={'row'} flexWrap={'wrap'}>
        {equinox.upgrades?.map(({ name, desc, lvl, maxLvl, unlocked }, index) => {
          return <Card key={name + `${index}`} sx={{
            width: 300,
            border: unlocked ? '1px solid #dbe07b' : '',
            opacity: unlocked ? 1 : 0.5,
          }} raised={unlocked !== -1}>
            <CardContent>
              <Stack direction={'row'} alignItems={'center'} gap={1}>
                {name !== 'Hmm...' ? <img src={`${prefix}etc/Dream_Upgrade_${index + 1}.png`}
                                          alt="" width={64} height={64} style={{ objectFit: 'contain' }}/> : null}
                <Typography sx={{ fontSize: 22 }} width={'100%'}
                            align="center">{cleanUnderscore(name.capitalize())}</Typography>
              </Stack>
              {desc.map((line, index) => {
                return <Typography key={`${index}`} align="center" sx={{ mt: 2 }}>{cleanUnderscore(line)}</Typography>
              })}
              <Typography align="center" sx={{ mt: 2 }}>Lvl : {lvl}/{maxLvl}</Typography>
            </CardContent>
          </Card>
        })}
      </Stack>
    </>
  );
};

const CardTitleAndValue = ({ cardSx, title, value, children, width = 'fit-content', fontSize = 20 }) => {
  return <Card sx={{ my: { xs: 0, md: 3 }, width: { width }, ...cardSx }}>
    <CardContent>
      <Typography align="center" sx={{ fontSize: 20 }} color="text.secondary" gutterBottom>{title}</Typography>
      {value ? <Typography sx={{ fontSize: { fontSize } }} align="center">{value}</Typography> : children}
    </CardContent>
  </Card>
}

export default Equinox;