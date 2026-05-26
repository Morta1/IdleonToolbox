import { Divider, Stack, TextField, Typography } from '@mui/material';
import { notateNumber } from '@utility/helpers';
import { Section } from '@components/tools/active-calculator/common';
import React, { useContext } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { formatMinutesToTime, getExpDiff, getExpToLevel } from '@parsers/misc/activeCalculator';
import { AppContext } from '@components/common/context/AppProvider';

const ExpSection = ({ selectedChar, lastUpdated, resultsOnly }) => {
  const { state } = useContext(AppContext);
  const [snapshottedChar] = useLocalStorage({ key: 'activeDropPlayer', defaultValue: null });
  const [targetLevel, setTargetLevel] = useLocalStorage({ key: 'activeExpTargetLevel', defaultValue: '' });
  const snapshotChar = snapshottedChar?.skillsInfo?.character;
  const currentChar = state?.characters?.[selectedChar]?.skillsInfo?.character;
  const expDiff = getExpDiff(snapshottedChar, state?.characters?.[selectedChar], lastUpdated);

  const parsedTarget = parseInt(targetLevel, 10);
  const hasValidTarget = currentChar && Number.isFinite(parsedTarget) && parsedTarget > currentChar.level;
  const expToTarget = hasValidTarget ? getExpToLevel(currentChar, parsedTarget) : 0;
  const timeToTarget = hasValidTarget && expDiff?.expPerMinute > 0
    ? formatMinutesToTime(expToTarget / expDiff.expPerMinute)
    : 'N/A';

  return <Section title={'Exp'}>
    {!resultsOnly ? <>
      <Stack>
        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Snapshot</Typography>
        <Typography variant="body2">Lv. {snapshotChar?.level}</Typography>
        <Typography
          variant="body2">{notateNumber(snapshotChar?.exp)} / {notateNumber(snapshotChar?.expReq)} ({(snapshotChar?.exp / snapshotChar?.expReq * 100).toFixed(2)}%)</Typography>
      </Stack>
      <Divider flexItem orientation={'vertical'} sx={{ mx: 2 }}/>

      <Stack>
        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Current</Typography>
        <Typography variant="body2">Lv. {currentChar?.level}</Typography>
        <Typography
          variant="body2">{notateNumber(currentChar?.exp)} / {notateNumber(currentChar?.expReq)} ({(currentChar?.exp / currentChar?.expReq * 100).toFixed(2)}%) </Typography>
      </Stack>
    </> : null}
    <Stack>
      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Result</Typography>
      <Typography
        variant="body2">Earned: {notateNumber(expDiff?.expEarned)} ({(expDiff?.expEarned / expDiff?.expReq * 100).toFixed(2)}%)</Typography>
      <Divider sx={{ my: .5 }}/>
      <Typography variant="body2">Per min: {notateNumber(expDiff?.expPerMinute)} / min</Typography>
      <Divider sx={{ my: .5 }}/>
      <Typography variant="body2">Per hour: {notateNumber(expDiff?.expPerHour)} / hr</Typography>
      <Divider sx={{ my: .5 }}/>
      <Typography variant="body2">Exp to next level: {notateNumber(expDiff?.expToLevel)}</Typography>
      <Divider sx={{ my: .5 }}/>
      <Typography variant="body2">Time to next level: {expDiff?.timeToLevel}</Typography>
      <Divider sx={{ my: .5 }}/>
      <TextField
        size="small"
        type="number"
        label="Target level"
        value={targetLevel}
        onChange={(e) => setTargetLevel(e.target.value)}
        slotProps={{ htmlInput: { min: (currentChar?.level ?? 0) + 1 } }}
        sx={{ mt: .5, width: 140 }}
      />
      {hasValidTarget ? <>
        <Typography variant="body2" sx={{ mt: .5 }}>Exp to lv. {parsedTarget}: {notateNumber(expToTarget)}</Typography>
        <Divider sx={{ my: .5 }}/>
        <Typography variant="body2">Time to lv. {parsedTarget}: {timeToTarget}</Typography>
      </> : null}
    </Stack>
  </Section>
};

export default ExpSection;
