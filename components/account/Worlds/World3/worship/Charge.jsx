import React, { useContext, useMemo } from 'react';
import { Card, CardContent, Stack, Typography } from '@mui/material';
import { AppContext } from '@components/common/context/AppProvider';
import ProgressBar from '@components/common/ProgressBar';
import { cleanUnderscore, prefix } from '@utility/helpers';
import Tooltip from '../../../../Tooltip';
import Box from '@mui/material/Box';
import Timer from '../../../../common/Timer';
import { getChargeWithSyphon, getClosestWorshiper } from '@parsers/worship';

const Charge = () => {
  const { state } = useContext(AppContext);

  const closestToFull = getClosestWorshiper(state?.characters);
  const {
    bestWizard,
    totalCharge,
    bestChargeSyphon,
    totalChargeRate,
    timeToOverCharge,
  } = useMemo(() => getChargeWithSyphon(state?.characters), [state?.characters]);

  return (
    <>
      <Typography variant={'caption'}>* make sure you login to every character to "apply" their charge before using
        syphon</Typography>
      <Stack mb={1} direction={'row'} gap={{ xs: 1, md: 3 }} flexWrap={'wrap'}>
        <CardTitleAndValue title={'Total Charge'} value={Math.round(totalCharge)}/>
        <CardTitleAndValue title={'Total Daily Charge'} value={`${Math.round(24 * totalChargeRate)}%`}/>
        <CardTitleAndValue title={'First to full'}>
          <Typography>{closestToFull?.character}</Typography>
          {isFinite(closestToFull?.timeLeft) ? <Timer type={'countdown'}
                                                      placeholder={'You have overflowing charge'}
                                                      date={new Date().getTime() + closestToFull?.timeLeft}
                                                      lastUpdated={state?.lastUpdated}/> :
            <Typography>Everyone</Typography>}
        </CardTitleAndValue>
        <CardTitleAndValue title={`Best Wizard -${bestWizard?.name}`}>
          <Typography>Charge with syphon ({((bestWizard?.worship?.maxCharge || 0) + bestChargeSyphon)})</Typography>
          <ProgressBar percent={(totalCharge / ((bestWizard?.worship?.maxCharge || 0) + bestChargeSyphon)) * 100}
                       bgColor={'secondary.dark'}/>
          <Timer type={'countdown'}
                 placeholder={'You have overflowing charge'}
                 date={timeToOverCharge}
                 lastUpdated={state?.lastUpdated}/>
        </CardTitleAndValue>
      </Stack>
      <Stack gap={3} direction="row" flexWrap="wrap">
        {state?.characters?.map(({ worship, tools, name, classIndex, skillsInfo }, index) => {
          const worshipProgress = (worship?.currentCharge / (worship?.maxCharge || worship?.currentCharge)) * 100;
          const skull = tools?.find(({ name }) => name?.includes('Skull'));
          const timeLeft = (worship?.maxCharge - worship?.currentCharge) / worship?.chargeRate * 1000 * 3600;
          return (
            <Card key={`${name}-${index}`} sx={{ width: 300 }}>
              <CardContent>
                <Stack direction={'row'}>
                  <img src={`${prefix}data/ClassIcons${classIndex}.png`} alt=""/>
                  {skull && <Tooltip title={cleanUnderscore(skull.name)}>
                    <img style={{ height: 38 }} src={`${prefix}data/${skull.rawName}.png`} alt=""/>
                  </Tooltip>}
                </Stack>
                <Typography sx={{ typography: { xs: 'body2', sm: 'body1' } }}>{name}</Typography>
                <Typography variant={'caption'}>Worship
                  lv. {skillsInfo?.worship?.level}</Typography>
                <ProgressBar percent={worshipProgress > 100 ? 100 : worshipProgress} bgColor={'secondary.dark'}/>
                <Box my={2}>
                  <Typography>
                    Charge: {worship?.currentCharge} / {worship?.maxCharge}
                  </Typography>
                  <Typography>Charge Rate: {Math.round(worship?.chargeRate * 24)}% / day</Typography>
                  <Stack direction={'row'} gap={1}>
                    <Typography>Time to full: </Typography>
                    <Timer type={'countdown'}
                           sx={{ color: 'error.light' }}
                           placeholder={'Full'}
                           date={new Date().getTime() + timeLeft}
                           lastUpdated={state?.lastUpdated}/>
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </>
  );
};
const CardTitleAndValue = ({ cardSx, title, value, children }) => {
  return <Card sx={{ my: { xs: 0, md: 3 }, mb: {xs: 2}, width: 'fit-content', ...cardSx }}>
    <CardContent>
      <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>{title}</Typography>
      {value ? <Typography>{value}</Typography> : children}
    </CardContent>
  </Card>
}

export default Charge;
