import { Stack, Typography, Divider } from '@mui/material';
import React from 'react';
import { numberWithCommas, cleanUnderscore } from '@utility/helpers';
import Panel from '@components/common/cards/Panel';
import InfoButton from '@components/common/InfoButton';
import { TitleAndValue } from '@components/common/styles';

// A name and a score per row: two columns, so a Panel list rather than a table (Tables board, "A table needs a
// header" with 3 or more columns). A score with upgrades explains them from its i.
const Highscores = ({ title, highscore }) => {
  const sorted = [...(highscore ?? [])].sort((a, b) => b.score - a.score);
  return <Panel title={title}>
    {sorted.map((row) => <Panel.KV key={row.name} value={numberWithCommas(parseInt(row.score))} label={<Stack
      direction={'row'} alignItems={'center'} gap={0.5} component={'span'}>
      {row.name.capitalize()}
      {row.upgrades?.length ? <InfoButton label={row.name.capitalize()} maxWidth={450}><UpgradesNote row={row}/></InfoButton> : null}
    </Stack>}/>)}
  </Panel>;
};

const UpgradesNote = ({ row }) => <Stack gap={1}>
  {row.totalPoints !== undefined && (
    <>
      <TitleAndValue
        title="Total Points"
        value={numberWithCommas(row.totalPoints)}
        boldTitle
      />
      <Divider sx={{ my: 0.5 }}/>
    </>
  )}
  <Stack gap={1}>
    {row.upgrades.map((upgrade, index) => (
      <Stack key={index} gap={0.5}>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {cleanUnderscore(upgrade.description)}
        </Typography>
        <Stack gap={0.25}>
          <Typography variant="caption">Level: {upgrade.level || 0}</Typography>
          {!upgrade.unlocked ? <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {'Unlocks at ' + upgrade.pointsToUnlock + ' points'}
          </Typography> : null}
        </Stack>
        {index < row.upgrades.length - 1 && <Divider sx={{ mt: 0.5 }}/>}
      </Stack>
    ))}
  </Stack>
</Stack>;

export default Highscores;
