import React from 'react';
import { Card, CardContent, Chip, Divider, Stack, Typography } from '@mui/material';
import { cleanUnderscore, notateNumber, prefix } from '@utility/helpers';

// Same stray glyphs Grimoire/Compass/Tesseract strip from their own upgrade text.
const stripGlyphs = (str) => (str ?? '').replace(/[船般航舞製千膛]/g, '');
const cleanText = (str) => cleanUnderscore(stripGlyphs(str));

const RoyalStatues = ({ royalStatues, statueFlair }) => {
  return (
    <Stack direction="column" gap={4}>
      <Stack direction="row" gap={2} flexWrap="wrap" alignItems="stretch">
        {royalStatues?.map(({ index, description, level, bonus, upgradeOdds, costItem, named }) => (
          <Card key={index}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', width: 300, minHeight: 190 }}>
              <Stack direction="row" gap={2} alignItems="center">
                <img style={{ width: 32, height: 32 }} src={`${prefix}data/${costItem}.png`} alt=""/>
                <Typography>Statue {index} (Lv {level})</Typography>
                {!named ? <Chip size="small" variant="outlined" label="Unreleased"/> : null}
              </Stack>
              <Divider sx={{ my: 1 }}/>
              <Typography>{named ? cleanText(description) : 'Not yet released in-game.'}</Typography>
              <Divider sx={{ my: 1, mt: 'auto' }}/>
              <Typography variant="body2">Bonus: {notateNumber(bonus)}</Typography>
              <Stack direction="row" gap={1} alignItems="center">
                <Typography variant="body2">Upgrade odds: 1 in {notateNumber(Math.round(1 / upgradeOdds))}</Typography>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Divider/>

      <Stack direction="row" gap={2} alignItems="center">
        <Typography variant="h6">Statue Flair</Typography>
        {!statueFlair?.unlocked ? <Chip size="small" variant="outlined" label="Locked"/> : null}
      </Stack>
      <Typography variant="body2" color="text.secondary">
        Enhances a regular statue's EXP multiplier once unlocked by the Statue Flair armory upgrade.
      </Typography>
      <Stack direction="row" gap={2} flexWrap="wrap" alignItems="stretch">
        {statueFlair?.statues?.map(({ index, name, level, maxLevel, cost, bonus, expMulti, costItem }) => (
          <Card key={index} sx={{ opacity: statueFlair?.unlocked ? 1 : 0.5 }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', width: 240, minHeight: 150 }}>
              <Typography>{cleanText(name)} ({level} / {maxLevel})</Typography>
              <Divider sx={{ my: 1 }}/>
              <Typography variant="body2">EXP multi: {notateNumber(expMulti, 'MultiplierInfo')}x</Typography>
              <Typography variant="body2">Bonus: +{notateNumber(bonus)}%</Typography>
              <Stack direction="row" gap={1} alignItems="center" sx={{ mt: 'auto' }}>
                <img style={{ width: 20, height: 20 }} src={`${prefix}data/${costItem}.png`} alt=""/>
                <Typography variant="body2">Cost: {notateNumber(cost)}</Typography>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Stack>
  );
};

export default RoyalStatues;
