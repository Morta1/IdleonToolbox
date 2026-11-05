import { Box, Stack, Typography } from '@mui/material';
import { Section } from '@components/tools/active-calculator/common';
import React, { useContext } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import { compareCards } from '@parsers/misc/activeCalculator';
import { AppContext } from '@components/common/context/AppProvider';
import CardGrid from '@components/common/cards/CardGrid';
import { CardAndBorder, isSectionFailed } from '@components/common/styles';
import { formatDuration, formatNum } from '@utility/helpers';

const CardsSection = ({ lastUpdated }) => {
  const { state } = useContext(AppContext);
  const [snapshottedAcc] = useLocalStorage({ key: 'activeDropAcc', defaultValue: null });
  const failed = isSectionFailed(state?.account, 'cards');
  const diff = failed ? [] : compareCards(snapshottedAcc?.cards, state?.account?.cards, lastUpdated, snapshottedAcc?.snapshotTime);

  return <Section title={'Cards'}>
    <Box sx={{ p: 2 }}>
      {failed || !diff.length ? <Typography variant={'body2'} color={'text.secondary'}>
        {failed ? 'Cards failed to load, so there is nothing to compare.' : 'No card has moved since the snapshot.'}
      </Typography> : <CardGrid size={'icon'}>
        {diff.map((card) => {
          const { cardIndex, displayName, amount } = card;
          // The parser's rates are strings ("12.35", "N/A"): a number or "-"
          const perHour = Number(card?.perHour);
          const hoursLeft = Number(card?.hoursForNextLevel);
          return <Stack key={cardIndex} gap={0.25}>
            <Box sx={{ position: 'relative', width: 'fit-content', mb: 1 }}>
              {/* The card's own note reads the real count: the row's amount is what it gained */}
              <CardAndBorder {...card} amount={state?.account?.cards?.[displayName]?.amount}/>
            </Box>
            <Typography variant={'value'} component={'div'}>{formatNum(amount, 'whole')}</Typography>
            <Typography variant={'caption'} component={'div'}>{Number.isFinite(perHour) ? formatNum(perHour, 'rate') : '-'}</Typography>
            {Number.isFinite(hoursLeft) ? <Typography variant={'caption'} component={'div'} color={'text.secondary'}>
              Next star in <Box component={'span'} sx={{ whiteSpace: 'nowrap' }}>{formatDuration(hoursLeft * 3600)}</Box>
            </Typography> : null}
          </Stack>;
        })}
      </CardGrid>}
    </Box>
  </Section>;
};

export default CardsSection;
