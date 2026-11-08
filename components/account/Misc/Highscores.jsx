import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { cleanUnderscore, formatNum } from '@utility/helpers';
import Panel from '@components/common/cards/Panel';
import ItemCard from '@components/common/cards/ItemCard';
import InfoButton from '@components/common/InfoButton';

const NOTE_ROW_SX = { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 2 };
const NAME_SX = { display: 'inline-flex', alignItems: 'center', gap: 0.5 };

// A score's upgrades (Hoops, Darts), with the points spent on them, as the shrine note's blocks: the header, then the
// upgrades under a line. A line between upgrades too, since most wrap to two lines. A locked one is dimmed, and says when it
// unlocks.
const UPGRADE_ROWS_SX = { '& > * + *': { borderTop: 1, borderColor: 'divider', pt: 0.75 } };
const UpgradesNote = ({ name, totalPoints, upgrades }) => <Stack gap={1.25}>
  <Box>
    <Typography variant={'cardTitle'} component={'div'}>{`${name} upgrades`}</Typography>
    <Typography variant={'body2'} color={'text.secondary'}>{`${formatNum(totalPoints ?? 0)} total points`}</Typography>
  </Box>
  <ItemCard.Section label={'Upgrades'}>
    <Stack gap={0.75} sx={UPGRADE_ROWS_SX}>
      {upgrades.map((upgrade, index) => {
        const locked = !upgrade?.unlocked && upgrade?.pointsToUnlock > 0;
        return <Box key={index} sx={[NOTE_ROW_SX, locked && { color: 'text.muted' }]}>
          <Typography variant={'body2'}>{cleanUnderscore(upgrade?.description)}</Typography>
          <Typography variant={'body2'} sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
            {locked ? `At ${formatNum(upgrade.pointsToUnlock)} pts` : formatNum(upgrade?.level ?? 0, 'level')}
          </Typography>
        </Box>;
      })}
    </Stack>
  </ItemCard.Section>
</Stack>;

// A name and a score per row: two columns, so a Panel list rather than a table (Tables board, "A table needs a
// header" with 3 or more columns). A score's upgrades are an ⓘ note on its row, not a group in the card: opened in it, they
// grew the card to twice its scores, and every card after it on General's flowing columns moved.
const Highscores = ({ title, highscore }) => {
  const sorted = (highscore ?? []).toSorted((a, b) => (b?.score ?? 0) - (a?.score ?? 0));
  return <Panel title={title}>
    {sorted.map((row) => {
      const name = row?.name?.capitalize();
      const label = row?.upgrades?.length ? <Box component={'span'} sx={NAME_SX}>
        {name}
        <InfoButton label={`${name} upgrades`} maxWidth={320}>
          <UpgradesNote name={name} totalPoints={row?.totalPoints} upgrades={row.upgrades}/>
        </InfoButton>
      </Box> : name;
      return <Panel.KV key={row?.name} label={label} value={formatNum(Number(row?.score) || 0)}/>;
    })}
  </Panel>;
};

export default Highscores;
