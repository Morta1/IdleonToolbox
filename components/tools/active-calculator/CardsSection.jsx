import { Divider, Stack, Typography } from '@mui/material';
import { Section } from '@components/tools/active-calculator/common';
import React, { useContext } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { compareCards } from '@parsers/misc/activeCalculator';
import { AppContext } from '@components/common/context/AppProvider';
import { CardAndBorder } from '@components/common/styles';
import { numberWithCommas } from '@utility/helpers';

const CardsSection = ({ selectedChar, lastUpdated }) => {
  const { state } = useContext(AppContext);
  const [snapshottedAcc] = useLocalStorage({ key: 'activeDropAcc', defaultValue: null });
  const diff = compareCards(snapshottedAcc?.cards, state?.account?.cards, lastUpdated, snapshottedAcc?.snapshotTime);

  return <Section title={'Cards'}>
    <Stack>
      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Result</Typography>
      <Stack direction={'row'} gap={2} flexWrap={'wrap'} divider={<Divider flexItem orientation={'vertical'}/>}>
        {diff.map((card) => {
          const { cardIndex, amount, perHour, hoursForNextLevel } = card;
          return <Stack key={cardIndex} alignItems={'flex-start'}>
            <div
              style={{ position: 'relative' }}>
              <CardAndBorder {...card} />
            </div>
            <Typography variant={'body2'} mt={1.5}>{numberWithCommas(amount)}</Typography>
            <Typography variant={'body2'}>{numberWithCommas(perHour > 1 ? Math.floor(perHour) : perHour)} / hr</Typography>
            {hoursForNextLevel !== 'N/A' ? <Typography variant={'body2'}>To next star: {numberWithCommas(hoursForNextLevel)} hrs</Typography> : null}
          </Stack>
        })}
      </Stack>
    </Stack>
  </Section>
};

export default CardsSection;
