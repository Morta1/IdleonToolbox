import { Card, CardContent, Checkbox, FormControlLabel, Stack, Typography } from '@mui/material';
import React, { useContext } from 'react';
import { AppContext } from '../../../components/common/context/AppProvider';
import Timer from '../../../components/common/Timer';
import { cleanUnderscore, notateNumber, prefix } from '../../../utility/helpers';
import { NextSeo } from 'next-seo';
import { CardTitleAndValue, TitleAndValue } from '@components/common/styles';
import Tooltip from '@components/Tooltip';
import { IconInfoCircleFilled } from '@tabler/icons-react';

const Equinox = () => {
  const { state } = useContext(AppContext);
  const [showAll, setShowAll] = React.useState(false);
  const equinox = state?.account?.equinox;
  if (!equinox) {
    return <Typography variant={'h2'} textAlign={'center'} mt={3}>Unlock Equinox first</Typography>;
  }
  return (
    <>
      <NextSeo
        title="Equinox | Idleon Toolbox"
        description="Equinox progression"
      />
      <Stack mb={1} direction={'row'} gap={{ xs: 1, md: 3 }} flexWrap={'wrap'}>
        <CardTitleAndValue title={'Fill rate'}>
          <Stack direction="row" alignItems={'center'} gap={1}>
            <Typography>{Math.round(equinox.chargeRate)} / hr</Typography>
            <Tooltip
              title={<Stack>
                {equinox?.breakdown?.map(({ name, value }, index) => <TitleAndValue key={`${name}-${index}`}
                                                                                    title={name}
                                                                                    titleStyle={{ width: 120 }}
                                                                                    value={value.toFixed(2).replace('.00', '')}/>)}

              </Stack>}>
              <IconInfoCircleFilled size={18}/>
            </Tooltip>
          </Stack>
        </CardTitleAndValue>
        <CardTitleAndValue title={'Equinox Progression'} value={`${notateNumber(equinox.currentCharge, 'Whole')} / ${notateNumber(equinox.chargeRequired, 'Whole')}`} />
        <CardTitleAndValue title={'Time to full'} value={<Timer type={'countdown'}
                                                                placeholder={'Upgrade is ready'}
                                                                date={equinox.timeToFull}
                                                                lastUpdated={state?.lastUpdated}/>} />
      </Stack>

      <Stack mb={3} direction={'row'} gap={2} flexWrap={'wrap'} alignItems={'center'}>
        <Typography variant={'h4'}>Challenges</Typography>
        <FormControlLabel
          control={<Checkbox checked={showAll} onChange={() => setShowAll(!showAll)}/>}
          name={'Show all challenges'}
          label="Show all challenges"/>
      </Stack>
      <Stack mb={1} gap={3} direction={'row'} flexWrap={'wrap'}>
        {equinox.challenges?.map(({ label, reward, current, active }, index) => {
          if (!active && !showAll) return null;
          return <Card key={label + `${index}`} sx={{
            width: 350,
            border: active ? '1px solid' : '',
            borderColor: active ? 'success.light' : '',
            opacity: current !== -1 ? 1 : .5
          }}>
            <CardContent>
              <Stack>
                <Typography>Challenge: </Typography>
                <Typography>{cleanUnderscore(label.capitalize())}</Typography>
                <Typography sx={{ mt: 3 }}>Reward: </Typography>
                <Typography>{cleanUnderscore(reward)}</Typography>
                {current !== -1 ? <Typography sx={{ mt: 3 }}>Progress: </Typography> : null}
                {current !== -1 ? <Typography>{current}</Typography> : null}
              </Stack>
            </CardContent>
          </Card>
        })}
      </Stack>

      <Typography variant={'h4'} mt={3} mb={3}>Upgrades</Typography>
      <Stack mb={1} gap={3} direction={'row'} flexWrap={'wrap'}>
        {equinox.upgrades?.map(({ name, desc, lvl, maxLvl, unlocked, bonus }, index) => {
          if (name === 'Hmm...') return null;
          return <Card key={name + `${index}`} sx={{
            width: 350,
            border: lvl >= maxLvl ? '1px solid' : '',
            borderColor: lvl >= maxLvl ? 'success.main' : '',
            opacity: unlocked ? 1 : 0.5,
          }}>
            <CardContent>
              <Stack direction={'row'} alignItems={'center'} gap={1}>
                {name !== 'Hmm...' ? <img src={`${prefix}etc/Dream_Upgrade_${index + 1}.png`}
                                          alt="dream-icon" width={48} height={48} style={{ objectFit: 'contain' }}/> : null}
                <Typography sx={{ fontSize: 22 }}
                            align="center">{cleanUnderscore(name.capitalize())}</Typography>
              </Stack>
              {desc.map((line, index) => {
                return <Typography key={`${index}`} align="center" sx={{ mt: 2 }}>{cleanUnderscore(line)}</Typography>
              })}
              {index === 9 ? <Typography align="center" sx={{ mt: 2 }}>Bosses killed: {bonus}</Typography> : null}
              <Typography align="center" sx={{ mt: 2 }}>Lvl : {lvl}/{maxLvl}</Typography>
            </CardContent>
          </Card>
        })}
      </Stack>
    </>
  );
};

export default Equinox;