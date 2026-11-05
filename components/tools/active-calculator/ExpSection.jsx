import { Box, Stack } from '@mui/material';
import NumberField from '@components/common/NumberField';
import ItemCard from '@components/common/cards/ItemCard';
import { formatDuration, formatNum } from '@utility/helpers';
import { counter, CounterTable, elapsedHours, Section } from '@components/tools/active-calculator/common';
import React, { useContext } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { getExpDiff, getExpToLevel } from '@parsers/misc/activeCalculator';
import { AppContext } from '@components/common/context/AppProvider';

// A wait at this rate, "-" while nothing is coming in
const timeAt = (exp, expPerMinute) => (expPerMinute > 0 ? formatDuration((exp / expPerMinute) * 60) : '-');

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
  const levelProgress = currentChar?.expReq > 0 ? (currentChar?.exp / currentChar?.expReq) * 100 : null;

  return <Section title={'Exp'}>
    <CounterTable hours={elapsedHours(lastUpdated, snapshottedChar?.snapshotTime)} resultsOnly={resultsOnly} rows={[
      counter('Level', snapshotChar?.level, currentChar?.level, { kind: 'level', noRate: true }),
      // Earned, not the two bars' difference: a level up resets the bar
      { ...counter('EXP', snapshotChar?.exp, currentChar?.exp, { kind: 'amount' }), gained: expDiff?.expEarned ?? null }
    ]}/>
    <Stack gap={1.5} sx={{ p: 2 }}>
      <ItemCard.Facts rows={[
        ['EXP this level', `${formatNum(currentChar?.exp)} / ${formatNum(currentChar?.expReq, 'whole')} (${formatNum(levelProgress, 'pct')})`],
        ['EXP to next level', formatNum(expDiff?.expToLevel, 'whole')],
        ['Time to next level', timeAt(expDiff?.expToLevel, expDiff?.expPerMinute)]
      ]}/>
      <Box>
        <NumberField
          label="Target level"
          value={targetLevel === '' ? null : Number(targetLevel)}
          onChange={(next) => setTargetLevel(next == null ? '' : String(next))}
          min={(currentChar?.level ?? 0) + 1}
          integer
          sx={{ width: 180 }}
        />
      </Box>
      {hasValidTarget ? <ItemCard.Facts rows={[
        [`EXP to Lv ${parsedTarget}`, formatNum(expToTarget, 'whole')],
        [`Time to Lv ${parsedTarget}`, timeAt(expToTarget, expDiff?.expPerMinute)]
      ]}/> : null}
    </Stack>
  </Section>;
};

export default ExpSection;
