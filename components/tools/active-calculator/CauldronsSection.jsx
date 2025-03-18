import { Divider, Stack, Typography } from '@mui/material';
import { Section } from '@components/tools/active-calculator/common';
import React, { useContext } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { AppContext } from '@components/common/context/AppProvider';
import { numberWithCommas, prefix } from '@utility/helpers';

const CauldronsSection = ({ selectedChar, lastUpdated, resultsOnly }) => {
  const { state } = useContext(AppContext);
  const [snapshottedChar] = useLocalStorage({ key: 'activeDropPlayer', defaultValue: null });
  const [snapshottedAcc] = useLocalStorage({ key: 'activeDropAcc', defaultValue: null });

  const calculateDecantDiffArray = (currentArray, snapshotArray) => {
    if (!currentArray?.length || !snapshotArray?.length) return {};
    return currentArray.map((current, index) => {
      const snapshot = snapshotArray[index];
      const capDiff = current.decantCap.progress - snapshot.decantCap.progress;
      const rateDiff = current.decantRate.progress - snapshot.decantRate.progress;
      return {
        index,
        decantCap: { progress: capDiff },
        decantRate: { progress: rateDiff },
        capPerHour: (capDiff / ((lastUpdated - snapshottedAcc?.snapshotTime) / 1000 / 60)) * 60,
        ratePerHour: (rateDiff / ((lastUpdated - snapshottedAcc?.snapshotTime) / 1000 / 60)) * 60
      };
    });
  }
  const cauldronsDiff = calculateDecantDiffArray(state?.account?.alchemy?.liquidCauldrons, snapshottedAcc?.alchemy?.liquidCauldrons);

  return <Section title={'Cauldron Progress'}>
    {!resultsOnly ? <>
      <Stack>
        <Typography variant={'body1'} sx={{ fontWeight: 'bold' }}>Snapshot</Typography>
        <AllCauldrons cauldrons={snapshottedAcc?.alchemy?.liquidCauldrons}/>
      </Stack>
      <Divider flexItem orientation={'vertical'} sx={{ mx: 2 }}/>
      <Stack>
        <Typography variant={'body1'} sx={{ fontWeight: 'bold' }}>Current</Typography>
        <AllCauldrons cauldrons={state?.account?.alchemy?.liquidCauldrons}/>
      </Stack>
    </> : null}
    <Stack>
      <Typography variant={'body1'} sx={{ fontWeight: 'bold' }}>Result</Typography>
      <AllCauldrons cauldrons={cauldronsDiff}/>
    </Stack>
  </Section>
};

const AllCauldrons = ({ cauldrons }) => {
  if (!Array.isArray(cauldrons)) return null;
  return <Stack divider={<Divider sx={{ my: 1 }}/>}>
    {cauldrons?.map((cauldron, index) => {
      return <Cauldron index={index} key={`cauldron-${index}`} {...cauldron} />
    })}
  </Stack>;
}

const Cauldron = ({ index, decantCap, decantRate, capPerHour, ratePerHour }) => {
  const capPerHourText = capPerHour > 0 ? ` -- ${numberWithCommas(Math.floor(capPerHour))} / hr` : '';
  const capPerDayText = capPerHour > 0 ? ` -- ${numberWithCommas(Math.floor(capPerHour * 24))} / day` : '';
  const ratePerHourText = ratePerHour > 0 ? ` -- ${numberWithCommas(Math.floor(ratePerHour))} / hr` : '';
  const ratePerDayText = ratePerHour > 0 ? ` -- ${numberWithCommas(Math.floor(ratePerHour * 24))} / day` : '';
  return <Stack direction={'row'} alignItems={'center'} gap={1}>
    <img style={{ width: 32, height: 32 }} src={`${prefix}data/aJarL${index}.png`} alt=""/>
    <Stack>
      <Typography variant={'body2'}>
        Cap: {numberWithCommas(Math.floor(decantCap.progress))}{capPerHourText}{capPerDayText}
      </Typography>
      <Typography variant={'body2'}>
        Rate: {numberWithCommas(Math.floor(decantRate.progress))}{ratePerHourText}{ratePerDayText}
      </Typography>
    </Stack>
  </Stack>
}

export default CauldronsSection;
